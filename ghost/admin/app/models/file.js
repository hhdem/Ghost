import Model, {attr} from '@ember-data/model';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';
import {computed} from '@ember/object';
import {equal} from '@ember/object/computed';

export default Model.extend(ValidationEngine, {
    validationType: 'file',

    name: attr('string'),
    type: attr('string'),
    hash: attr('string'),
    path: attr('string'),
    size: attr('number'), // size is in bytes
    createdAtUTC: attr('moment-utc'),
    updatedAtUTC: attr('moment-utc'),

    count: attr('raw'),

    // FIXME: implement the edit modal
    // posts: attr('raw'), // We do not load all fields from posts, so we use them as a json obj here

    thumbnail: attr('string'), // available for images

    isImage: equal('type', 'images'),
    isMedia: equal('type', 'media'),
    isFile: equal('type', 'files'), // "file" is a generic type to handle documents like pdfs, xlsx

    sizeInKbytes: computed('size', function () {
        return parseInt(this.size / 1024);
    })
});
