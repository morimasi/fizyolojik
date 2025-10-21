/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { UserRole } from '../types';

interface LoginProps {
    selectedRole: UserRole | null;
    onLogin: (event: React.FormEvent<HTMLFormElement>) => void;
    onBack: () => void;
    loginError: string;
}

const Login: React.FC<LoginProps> = ({ selectedRole, onLogin, onBack, loginError }) => {
    if (!selectedRole) return null;

    const roleNames: Record<UserRole, string> = { admin: 'Yönetici', therapist: 'Terapist', patient: 'Danışan' };

    return (
      <div className="app-container view-enter">
        <button onClick={onBack} className="back-button">‹ Geri</button>
        <div className="login-container">
          <h2 className="login-title">{roleNames[selectedRole]} Girişi</h2>
          <form className="login-form" onSubmit={onLogin}>
            {selectedRole !== 'admin' && (
              <div className="form-group">
                <label htmlFor="email">E-posta</label>
                <input type="email" id="email" name="email" required />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="password">Parola</label>
              <input type="password" id="password" name="password" required />
            </div>
            {loginError && <p className="login-error">{loginError}</p>}
            <button type="submit" className="btn btn-primary full-width">Giriş Yap</button>
          </form>
        </div>
      </div>
    );
};

export default Login;
