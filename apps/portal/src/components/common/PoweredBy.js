import React from 'react';
import AppContext from '../../AppContext';

export default class PoweredBy extends React.Component {
    static contextType = AppContext;

    render() {
        // Note: please do not wrap "Powered by Ghost" in the translation function, as we don't
        // want it to be translated
        /* eslint-disable i18next/no-literal-string */
        return (
            <span>
            Build with ❤ Love
            </span>
        );
        /* eslint-enable i18next/no-literal-string */
    }
}
