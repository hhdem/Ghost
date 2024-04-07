import Controller, {inject as controller} from '@ember/controller';
import {inject} from 'ghost-admin/decorators/inject';
import {inject as service} from '@ember/service';

export default class FilesLoadingController extends Controller {
    @controller('files') filesController;

    @service session;
    @service ui;

    @inject config;

    get availableTypes() {
        return this.filesController.availableTypes;
    }

    get selectedType() {
        return this.filesController.selectedType;
    }
}
