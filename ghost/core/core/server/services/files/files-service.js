const {FilesService} = require('@tryghost/files-service');

/**
 * @returns {InstanceType<FilesService>} instance of the FilesService
 */
const getPostServiceInstance = () => {
    const config = require('../../../shared/config');
    const models = require('../../models');
    const storage = require('../../adapters/storage');

    return new FilesService({
        config: config,
        models: models,
        storage: storage
    });
};

module.exports = getPostServiceInstance;
