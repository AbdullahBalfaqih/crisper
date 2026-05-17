// src/app/api/currencies/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query('SELECT * FROM currencies ORDER BY is_main_currency DESC, name');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return NextResponse.json({ message: 'Error fetching currencies' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, symbol, exchange_rate_to_main } = await request.json();
    if (!name || !symbol || exchange_rate_to_main === undefined) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    const { rows } = await db.query(
      'INSERT INTO currencies (name, symbol, exchange_rate_to_main, is_main_currency) VALUES ($1, $2, $3, false) RETURNING *',
      [name, symbol, exchange_rate_to_main]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating currency:', error);
    return NextResponse.json({ message: 'Error creating currency' }, { status: 500 });
  }
}
