const getFileServiceInstance = require('../../services/files/files-service');

const filesService = getFileServiceInstance();

module.exports = {
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
