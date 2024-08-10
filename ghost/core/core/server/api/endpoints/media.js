const getFileServiceInstance = require('../../services/files/files-service');

const filesService = getFileServiceInstance();

/** @type {import('@tryghost/api-framework').Controller} */
const controller = {
    docName: 'media',

    upload: {
        statusCode: 201,
        headers: {
            cacheInvalidate: false
        },
        permissions: false,
        async query(frame) {
            return filesService.uploadMedia(frame);
        }
    },

    uploadThumbnail: {
        headers: {
            cacheInvalidate: false
        },
        permissions: false,
        data: [
            'url',
            'ref'
        ],
        async query(frame) {
            return filesService.uploadMediaThumbnail(frame);
        }
    }
};

module.exports = controller;
