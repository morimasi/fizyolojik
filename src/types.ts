/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export type UserRole = 'admin' | 'therapist' | 'patient';

export type Theme = 'light' | 'dark' | 'ocean' | 'forest';

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface Admin {
    id: 'admin';
    name: 'Admin';
}

export interface Therapist extends User {
    patientIds: string[];
    profileImageUrl: string;
    bio: string;
}

export interface ClinicalNote {
    id: string;
    therapistId: string;
    date: number;
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
}

export interface Patient extends User {
    therapistId: string;
    serviceIds: string[];
    painJournal: PainJournalEntry[];
    // date string "YYYY-MM-DD" -> array of completed exercise IDs
    exerciseLog: { [date: string]: string[] };
    clinicalNotes: ClinicalNote[];
}

export interface Category {
    id: string;
    name: string;
}

export interface TherapyProgram {
    id: string;
    name: string;
    description: string;
    categoryId: string;
    exerciseIds: string[];
}

export interface Exercise {
    id: string;
    name: string;
    description: string;
    sets: number;
    reps: number;
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
}

export interface Appointment {
    id: string;
    patientId: string;
    therapistId: string;
    start: number;
    end: number;
    status: 'scheduled' | 'completed' | 'canceled';
    notes?: string;
    reminderSent?: boolean;
}

export interface FileData {
    name: string;
    mimeType: string;
    url: string;
}

export interface Message {
    id: string;
    from: string;
    to: string;
    text: string;
    timestamp: number;
    file?: FileData;
}

export interface Notification {
    id: string;
    userId: string;
    text: string;
    timestamp: number;
    read: boolean;
}

export interface PainJournalEntry {
    date: number;
    painLevel: number; // 1-10
    note: string;
}

export interface Testimonial {
    id: string;
    quote: string;
    author: string;
}

export interface FAQItem {
    id: string;
    question: string;
    answer: string;
}


// FIX: Added a type for appointment creation context to EditableItem to match usage in the app.
export type EditableItem = Category | TherapyProgram | Patient | Exercise | Therapist | Appointment | { categoryId: string } | { patientId: string } | { therapistId: string; start: number; patientId?: string } | null;