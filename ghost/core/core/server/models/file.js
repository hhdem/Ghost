const ghostBookshelf = require('./base');
const tpl = require('@tryghost/tpl');
const errors = require('@tryghost/errors');

const messages = {
    fileNotFound: 'File not found.'
};

let File;
let Files;

File = ghostBookshelf.Model.extend({

    tableName: 'files',

    actionsCollectCRUD: true,
    actionsResourceType: 'file',

    emitChange: function emitChange(event, options) {
        const eventToTrigger = 'file' + '.' + event;
        ghostBookshelf.Model.prototype.emitChange.bind(this)(this, eventToTrigger, options);
    },

    onCreated: function onCreated(model, options) {
        ghostBookshelf.Model.prototype.onCreated.apply(this, arguments);

        model.emitChange('added', options);
    },

    onUpdated: function onUpdated(model, options) {
        ghostBookshelf.Model.prototype.onUpdated.apply(this, arguments);

        model.emitChange('edited', options);
    },

    onDestroyed: function onDestroyed(model, options) {
        ghostBookshelf.Model.prototype.onDestroyed.apply(this, arguments);

        model.emitChange('deleted', options);
    },

    posts: function posts() {
        return this.belongsToMany('Post', 'posts_files', 'file_id', 'post_id');
    },

    toJSON: function toJSON(unfilteredOptions) {
        const options = File.filterOptions(unfilteredOptions, 'toJSON');
        const attrs = ghostBookshelf.Model.prototype.toJSON.call(this, options);
        
        // The thumbnail column is a computed attr which depends on other fields to be present
        if (
            !options.columns || (
                options.columns &&
                options.columns.includes('thumbnail') &&
                options.columns.includes('path') &&
                options.columns.includes('type')
            )
        ) {
            attrs.thumbnail = attrs.type === 'images' 
                ? attrs.path.replace(/\/content\/images\//, '/content/images/size/thumbnail/')
                : null;
        }

        return attrs;
    },

    defaultColumnsToFetch() {
        return ['id', 'name', 'type', 'path', 'size'];
    },

    filterRelations: function filterRelations() {
        return {
            posts: {
                tableName: 'posts',
                type: 'manyToMany',
                joinTable: 'posts_files',
                joinFrom: 'file_id',
                joinTo: 'post_id'
            }
        };
    }
}, {
    orderDefaultOptions: function orderDefaultOptions() {
        return {};
    },

    permittedOptions: function permittedOptions(methodName) {
        let options = ghostBookshelf.Model.permittedOptions.call(this, methodName);

        // allowlists for the `options` hash argument on methods, by method name.
        // these are the only options that can be passed to Bookshelf / Knex.
        const validOptions = {
            findAll: ['columns'],
            findOne: ['columns'],
            destroy: ['destroyAll']
        };

        if (validOptions[methodName]) {
            options = options.concat(validOptions[methodName]);
        }

        return options;
    },

    countRelations() {
        return {
            posts(modelOrCollection, options) {
                modelOrCollection.query('columns', 'files.*', (qb) => {
                    qb.count('posts.id')
                        .from('posts')
                        .leftOuterJoin('posts_files', 'posts.id', 'posts_files.post_id')
                        .whereRaw('posts_files.file_id = files.id')
                        .as('count__posts');

                    if (options.context && options.context.public) {
                        // @TODO use the filter behavior for posts
                        qb.andWhere('posts.type', '=', 'post');
                        qb.andWhere('posts.status', '=', 'published');
                    }
                });
            }
        };
    },

    destroy: function destroy(unfilteredOptions) {
        const options = this.filterOptions(unfilteredOptions, 'destroy', {extraAllowedProperties: ['id']});

        return this.forge({id: options.id})
            .fetch(options)
            .then(function destroyFiles(file) {
                if (!file) {
                    return Promise.reject(new errors.NotFoundError({
                        message: tpl(messages.fileNotFound)
                    }));
                }

                return file.destroy(options);
            });
    }
});

Files = ghostBookshelf.Collection.extend({
    model: File
});

module.exports = {
    File: ghostBookshelf.model('File', File),
    Files: ghostBookshelf.collection('Files', Files)
};
