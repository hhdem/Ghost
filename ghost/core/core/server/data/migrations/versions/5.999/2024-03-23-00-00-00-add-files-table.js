const {addTable} = require('../../utils');
const schema = require('../../../schema/schema');

module.exports = addTable('files', schema.files);
