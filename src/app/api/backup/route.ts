// src/app/api/backup/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Writable } from 'stream';

const tableNames = [
    'users', 'user_profiles', 'addresses', 'employee_absences', 'employee_advances', 'employee_bonuses',
    'categories', 'products', 'inventory', 'recipes', 'coupons', 'complaints',
    'suppliers', 'purchases', 'purchase_items', 'needs', 'debts', 'branches',
    'currencies', 'banks', 'transactions', 'orders', 'order_items',
    'system_settings', 'user_permissions', 'peak_hours', 'drivers', 'delivery_missions',
    'daily_summaries'
];

export async function GET() {
  try {
    const backupData: { [key: string]: any[] } = {};

    for (const table of tableNames) {
        const { rows } = await db.query(`SELECT * FROM ${table};`);
        backupData[table] = rows;
    }
    
    const jsonString = JSON.stringify(backupData, null, 2);

    return new NextResponse(jsonString, {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="backup.json"',
        },
    });

  } catch (error) {
    console.error('Backup API Error:', error);
    return NextResponse.json({ message: 'Error creating backup' }, { status: 500 });
  }
}

    