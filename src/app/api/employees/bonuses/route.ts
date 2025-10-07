// src/app/api/employees/bonuses/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query('SELECT id, employee_id as "employeeId", date, amount, currency, notes FROM employee_bonuses ORDER BY date DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching bonuses:', error);
    return NextResponse.json({ message: 'Error fetching bonuses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { employeeId, date, amount, currency, notes } = await request.json();
    const { rows } = await db.query(
      'INSERT INTO employee_bonuses (employee_id, date, amount, currency, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id, employee_id as "employeeId", date, amount, currency, notes',
      [employeeId, date, amount, currency, notes]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating bonus:', error);
    return NextResponse.json({ message: 'Error creating bonus' }, { status: 500 });
  }
}
