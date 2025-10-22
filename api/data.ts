import type { VercelRequest, VercelResponse } from '@vercel/node';
import postgres from 'postgres';
import { promises as fs } from 'fs';
import path from 'path';
import { seed } from '../scripts/seed';
import { AppData } from '../src/services/apiService';

const sql = postgres(process.env.POSTGRES_URL!, {
    ssl: 'require',
});

async function initializeDb() {
    try {
        // Check if a table exists to determine if DB is initialized
        await sql`SELECT 1 FROM therapists LIMIT 1`;
    } catch (error) {
        console.log('Database not initialized. Setting up schema and seeding data...');
        const schemaSql = await fs.readFile(path.join(process.cwd(), 'scripts/schema.sql'), 'utf8');
        await sql.unsafe(schemaSql);
        await seed(sql);
        console.log('Database initialized successfully.');
    }
}

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
    try {
        await initializeDb();

        if (req.method === 'GET') {
            const data = await getAllData();
            return res.status(200).json(data);
        }

        if (req.method === 'POST') {
            const updates = req.body as Partial<AppData>;

            await sql.begin(async (transaction) => {
                const updatePromises = Object.entries(updates).map(async ([key, value]) => {
                    const records = value as any[];
                    if (!records || records.length === 0) return;

                    switch (key) {
                        case 'patients':
                            return transaction`
                                INSERT INTO patients (id, name, email, therapist_id, service_ids, pain_journal, exercise_log, clinical_notes)
                                SELECT * FROM ${transaction(records.map(p => ({...p, therapist_id: p.therapistId, service_ids: p.serviceIds, pain_journal: p.painJournal, exercise_log: p.exerciseLog, clinical_notes: p.clinicalNotes})))}
                                ON CONFLICT (id) DO UPDATE SET
                                    name = EXCLUDED.name,
                                    email = EXCLUDED.email,
                                    therapist_id = EXCLUDED.therapist_id,
                                    service_ids = EXCLUDED.service_ids,
                                    pain_journal = EXCLUDED.pain_journal,
                                    exercise_log = EXCLUDED.exercise_log,
                                    clinical_notes = EXCLUDED.clinical_notes;
                            `;
                        case 'appointments':
                             return transaction`
                                INSERT INTO appointments (id, patient_id, therapist_id, start_time, end_time, status, notes, reminder_sent)
                                SELECT * FROM ${transaction(records.map(a => ({...a, patient_id: a.patientId, therapist_id: a.therapistId, start_time: a.start, end_time: a.end, reminder_sent: a.reminderSent || null})))}
                                ON CONFLICT (id) DO UPDATE SET
                                    patient_id = EXCLUDED.patient_id,
                                    therapist_id = EXCLUDED.therapist_id,
                                    start_time = EXCLUDED.start_time,
                                    end_time = EXCLUDED.end_time,
                                    status = EXCLUDED.status,
                                    notes = EXCLUDED.notes,
                                    reminder_sent = EXCLUDED.reminder_sent;
                            `;
                        case 'messages':
                            return transaction`
                                INSERT INTO messages (id, from_user_id, to_user_id, text_content, timestamp, file_data)
                                SELECT * FROM ${transaction(records.map(m => ({id: m.id, from_user_id: m.from, to_user_id: m.to, text_content: m.text, timestamp: m.timestamp, file_data: m.file || null})))}
                                ON CONFLICT (id) DO UPDATE SET
                                    text_content = EXCLUDED.text_content;
                            `;
                        case 'notifications':
                             return transaction`
                                INSERT INTO notifications (id, user_id, text_content, timestamp, is_read)
                                SELECT * FROM ${transaction(records.map(n => ({id: n.id, user_id: n.userId, text_content: n.text, timestamp: n.timestamp, is_read: n.read})))}
                                ON CONFLICT (id) DO UPDATE SET
                                    is_read = EXCLUDED.is_read;
                            `;
                         case 'categories':
                             return transaction`
                                INSERT INTO categories (id, name)
                                SELECT * FROM ${transaction(records)}
                                ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
                            `;
                         case 'programs':
                             return transaction`
                                INSERT INTO therapy_programs (id, name, description, category_id, exercise_ids)
                                SELECT * FROM ${transaction(records.map(p => ({...p, category_id: p.categoryId, exercise_ids: p.exerciseIds})))}
                                ON CONFLICT (id) DO UPDATE SET 
                                    name = EXCLUDED.name,
                                    description = EXCLUDED.description,
                                    category_id = EXCLUDED.category_id,
                                    exercise_ids = EXCLUDED.exercise_ids;
                            `;
                          case 'exercises':
                             return transaction`
                                INSERT INTO exercises (id, name, description, sets, reps, image_url, video_url, audio_url)
                                SELECT * FROM ${transaction(records.map(e => ({...e, image_url: e.imageUrl, video_url: e.videoUrl, audio_url: e.audioUrl})))}
                                ON CONFLICT (id) DO UPDATE SET
                                    name = EXCLUDED.name,
                                    description = EXCLUDED.description,
                                    sets = EXCLUDED.sets,
                                    reps = EXCLUDED.reps,
                                    image_url = EXCLUDED.image_url,
                                    video_url = EXCLUDED.video_url,
                                    audio_url = EXCLUDED.audio_url;
                            `;
                           case 'therapists':
                             return transaction`
                                INSERT INTO therapists (id, name, email, profile_image_url, bio, patient_ids)
                                SELECT * FROM ${transaction(records.map(t => ({...t, profile_image_url: t.profileImageUrl, patient_ids: t.patientIds})))}
                                ON CONFLICT (id) DO UPDATE SET
                                    name = EXCLUDED.name,
                                    email = EXCLUDED.email,
                                    profile_image_url = EXCLUDED.profile_image_url,
                                    bio = EXCLUDED.bio,
                                    patient_ids = EXCLUDED.patient_ids;
                            `;
                        default:
                            console.warn(`Update not handled for key: ${key}`);
                            return Promise.resolve();
                    }
                });
                await Promise.all(updatePromises);
            });
            
            const data = await getAllData();
            return res.status(200).json(data);
        }

        return res.status(405).json({ error: 'Method Not Allowed' });
    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}