import Controller from '@ember/controller';
import {action} from '@ember/object';
import {inject as service} from '@ember/service';
import {tracked} from '@glimmer/tracking';

import DeleteFileModal from '../components/files/delete-file-modal';
import EditFileModal from '../components/files/edit-file-modal';

const TYPES = [{
    name: 'All files',
    value: null
}, {
    name: 'Images',
    value: 'images'
}, {
    name: 'Media',
    value: 'media'
}, {
    name: 'Files',
    value: 'files'
}];

export default class FilesController extends Controller {
    @service router;
    @service modals;

    @tracked type = null;

    // default values for these are set in constructor and defined in `helpers/reset-query-params`
    queryParams = ['type'];

    availableTypes = TYPES;

    get filesInfinityModel() {
        return this.model;
    }

    get selectedType() {
        return this.availableTypes.findBy('value', this.type) || {value: '!unknown'};
    }

    get showingAll() {
        const {type} = this;

        return !type;
    }
    
    @action
    changeType(type) {
        this.type = type.value;
    }

    @action
    openDeleteFileModal(file) {
        this.modals.open(DeleteFileModal, {
            file: file,
            afterDelete: () => {
                this.model.removeObject(file);
            }
        });
    }

    @action
    openEditFileModal(file) {
        this.modals.open(EditFileModal, {file: file});
    }
}
