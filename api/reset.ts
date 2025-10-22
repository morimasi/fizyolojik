import type { VercelRequest, VercelResponse } from '@vercel/node';
import postgres from 'postgres';
import { seed } from '../scripts/seed';
import { AppData } from '../src/services/apiService';
import { schemaSql } from '../scripts/schema';

const sql = postgres(process.env.POSTGRES_URL!, {
    ssl: 'require',
});

const tableNames = [
    'appointments',
    'therapy_programs',
    'patients',
    'therapists',
    'exercises',
    'categories',
    'messages',
    'notifications',
    'testimonials',
    'faqs'
];

async function getAllData(): Promise<AppData> {
     const [therapists, patients, categories, exercises, programs, appointments, messages, notifications, testimonials, faqs] = await Promise.all([
        sql`SELECT id, name, email, profile_image_url as "profileImageUrl", bio, patient_ids as "patientIds" FROM therapists`,
        sql`SELECT id, name, email, therapist_id as "therapistId", service_ids as "serviceIds", pain_journal as "painJournal", exercise_log as "exerciseLog", clinical_notes as "clinicalNotes" FROM patients`,
        sql`SELECT * FROM categories`,
        sql`SELECT id, name, description, sets, reps, image_url as "imageUrl", video_url as "videoUrl", audio_url as "audioUrl" FROM exercises`,
        sql`SELECT id, name, description, category_id as "categoryId", exercise_ids as "exerciseIds" FROM therapy_programs`,
        sql`SELECT id, patient_id as "patientId", therapist_id as "therapistId", start_time as "start", end_time as "end", status, notes, reminder_sent as "reminderSent" FROM appointments`,
        sql`SELECT id, from_user_id as "from", to_user_id as "to", text_content as "text", timestamp, file_data as "file" FROM messages`,
        sql`SELECT id, user_id as "userId", text_content as "text", timestamp, is_read as "read" FROM notifications`,
        sql`SELECT * FROM testimonials`,
        sql`SELECT * FROM faqs`,
    ]);
    return { therapists, patients, categories, exercises, programs, appointments, messages, notifications, testimonials, faqs } as unknown as AppData;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        console.log('Resetting database...');

        // Drop existing tables
        for (const tableName of tableNames) {
            await sql.unsafe(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
        }
        console.log('All tables dropped.');

        // Recreate schema from imported SQL string
        await sql.unsafe(schemaSql);
        console.log('Schema recreated.');

        // Seed data
        await seed(sql);
        console.log('Data seeded.');

        const data = await getAllData();
        return res.status(200).json(data);

    } catch (error: any) {
        console.error('Reset API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
