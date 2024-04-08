const debug = require('@tryghost/debug')('serializers:input:all');
const _ = require('lodash');
const utils = require('../../utils');

const INTERNAL_OPTIONS = ['transacting', 'forUpdate'];

/**
 * @description Shared serializer for all requests.
 *
 * Transforms certain options from API notation into model readable language/notation.
 *
 * e.g. API uses "include", but model layer uses "withRelated".
 */
module.exports = {
    all(apiConfig, frame) {
        debug('serialize all');

        if (frame.options.include) {
            frame.options.withRelated = utils.options.trimAndLowerCase(frame.options.include);
            delete frame.options.include;
        }

        if (frame.options.fields) {
            frame.options.columns = utils.options.trimAndLowerCase(frame.options.fields);
            delete frame.options.fields;
        }

        // FIXME: enable the support of related fields when the edit modal from files is ready
        // let columns;

        // if (frame.options.fields) {
        //     columns = utils.options.trimAndLowerCase(frame.options.fields);

        //     // Filter out columns that are from included entities, which follow the pattern "entity.field"
        //     const filteredColumns = columns.filter(currentColumn => !currentColumn.includes('.'));
        //     if (filteredColumns.length > 0) {
        //         frame.options.columns = filteredColumns;
        //     }

        //     delete frame.options.fields;
        // }

        // if (frame.options.include) {
        //     let withRelated = utils.options.trimAndLowerCase(frame.options.include);

        //     if (columns) {
        //         withRelated = withRelated.map((related) => {
        //             // Add fields that starts with the "entity." pattern
        //             const relatedColumns = columns.filter(
        //                 currentColumn => currentColumn.startsWith(`${related}.`)
        //             );

        //             if (relatedColumns.length > 0) {
        //                 return {[related]: builder => builder.column(...relatedColumns)};
        //             }

        //             return related;
        //         });
        //     }

        //     frame.options.withRelated = withRelated;
        //     delete frame.options.include;
        // }

        if (frame.options.formats) {
            frame.options.formats = utils.options.trimAndLowerCase(frame.options.formats);
        }

        if (frame.options.formats && frame.options.columns) {
            frame.options.columns = frame.options.columns.concat(frame.options.formats);
        }

        if (!frame.options.context.internal) {
            debug('omit internal options');
            frame.options = _.omit(frame.options, INTERNAL_OPTIONS);
        }
    }
};
