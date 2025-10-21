/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface EmptyStateProps {
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message, actionText, onAction }) => {
    return (
        <div className="empty-state-container">
            <div className="empty-state-illustration">
                {/* Simple SVG Illustration */}
                <svg width="150" height="150" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M75 35H25C22.2386 35 20 37.2386 20 40V75C20 77.7614 22.2386 80 25 80H75C77.7614 80 80 77.7614 80 75V40C80 37.2386 77.7614 35 75 35Z" stroke="#E0E0E0" strokeWidth="3" />
                    <path d="M30 35V25C30 22.2386 32.2386 20 35 20H45" stroke="#E0E0E0" strokeWidth="3" strokeLinecap="round" />
                    <path d="M60 52.5L65 57.5L75 47.5" stroke="#007BFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M25 57.5L35 47.5L47.5 60" stroke="#007BFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <h3>{title}</h3>
            <p>{message}</p>
            {actionText && onAction && (
                <button className="btn btn-primary" onClick={onAction}>{actionText}</button>
            )}
        </div>
    );
};

export default EmptyState;
