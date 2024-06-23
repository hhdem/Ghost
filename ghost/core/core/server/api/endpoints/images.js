const getFileServiceInstance = require('../../services/files/files-service');

const filesService = getFileServiceInstance();

/** @type {import('@tryghost/api-framework').Controller} */
const controller = {
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

module.exports = controller;
