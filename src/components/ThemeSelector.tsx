/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Theme } from '../types';

interface ThemeSelectorProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const THEMES: { id: Theme, name: string }[] = [
    { id: 'light', name: 'Açık' },
    { id: 'dark', name: 'Koyu' },
    { id: 'ocean', name: 'Okyanus' },
    { id: 'forest', name: 'Orman' },
];

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ theme, setTheme }) => {
    return (
        <div className="theme-selector">
            <select
                id="theme-select"
                aria-label="Uygulama temasını seçin"
                value={theme}
                onChange={(e) => setTheme(e.target.value as Theme)}
            >
                {THEMES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>
        </div>
    );
};

export default ThemeSelector;
