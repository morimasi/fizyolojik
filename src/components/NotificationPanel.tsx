/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Notification } from '../types';

interface NotificationPanelProps {
    notifications: Notification[];
    onNotificationClick: (notification: Notification) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onNotificationClick }) => {
    return (
        <div className="notification-panel">
            <div className="notification-panel-header">
                <h3>Bildirimler</h3>
            </div>
            <div className="notification-list">
                {notifications.length > 0 ? notifications.slice(0, 10).map(n => (
                    <div key={n.id} className={`notification-item ${!n.read ? 'unread' : ''}`} onClick={() => onNotificationClick(n)}>
                        <p>{n.text}</p>
                        <span>{new Date(n.timestamp).toLocaleString('tr-TR')}</span>
                    </div>
                )) : <p className="empty-list-text">Yeni bildirim yok.</p>}
            </div>
        </div>
    );
};

export default NotificationPanel;
