// src/app/api/employees/absences/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query('SELECT id, employee_id as "employeeId", date, reason, deduction, currency FROM employee_absences ORDER BY date DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching absences:', error);
    return NextResponse.json({ message: 'Error fetching absences' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { employeeId, date, reason, deduction, currency } = await request.json();
    const { rows } = await db.query(
      'INSERT INTO employee_absences (employee_id, date, reason, deduction, currency) VALUES ($1, $2, $3, $4, $5) RETURNING id, employee_id as "employeeId", date, reason, deduction, currency',
      [employeeId, date, reason, deduction, currency]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating absence:', error);
    return NextResponse.json({ message: 'Error creating absence' }, { status: 500 });
  }
}
