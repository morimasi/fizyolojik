/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Category, TherapyProgram, Patient, Exercise, Appointment, Therapist, Message, Notification, Testimonial, FAQItem } from '../types';

export interface AppData {
    therapists: Therapist[];
    patients: Patient[];
    categories: Category[];
    exercises: Exercise[];
    programs: TherapyProgram[];
    appointments: Appointment[];
    messages: Message[];
    notifications: Notification[];
    testimonials: Testimonial[];
    faqs: FAQItem[];
}

const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API isteği başarısız oldu: ${response.status} ${errorText}`);
    }
    return response.json() as Promise<T>;
};


export const apiService = {
    getInitialData: async (): Promise<AppData> => {
        const response = await fetch('/api/data');
        return handleResponse<AppData>(response);
    },

    updateData: async (updates: Partial<AppData>): Promise<AppData> => {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });
        return handleResponse<AppData>(response);
    },

    resetData: async (): Promise<AppData> => {
        const response = await fetch('/api/reset', {
            method: 'POST',
        });
        return handleResponse<AppData>(response);
    }
};