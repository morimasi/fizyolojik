/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface ErrorDisplayProps {
    error: Error;
    onRetry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
    return (
        <div className="full-screen-overlay">
            <div className="error-display">
                <h3>Bir Hata Oluştu</h3>
                <p>{error.message || 'Veriler yüklenemedi.'}</p>
                <button className="btn btn-primary" onClick={onRetry}>Tekrar Dene</button>
            </div>
        </div>
    );
};

export default ErrorDisplay;
