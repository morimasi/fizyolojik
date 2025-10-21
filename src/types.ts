/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// --- TYPES ---
export type UserRole = 'admin' | 'therapist' | 'patient';

export type BaseUser = {
  id: string;
  name: string;
  email: string;
};

export type PatientProgress = {
  [exerciseId: string]: 'completed' | 'todo';
};

export type Patient = BaseUser & {
  password: string;
  therapistId: string;
  serviceIds: string[];
  progress: PatientProgress;
};

export type AvailabilitySlot = {
    start: string;
    end: string;
};

export type WeeklyAvailability = {
    day: number; // 0: Pazar, 1: Pazartesi...
    slots: AvailabilitySlot[];
}[];

export type Therapist = BaseUser & {
  password: string;
  patientIds: string[];
  availability: WeeklyAvailability;
};

export type Admin = {
  name: 'Admin';
};

export type User = Patient | Therapist | Admin;

export type Category = {
  id: string;
  name: string;
};

export type TherapyProgram = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  exerciseIds: string[];
};

export type Exercise = {
  id: string;
  name: string;
  description: string;
  sets: number;
  reps: number;
  videoUrl?: string;
  imageUrl?: string;
  audioUrl?: string;
};

export type Message = {
  id: string;
  from: string;
  to: string;
  text?: string;
  file?: {
    name: string;
    url: string;
    mimeType: string;
  };
  timestamp: number;
};

export type ClinicalNote = {
  id: string;
  patientId: string;
  therapistId: string;
  text: string;
  timestamp: number;
};

export type Notification = {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
  read: boolean;
  link?: {
    view: string;
    contextId?: string;
  };
};

export type Appointment = {
    id: string;
    patientId: string;
    therapistId: string;
    start: number;
    end: number;
    status: 'scheduled' | 'completed' | 'cancelled';
};

export type EditableItem = Partial<Category & TherapyProgram & Patient & Exercise>;
