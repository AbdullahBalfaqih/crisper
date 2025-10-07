// src/app/api/needs/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query('SELECT * FROM needs ORDER BY created_at DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching needs:', error);
    return NextResponse.json({ message: 'Error fetching needs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, quantity, notes } = await request.json();
    if (!name || !quantity) {
        return NextResponse.json({ message: 'Name and quantity are required' }, { status: 400 });
    }
    const { rows } = await db.query(
      'INSERT INTO needs (name, quantity, notes) VALUES ($1, $2, $3) RETURNING *',
      [name, quantity, notes]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating need:', error);
    return NextResponse.json({ message: 'Error creating need' }, { status: 500 });
  }
}
