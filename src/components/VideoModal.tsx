/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface VideoModalProps {
    url: string;
    title: string;
    onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ url, title, onClose }) => {
    return (
        <div className="video-modal-overlay" onClick={onClose}>
            <div className="video-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <video src={url} controls autoPlay style={{ width: '100%', borderRadius: '8px' }} />
            </div>
        </div>
    );
};

export default VideoModal;
