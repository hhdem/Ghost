import Controller from '@ember/controller';
import windowProxy from 'ghost-admin/utils/window-proxy';
import {alias} from '@ember/object/computed';
import {inject as service} from '@ember/service';
import {slugify} from '@tryghost/string';
import {task} from 'ember-concurrency';

export default Controller.extend({
    notifications: service(),
    router: service(),

    showDeleteTagModal: false,

    tag: alias('model'),

    actions: {
        setProperty(propKey, value) {
            this._saveTagProperty(propKey, value);
        },

        toggleDeleteTagModal() {
            this.toggleProperty('showDeleteTagModal');
        },

        deleteTag() {
            return this.tag.destroyRecord().then(() => {
                return this.transitionToRoute('tags');
            }, (error) => {
                return this.notifications.showAPIError(error, {key: 'tag.delete'});
            });
        },

        save() {
            return this.save.perform();
        },

        toggleUnsavedChangesModal(transition) {
            let leaveTransition = this.leaveScreenTransition;

            if (!transition && this.showUnsavedChangesModal) {
                this.set('leaveScreenTransition', null);
                this.set('showUnsavedChangesModal', false);
                return;
            }

            if (!leaveTransition || transition.targetName === leaveTransition.targetName) {
                this.set('leaveScreenTransition', transition);

                // if a save is running, wait for it to finish then transition
                if (this.save.isRunning) {
                    return this.save.last.then(() => {
                        transition.retry();
                    });
                }

                // we genuinely have unsaved data, show the modal
                this.set('showUnsavedChangesModal', true);
            }
        },

        leaveScreen() {
            this.tag.rollbackAttributes();
            return this.leaveScreenTransition.retry();
        }
    },

    _saveTagProperty(propKey, newValue) {
        let tag = this.tag;
        let isNewTag = tag.get('isNew');
        let currentValue = tag.get(propKey);

        if (newValue) {
            newValue = newValue.trim();
        }

        // Quit if there was no change
        if (newValue === currentValue) {
            return;
        }

        tag.set(propKey, newValue);

        // Generate slug based on name for new tag when empty
        if (propKey === 'name' && !tag.get('slug') && isNewTag) {
            let slugValue = slugify(newValue);
            if (/^#/.test(newValue)) {
                slugValue = 'hash-' + slugValue;
            }
            tag.set('slug', slugValue);
        }

        // TODO: This is required until .validate/.save mark fields as validated
        tag.get('hasValidated').addObject(propKey);
    },

    save: task(function* () {
        let tag = this.tag;
        let isNewTag = tag.get('isNew');
        try {
            let savedTag = yield tag.save();
            // replace 'new' route with 'tag' route
            this.replaceRoute('tag', savedTag);

            // update the URL if the slug changed
            if (!isNewTag) {
                let currentPath = window.location.hash;

                let newPath = currentPath.split('/');
                if (newPath[newPath.length - 1] !== savedTag.get('slug')) {
                    newPath[newPath.length - 1] = savedTag.get('slug');
                    newPath = newPath.join('/');

                    windowProxy.replaceState({path: newPath}, '', newPath);
                }
            }
            return savedTag;
        } catch (error) {
            if (error) {
                this.notifications.showAPIError(error, {key: 'tag.save'});
            }
        }
    }),

    fetchTag: task(function* (slug) {
        this.set('isLoading', true);

        yield this.store.queryRecord('tag', {slug}).then((tag) => {
            this.set('tag', tag);
            this.set('isLoading', false);
            return tag;
        });
    })
});
