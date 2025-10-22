
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import postgres from 'postgres';
import { schemaSql } from './schema';
import { seed } from './seed';

// Centralized database connection
export const sql = postgres(process.env.POSTGRES_URL!, {
    ssl: 'require',
});

// A flag to prevent re-running initialization on the same "warm" serverless function instance.
let isDbInitialized = false;

/**
 * Ensures the database is initialized with the required schema and seed data.
 * This function is idempotent. It checks if the 'therapists' table exists
 * and only performs initialization if it's missing.
 */
export async function initializeDb() {
    if (isDbInitialized) {
        return;
    }

    try {
        const result = await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'therapists'
            );
        `;

        const tableExists = result[0].exists;

        if (!tableExists) {
            console.log('Database tables not found. Initializing schema and seeding data...');
            // Create schema
            await sql.unsafe(schemaSql);
            console.log('Schema created successfully.');
            // Seed data
            await seed(sql);
            console.log('Initial data seeded successfully.');
        }
        
        isDbInitialized = true;
    } catch (error) {
        console.error('CRITICAL: Database initialization failed.', error);
        // This error will be caught by the API handler, which will return a 500.
        throw new Error('Veritabanı başlatılamadı.');
    }
}
