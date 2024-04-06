const crypto = require('crypto');
const fs = require('fs-extra');
const url = require('url');
const path = require('path');
const glob = require('glob');

const imageTransform = require('@tryghost/image-transform');
const errors = require('@tryghost/errors');

class FilesService {
    constructor({config, models, storage}) {
        this.config = config;
        this.models = models;
        this.storage = storage;
    }

    /**
     * @param {String} filePath
     * @returns {Promise.<String>}
     */
    static generateHash(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, fileContents) => {
                if (fileContents) {
                    const hash = crypto.createHash('sha256').update(fileContents).digest('hex');
                    resolve(hash);
                } else {
                    // If the file processing fails, we don't want to store the image because it's corrupted/invalid
                    reject(
                        new errors.BadRequestError({
                            message: 'File hash generation failed',
                            context: err.message,
                            help: 'Please verify that the file is valid'
                        })
                    );
                }
            });
        });
    }

    /**
     * @param {Object} frame
     * @returns {Promise<Object>}
     */
    async browseFiles(frame) {
        const {options} = frame;
        return await this.models.File.findPage(options);
    }

    /**
     * @param {Object} frame
     * @returns {Promise<Object>}
     */
    async destroyFile(frame) {
        const {options} = frame;

        const currentFile = await this.models.File.findOne(options, {
            withRelated: ['posts']
        });

        if (currentFile) {
            const fileType = currentFile.get('type');
            const store = this.storage.getStorage(fileType);
            
            // Currently deleteAll is not part of StorageBase, so not all storage provider have implemented it
            if (store.deleteAll) {
                // Get the list of files using glob, so we capture all of them including the generated ones
                const parsedPath = path.parse(currentFile.get('path'));
                
                // For images, we try to delete the "_o" file, for media the "_thumb.jpg" file
                const globFileNamePattern = fileType === 'images' ? `{${parsedPath.name},${parsedPath.name}_o}${parsedPath.ext}` :
                    fileType === 'media' ? `{${parsedPath.name}${parsedPath.ext},${parsedPath.name}_thumb.jpg}` :
                        `${parsedPath.name}${parsedPath.ext}`;
                
                const globPattern = `${this.config.getContentPath(fileType)}/**/${globFileNamePattern}`;

                const generatedFiles = glob.sync(globPattern).map((filePath) => {
                    const currentGeneratedFile = path.parse(filePath);
                    return [currentGeneratedFile.base, currentGeneratedFile.dir];
                });

                await store.deleteAll(generatedFiles);

                await Promise.all(
                    currentFile.relations.posts.models.map((post) => {
                        const filePath = currentFile.get('path');
                        const lexical = JSON.parse(post.get('lexical'));

                        // Update each lexical component that used the affected file
                        lexical.root.children
                            .filter(child => child.type === 'image' && child.src && new url.URL(child.src).pathname === filePath)
                            .forEach((image) => {
                                image.src = '';
                                image.width = null;
                                image.height = null;
                                image.title = '';
                                image.alt = '';
                                image.caption = '';
                                image.cardWidth = 'regular';
                                image.href = '';
                            });

                        lexical.root.children
                            .filter(child => child.type === 'gallery')
                            .forEach((child) => {
                                child.images = child.images.filter((image) => {
                                    return new url.URL(image.src).pathname !== filePath;
                                });
                            });

                        lexical.root.children
                            .filter(child => child.type === 'audio' && child.src && new url.URL(child.src).pathname === filePath)
                            .forEach((audio) => {
                                audio.duration = 0;
                                audio.mimeType = '';
                                audio.src = '';
                                audio.title = '';
                                audio.thumbnailSrc = '';
                            });

                        lexical.root.children
                            .filter(child => child.type === 'video' && child.src && new url.URL(child.src).pathname === filePath)
                            .forEach((video) => {
                                video.src = '';
                                video.caption = '';
                                video.fileName = '';
                                video.mimeType = '';
                                video.width = null;
                                video.height = null;
                                video.duration = 0;
                                video.thumbnailSrc = '';
                                video.customThumbnailSrc = '';
                                video.thumbnailWidth = null;
                                video.thumbnailHeight = null;
                                video.loop = false;
                            });

                        lexical.root.children
                            .filter(child => child.type === 'file' && child.src && new url.URL(child.src).pathname === filePath)
                            .forEach((file) => {
                                file.src = '';
                                file.fileTitle = '';
                                file.fileCaption = '';
                                file.fileName = '';
                                file.fileSize = '';
                            });

                        return this.models.Post.edit({
                            lexical: JSON.stringify(lexical)
                        }, {
                            id: post.id,
                            patch: true,
                            // The linking happens when editing a post/page, so we skip the timestamp update to avoid conflicts
                            importing: true            
                        });
                    })
                );
            }

            return await this.models.File.destroy({
                id: currentFile.id,
                require: true
            });
        }
    }

    /**
     * Store generic files, usually documents like pdfs
     * Note: even if the file is an image or media, it will be treated as a regular file, with no extra features that images/medias have
     * 
     * @param {Object} frame
     * @returns {Promise<Object>}
     */
    async uploadFile(frame) {
        const {options, file} = frame;
        
        // If the file already exists (comparing its hash to a DB entry), return it instead of uploading it again
        const fileHash = await FilesService.generateHash(file.path);
        const currentFile = await this.models.File.findOne({type: 'file', hash: fileHash});

        if (currentFile) {
            return {filePath: currentFile.get('path')};
        } else {
            // Save the file and create a File entity in DB that represents it
            const store = this.storage.getStorage('files');    
            const filePath = await store.save({name: file.originalname, path: file.path});
            
            await this.models.File.add({
                name: file.originalname, 
                type: 'files',
                hash: fileHash,
                path: filePath,
                size: file.size
            }, options);
            
            return {filePath};
        }
    }

    /**
     * Store images with extra treatments like resizing/transformation
     * Note: 2 files might be generated at this point, "image.jpg" (treated/resized file, which will be used in posts) and "image_o.jpg" (original file, stored as backup)
     * 
     * @param {Object} frame
     * @returns {Promise<Object>}
     */
    async uploadImage(frame) {
        const {options, file} = frame;
        
        // If the file already exists (comparing its hash to a DB entry), return it instead of uploading it again
        const fileHash = await FilesService.generateHash(file.path);
        const currentFile = await this.models.File.findOne({type: 'image', hash: fileHash});

        if (currentFile) {
            return currentFile.get('path');
        } else {
            const store = this.storage.getStorage('images');

            // Normalize
            const imageOptimizationOptions = this.config.get('imageOptimization');

            // Trim _o from file name (not allowed suffix)
            file.name = file.name.replace(/_o(\.\w+?)$/, '$1');

            let filePath = '';
            let imageSize = file.sie;

            // CASE: image transform is not capable of transforming file (e.g. .gif)
            if (imageTransform.shouldResizeFileExtension(file.ext) && imageOptimizationOptions.resize) {
                const out = `${file.path}_processed`;
                const originalPath = file.path;

                const fileOptions = Object.assign({
                    in: originalPath,
                    out,
                    ext: file.ext,
                    width: this.config.get('imageOptimization:defaultMaxWidth')
                }, imageOptimizationOptions);

                try {
                    await imageTransform.resizeFromPath(fileOptions);
                } catch (err) {
                    // If the image processing fails, we don't want to store the image because it's corrupted/invalid
                    throw new errors.BadRequestError({
                        message: 'Image processing failed',
                        context: err.message,
                        help: 'Please verify that the image is valid'
                    });
                }

                // Store the processed/optimized image
                const processedImageUrl = await store.save({
                    ...file,
                    path: out
                });

                filePath = processedImageUrl;

                let processedImageName = path.basename(processedImageUrl);
                let processedImageDir = undefined;

                if (store.urlToPath) {
                    // Currently urlToPath is not part of StorageBase, so not all storage provider have implemented it
                    const processedImagePath = store.urlToPath(processedImageUrl);

                    // Get the path and name of the processed image
                    // We want to store the original image on the same name + _o
                    // So we need to wait for the first store to finish before generating the name of the original image
                    processedImageName = path.basename(processedImagePath);
                    processedImageDir = path.dirname(processedImagePath);
                }

                // If the processed image was created, get it's size instead of the original size
                // Currently size is not part of StorageBase, so not all storage provider have implemented it
                imageSize = store.size ? await store.size(processedImageName, processedImageDir) : imageSize;

                // Store the original image
                await store.save({
                    ...file,
                    path: originalPath,
                    name: imageTransform.generateOriginalImageName(processedImageName)
                }, processedImageDir);
            } else {
                filePath = await store.save(file);
            }

            await this.models.File.add({
                name: file.originalname,
                type: 'images',
                hash: fileHash,
                path: filePath,
                size: imageSize
            }, options);

            return filePath;
        }
    }

    /**
     * Store media files, like audio and video
     * 
     * @param {Object} frame
     * @returns {Promise<Object>}
     */
    async uploadMedia(frame) {
        const {options} = frame;
        const file = frame.files.file[0];
        const thumbnail = frame.files.thumbnail ? frame.files.thumbnail[0] : null;

        // If the file already exists (comparing its hash to a DB entry), return it instead of uploading it again
        const fileHash = await FilesService.generateHash(file.path);
        const currentFile = await this.models.File.findOne({type: 'image', hash: fileHash});

        if (currentFile) {
            return {
                filePath: currentFile.get('path'),
                thumbnailPath: null
            };
        } else {
            const storage = this.storage.getStorage('media');

            let thumbnailPath = null;
            if (thumbnail) {
                thumbnailPath = await storage.save(thumbnail);
            }

            const filePath = await storage.save(file);

            await this.models.File.add({
                name: file.originalname,
                type: 'media',
                hash: fileHash,
                path: filePath,
                size: file.size
            }, options);

            return {
                filePath,
                thumbnailPath
            };
        }
    }

    /**
     * @param {Object} frame
     * @returns {Promise<Object>}
     */
    async uploadMediaThumbnail(frame) {
        const storage = this.storage.getStorage('media');
        const targetDir = path.dirname(storage.urlToPath(frame.data.url));

        // NOTE: need to cleanup otherwise the parent media name won't match thumb name
        //       due to "unique name" generation during save
        if (storage.exists(frame.file.name, targetDir)) {
            await storage.delete(frame.file.name, targetDir);
        }

        return await storage.save(frame.file, targetDir);
    }
}

module.exports = FilesService;
