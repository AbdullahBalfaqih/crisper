// src/app/api/suppliers/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query('SELECT * FROM suppliers ORDER BY name');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ message: 'Error fetching suppliers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, phone_number, address, contact_person } = await request.json();
    if (!name) {
        return NextResponse.json({ message: 'Supplier name is required' }, { status: 400 });
    }
    const { rows } = await db.query(
      'INSERT INTO suppliers (name, phone_number, address, contact_person) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, phone_number, address, contact_person]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') { // unique_violation
        return NextResponse.json({ message: 'Supplier name or phone number already exists' }, { status: 409 });
    }
    console.error('Error creating supplier:', error);
    return NextResponse.json({ message: 'Error creating supplier' }, { status: 500 });
  }
}
