const getFileServiceInstance = require('../../services/files/files-service');

const ALLOWED_INCLUDES = ['posts', 'count.posts'];

const filesService = getFileServiceInstance();

module.exports = {
    docName: 'files',
    upload: {
        statusCode: 201,
        headers: {
            cacheInvalidate: false
        },
        permissions: false,
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
