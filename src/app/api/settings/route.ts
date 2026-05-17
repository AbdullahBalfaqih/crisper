// src/app/api/settings/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET handler to fetch all settings
export async function GET() {
  try {
    const { rows } = await db.query('SELECT key, value FROM system_settings');
    const settings = rows.reduce((acc, row) => {
      // Don't return the password
      if (row.key !== 'smtp_password') {
        acc[row.key] = row.value;
      }
      return acc;
    }, {});
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ message: 'Error fetching settings', error: error.message }, { status: 500 });
  }
}

// POST handler to update multiple settings
export async function POST(request: Request) {
  try {
    const settingsToUpdate: { [key: string]: any } = await request.json();

    // Use a transaction to update all settings atomically
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        for (const key in settingsToUpdate) {
            const value = settingsToUpdate[key];
            
            // Critical fix: Do not update the password if it's an empty string.
            // This prevents accidentally overwriting a stored password when the user
            // doesn't want to change it.
            if (key === 'smtp_password' && (value === '' || value === null || value === undefined)) {
                continue; 
            }

            await client.query(
                `INSERT INTO system_settings (key, value)
                 VALUES ($1, $2)
                 ON CONFLICT (key)
                 DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
                [key, value]
            );
        }
        await client.query('COMMIT');
        return NextResponse.json({ message: 'Settings updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
    
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ message: 'Error updating settings', error: error.message }, { status: 500 });
  }
}
