// src/app/api/restore/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const tableNames = [
    'users', 'user_profiles', 'addresses', 'employee_absences', 'employee_advances', 'employee_bonuses',
    'categories', 'products', 'inventory', 'recipes', 'coupons', 'complaints',
    'suppliers', 'purchases', 'purchase_items', 'needs', 'debts', 'branches',
    'currencies', 'banks', 'transactions', 'orders', 'order_items',
    'system_settings', 'user_permissions', 'peak_hours', 'drivers', 'delivery_missions',
    'daily_summaries'
];

// In reverse order of dependencies for deletion
const tablesToDeleteOrder = [
    'daily_summaries', 'delivery_missions', 'drivers', 'peak_hours', 'user_permissions',
    'system_settings', 'order_items', 'orders', 'transactions', 'banks', 'currencies', 'branches',
    'debts', 'needs', 'purchase_items', 'purchases', 'suppliers', 'complaints',
    'coupons', 'recipes', 'inventory', 'products', 'categories', 'employee_bonuses',
    'employee_advances', 'employee_absences', 'addresses', 'user_profiles', 'users'
];

async function insertData(client: any, tableName: string, data: any[]) {
    if (!data || data.length === 0) return;

    const columns = Object.keys(data[0]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    for (const row of data) {
        const values = columns.map(col => row[col]);
        await client.query(query, values);
    }
}

export async function POST(request: Request) {
    const client = await db.connect();
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        const fileContent = await file.text();
        const backupData = JSON.parse(fileContent);

        await client.query('BEGIN');

        // Disable triggers
        await client.query('SET session_replication_role = replica;');

        // 1. Clear all existing data in reverse order of dependency
        for (const table of tablesToDeleteOrder) {
            await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
        }

        // 2. Insert new data in the correct order of dependency
        for (const table of tableNames) {
            if (backupData[table]) {
                await insertData(client, table, backupData[table]);
            }
        }
        
        // Re-enable triggers
        await client.query('SET session_replication_role = DEFAULT;');

        await client.query('COMMIT');

        return NextResponse.json({ message: 'Restore successful' });

    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Restore API Error:', error);
        return NextResponse.json({ message: `Error restoring data: ${error.message}` }, { status: 500 });
    } finally {
        client.release();
    }
}

    