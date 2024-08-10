const getFileServiceInstance = require('../../services/files/files-service');

// FIXME: implement the edit modal
// const ALLOWED_INCLUDES = ['posts', 'count.posts'];
const ALLOWED_INCLUDES = ['count.posts'];

const filesService = getFileServiceInstance();

/** @type {import('@tryghost/api-framework').Controller} */
const controller = {
    docName: 'files',

    exportFiles: {
        headers: {
            cacheInvalidate: false
        },
        permissions: true,
        async query() {
            return await filesService.exportFiles();
        }
    },
    
    upload: {
        statusCode: 201,
        headers: {
            cacheInvalidate: false
        },
        permissions: true,
        async query(frame) {
            return filesService.uploadFile(frame);
        }
    },

    browse: {
        headers: {
            cacheInvalidate: false
        },
        options: [
            'include',
            'filter',
            'fields',
            'limit',
            'order',
            'page',
            'debug'
        ],
        validation: {
            options: {
                include: {
                    values: ALLOWED_INCLUDES
                }
            }
        },
        permissions: true,
        query(frame) {
            return filesService.browseFiles(frame);
        }
    },

    destroy: {
        statusCode: 204,
        headers: {
            cacheInvalidate: true
        },
        options: [
            'id'
        ],
        permissions: true,
        query(frame) {
            return filesService.destroyFile(frame);
        }
    }
};

module.exports = controller;
