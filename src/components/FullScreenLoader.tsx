/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const FullScreenLoader: React.FC = () => {
    return (
        <div className="full-screen-overlay">
            <div className="loader"></div>
            <p>Veriler Yükleniyor...</p>
        </div>
    );
};

export default FullScreenLoader;
