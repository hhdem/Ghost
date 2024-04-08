import Component from '@glimmer/component';
import {inject as service} from '@ember/service';
import {task} from 'ember-concurrency';

export default class DeleteFileModal extends Component {
    @service notifications;

    @task({drop: true})
    *deleteFileTask() {
        try {
            const {file} = this.args.data;

            if (file.isDeleted) {
                return true;
            }
            
            // Using ".then" here to make sure the callback is called, even when the method is not yielded
            yield file.destroyRecord().then(() => {
                this.args.data.afterDelete?.();
            });

            this.notifications.closeAlerts('post.delete');

            return true;
        } catch (error) {
            this.notifications.showAPIError(error, {key: 'file.delete.failed'});
        } finally {
            this.args.close();
        }
    }
}
