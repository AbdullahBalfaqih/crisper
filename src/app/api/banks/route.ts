// src/app/api/banks/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query('SELECT * FROM banks ORDER BY name');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching banks:', error);
    return NextResponse.json({ message: 'Error fetching banks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, iban, balance } = await request.json();
    if (!name) {
        return NextResponse.json({ message: 'Bank name is required' }, { status: 400 });
    }
    const { rows } = await db.query(
      'INSERT INTO banks (name, iban, balance) VALUES ($1, $2, $3) RETURNING *',
      [name, iban, balance]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating bank:', error);
    return NextResponse.json({ message: 'Error creating bank' }, { status: 500 });
  }
}
