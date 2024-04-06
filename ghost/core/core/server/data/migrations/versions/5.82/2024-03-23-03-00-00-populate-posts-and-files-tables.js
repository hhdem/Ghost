const fs = require('fs');
const path = require('path');
const {default: ObjectID} = require('bson-objectid');
const logging = require('@tryghost/logging');
const {PostsService} = require('@tryghost/posts-service');
const {FilesService} = require('@tryghost/files-service');

const config = require('../../../../../shared/config');
const {createTransactionalMigration} = require('../../utils');

module.exports = createTransactionalMigration(
    async function up(knex) {
        // 1) Select all posts and extract the file paths from them
        const posts = await knex('posts').select('id', 'lexical').whereNotNull('lexical');

        const allFileDetails = posts.reduce((map, currentPost) => {
            const fileDetails = PostsService.getFileDetailsFromLexical(currentPost.lexical);

            // eslint-disable-next-line no-restricted-syntax
            fileDetails.forEach((currentFileDetails) => {
                map[currentFileDetails.path] = currentFileDetails;
            });

            return map;
        }, {});

        // 2) Create all file entities in the DB
        const appRoot = config.get('paths').appRoot;

        const fileIdsByPath = {};

        // eslint-disable-next-line no-restricted-syntax
        for (const currentFileDetails of Object.values(allFileDetails)) {
            logging.info(`Adding file: ${currentFileDetails.path}`);

            const absoluteFilePath = path.join(appRoot, currentFileDetails.path);

            // The file hash will be created assuming it is stored locally (and not via cloud adapters)
            // Note that no dedupe logic exists in the migration to avoid data lost
            let fileHash = null;
            try {
                fileHash = await FilesService.generateHash(absoluteFilePath);
            } catch (_) {
                // noop, the only impact is file de-duplication on upload will not picking up this file
            }

            let fileSize = 0;
            try {
                fileSize = fs.statSync(absoluteFilePath).size;
            } catch (_) {
                // noop, the only impact is the file size not reflecting correctly on the admin UI
            }

            const id = (new ObjectID()).toHexString();
            fileIdsByPath[currentFileDetails.path] = id;

            await knex('files').insert({
                id: id,
                name: path.basename(currentFileDetails.path),
                // Set the file type based on which widget it was included
                type: ['image', 'gallery'].includes(currentFileDetails.type) ? 'images' : 
                    ['audio', 'video'].includes(currentFileDetails.type) ? 'media' : 'files',
                hash: fileHash,
                path: currentFileDetails.path,
                size: fileSize,
                created_at: knex.raw('current_timestamp')
            });
        }

        // 3) Linking files to posts
        // eslint-disable-next-line no-restricted-syntax
        for (const post of posts) {
            logging.info(`Linking files to post: ${post.id}`);

            const fileDetails = PostsService.getFileDetailsFromLexical(post.lexical);

            // eslint-disable-next-line no-restricted-syntax
            for (const currentFileDetails of fileDetails) {
                await knex('posts_files').insert({
                    id: (new ObjectID()).toHexString(),
                    post_id: post.id,
                    file_id: fileIdsByPath[currentFileDetails.path]
                });
            }
        }
    },

    async function down() {
        // noop, as the data will be deleted by the drop table migration
    }
);
