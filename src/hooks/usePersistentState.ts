/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// FIX: Imported Dispatch and SetStateAction to resolve 'React' namespace error.
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

const getInitialState = <T,>(key: string, mockData: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : mockData;
    } catch (error) {
        console.error(`Error reading from localStorage for key "${key}":`, error);
        return mockData;
    }
};

// FIX: Replaced React.Dispatch and React.SetStateAction with imported types.
export const usePersistentState = <T,>(key: string, mockData: T): [T, Dispatch<SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => getInitialState(key, mockData));

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error writing to localStorage for key "${key}":`, error);
        }
    }, [key, state]);

    return [state, setState];
};
