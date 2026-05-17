// src/app/api/employees/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PUT update an employee's profile
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { id } = params;
    const { name, jobTitle, nationalId, salary, currency, hireDate, notes } = await request.json();

    // Step 1: Update users table
    await client.query(
        `UPDATE users SET full_name = $1, phone_number = $2 WHERE id = $3`,
        [name, nationalId, id]
    );

    // Step 2: Update user_profiles table
    const { rows } = await client.query(
      `UPDATE user_profiles 
       SET job_title = $1, national_id = $2, hire_date = $3, salary = $4, currency = $5, notes = $6
       WHERE user_id = $7::uuid
       RETURNING *`,
      [jobTitle, nationalId, hireDate, salary, currency, notes, id]
    );
    
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Employee profile not found or no changes made' }, { status: 404 });
    }
    
    await client.query('COMMIT');
    
    const updatedEmployee = {
        id: rows[0].user_id,
        name: name, // We get the name from the request body as it was updated in the 'users' table
        nationalId: rows[0].national_id,
        jobTitle: rows[0].job_title,
        salary: rows[0].salary,
        currency: rows[0].currency,
        hireDate: rows[0].hire_date,
        notes: rows[0].notes,
    };

    return NextResponse.json(updatedEmployee);

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error updating employee:', error);
    return NextResponse.json({ message: 'Error updating employee' }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE an employee
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    // The ON DELETE CASCADE in the schema will handle related table deletions (profiles, absences, etc.)
    const { rowCount } = await db.query('DELETE FROM users WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Employee deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({ message: 'Error deleting employee' }, { status: 500 });
  }
}
