const _ = require('lodash');

const tagRelation = (attrs) => {
    return _.pick(attrs, [
        'id',
        'name',
        'slug'
    ]);
};

const fileRelation = (attrs) => {
    return _.pick(attrs, [
        'id',
        'name',
        'path'
    ]);
};

module.exports.pagesTag = tagRelation;
module.exports.postsTag = tagRelation;

module.exports.postsFile = fileRelation;