// src/app/api/branches/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query('SELECT * FROM branches ORDER BY name');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ message: 'Error fetching branches' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, city, address, phone_number, manager_id } = await request.json();
    if (!name) {
        return NextResponse.json({ message: 'Branch name is required' }, { status: 400 });
    }
    const { rows } = await db.query(
      'INSERT INTO branches (name, city, address, phone_number, manager_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, city, address, phone_number, manager_id]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json({ message: 'Error creating branch' }, { status: 500 });
  }
}
