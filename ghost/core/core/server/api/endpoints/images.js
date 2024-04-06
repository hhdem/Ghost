const getFileServiceInstance = require('../../services/files/files-service');

const filesService = getFileServiceInstance();

module.exports = {
    docName: 'images',
    upload: {
        statusCode: 201,
        headers: {
            cacheInvalidate: false
        },
        permissions: false,
        async query(frame) {
            return filesService.uploadImage(frame);
        }
    }
};
