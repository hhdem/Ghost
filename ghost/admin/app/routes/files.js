import AuthenticatedRoute from 'ghost-admin/routes/authenticated';
import {assign} from '@ember/polyfills';
import {isBlank} from '@ember/utils';
import {inject as service} from '@ember/service';

export default class FilesRoute extends AuthenticatedRoute {
    @service infinity;

    queryParams = {
        type: {refreshModel: true}
    };

    perPage = 30;

    model(params) {
        // FIXME: implement the edit modal
        // const queryParams = {include: 'count.posts,posts', fields: ['posts.id', 'posts.title'], order: 'created_at DESC'};
        const queryParams = {include: 'count.posts', order: 'created_at DESC'};
        const filterParams = {type: params.type};
        const paginationParams = {
            perPageParam: 'limit',
            totalPagesParam: 'meta.pagination.pages'
        };

        const filter = this._filterString(filterParams);
        if (!isBlank(filter)) {
            queryParams.filter = filter;
        }

        const perPage = this.perPage;
        const paginationSettings = assign({perPage, startingPage: 1}, paginationParams, queryParams);

        return this.infinity.model('file', paginationSettings);
    }

    buildRouteInfoMetadata() {
        return {
            titleToken: 'Files'
        };
    }

    _filterString(filter) {
        return Object.keys(filter).map((key) => {
            let value = filter[key];

            if (!isBlank(value)) {
                return `${key}:${filter[key]}`;
            }

            return undefined;
        }).compact().join('+');
    }
}
