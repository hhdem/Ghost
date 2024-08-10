import React from 'react';
import {Button} from '@tryghost/admin-x-design-system';
import {downloadAllContent,downloadAllFiles} from '@tryghost/admin-x-framework/api/db';

const MigrationToolsExport: React.FC = () => {
    return (
        <React.Fragment>
            <div className='flex flex-col items-center gap-3 pb-5 pt-10'>
                <div>Download all of your <strong>posts and settings</strong> in a single, glorious JSON file.</div>
                <Button className='!h-9 !font-semibold' color='grey' icon='export' iconColorClass='!h-5 !w-auto' label='Export content' onClick={() => downloadAllContent()} />
            </div>

            <hr className="mt-5 w-full border-b border-t-0 border-grey-100 dark:border-grey-900"/>

            <div className='flex flex-col items-center gap-3 pb-5 pt-10'>
                <div>You can also download <strong>all your files and images</strong> in another single, beautiful zip file.</div>
                <Button className='!h-9 !font-semibold' color='grey' icon='export' iconColorClass='!h-5 !w-auto' label='Export files' onClick={() => downloadAllFiles()} />
            </div>
        </React.Fragment>
    );
};

export default MigrationToolsExport;
