/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { UserRole } from '../types';

interface RoleSelectionProps {
    onRoleSelect: (role: UserRole) => void;
    onBackToLanding: () => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onRoleSelect, onBackToLanding }) => {
    return (
        <div className="app-container view-enter">
            <button onClick={onBackToLanding} className="back-button">‹ Ana Sayfa</button>
            <header>
                <h1 className="title">Platforma Hoş Geldiniz</h1>
                <p className="subtitle">Lütfen devam etmek için rolünüzü seçin.</p>
            </header>
            <main>
                <div className="role-selection">
                    <div className="role-card" onClick={() => onRoleSelect('admin')} role="button" tabIndex={0}><div className="role-icon">👤</div><h3>Yönetici</h3><p>Hizmetleri ve danışanları yönetin.</p></div>
                    <div className="role-card" onClick={() => onRoleSelect('therapist')} role="button" tabIndex={0}><div className="role-icon">👨‍⚕️</div><h3>Terapist</h3><p>Danışanlarınızla iletişim kurun.</p></div>
                    <div className="role-card" onClick={() => onRoleSelect('patient')} role="button" tabIndex={0}><div className="role-icon">🤕</div><h3>Danışan</h3><p>Terapi programınızı görüntüleyin.</p></div>
                </div>
            </main>
        </div>
    );
};

export default RoleSelection;
