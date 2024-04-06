const {combineTransactionalMigrations, addPermissionWithRoles} = require('../../utils');

module.exports = combineTransactionalMigrations(
    addPermissionWithRoles({
        name: 'Browse files',
        action: 'browse',
        object: 'file'
    }, [
        'Administrator',
        'Admin Integration',
        'Editor',
        'Author',
        'Contributor'
    ]),
    addPermissionWithRoles({
        name: 'Read files',
        action: 'read',
        object: 'file'
    }, [
        'Administrator',
        'Admin Integration',
        'Editor',
        'Author',
        'Contributor'
    ]),
    addPermissionWithRoles({
        name: 'Edit files',
        action: 'edit',
        object: 'file'
    }, [
        'Administrator',
        'Admin Integration',
        'Editor',
        'Author',
        'Contributor'
    ]),
    addPermissionWithRoles({
        name: 'Add files',
        action: 'add',
        object: 'file'
    }, [
        'Administrator',
        'Admin Integration',
        'Editor',
        'Author',
        'Contributor'
    ]),
    addPermissionWithRoles({
        name: 'Delete files',
        action: 'destroy',
        object: 'file'
    }, [
        'Administrator',
        'Admin Integration',
        'Editor',
        'Author'
    ])
);
