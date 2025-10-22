/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// This file contains the database schema to avoid reading from the filesystem at runtime,
// which is unreliable in a serverless environment like Vercel.

export const schemaSql = `
-- Table for Therapists
CREATE TABLE therapists (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    profile_image_url TEXT,
    bio TEXT,
    patient_ids JSONB
);

-- Table for Patients
CREATE TABLE patients (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    therapist_id VARCHAR(255) REFERENCES therapists(id),
    service_ids JSONB,
    pain_journal JSONB,
    exercise_log JSONB,
    clinical_notes JSONB
);

-- Table for Service Categories
CREATE TABLE categories (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Table for Exercises
CREATE TABLE exercises (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sets INTEGER,
    reps INTEGER,
    image_url TEXT,
    video_url TEXT,
    audio_url TEXT
);

-- Table for Therapy Programs (Services)
CREATE TABLE therapy_programs (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id VARCHAR(255) REFERENCES categories(id),
    exercise_ids JSONB
);

-- Table for Appointments
CREATE TABLE appointments (
    id VARCHAR(255) PRIMARY KEY,
    patient_id VARCHAR(255) REFERENCES patients(id),
    therapist_id VARCHAR(255) REFERENCES therapists(id),
    start_time BIGINT NOT NULL,
    end_time BIGINT NOT NULL,
    status VARCHAR(50),
    notes TEXT,
    reminder_sent BOOLEAN
);

-- Table for Messages
CREATE TABLE messages (
    id VARCHAR(255) PRIMARY KEY,
    from_user_id VARCHAR(255) NOT NULL,
    to_user_id VARCHAR(255) NOT NULL,
    text_content TEXT,
    timestamp BIGINT NOT NULL,
    file_data JSONB
);

-- Table for Notifications
CREATE TABLE notifications (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    text_content TEXT,
    timestamp BIGINT NOT NULL,
    is_read BOOLEAN
);

-- Table for Testimonials
CREATE TABLE testimonials (
    id VARCHAR(255) PRIMARY KEY,
    quote TEXT NOT NULL,
    author VARCHAR(255) NOT NULL
);

-- Table for FAQs
CREATE TABLE faqs (
    id VARCHAR(255) PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL
);
`;
