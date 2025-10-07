// src/app/api/employees/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all employees (users with role 'employee' + their profiles)
export async function GET() {
  try {
    const { rows } = await db.query(`
      SELECT 
        u.id, 
        u.full_name as name, 
        u.phone_number as "nationalId",
        p.job_title as "jobTitle",
        p.salary,
        p.currency,
        p.hire_date as "hireDate",
        p.notes
      FROM users u
      JOIN user_profiles p ON u.id = p.user_id
      WHERE u.role = 'employee'
      ORDER BY u.created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ message: 'Error fetching employees' }, { status: 500 });
  }
}

// POST a new employee
export async function POST(request: Request) {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const { name, jobTitle, nationalId, salary, currency, hireDate, notes, username, password } = await request.json();

        // Step 1: Create user record
        const { rows: userRows } = await client.query(
            `INSERT INTO users (full_name, username, phone_number, password_hash, role)
             VALUES ($1, $2, $3, $4, 'employee')
             RETURNING id, full_name as name`,
            [name, username || `emp_${Date.now()}`, nationalId, password || 'default_password']
        );
        const newUser = userRows[0];

        // Step 2: Create user_profile record
        const { rows: profileRows } = await client.query(
            `INSERT INTO user_profiles (user_id, job_title, national_id, hire_date, salary, currency, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [newUser.id, jobTitle, nationalId, hireDate, salary, currency, notes]
        );
        
        await client.query('COMMIT');
        
        // Return combined data
        const newEmployee = {
            id: newUser.id,
            name: newUser.name,
            nationalId: profileRows[0].national_id,
            jobTitle: profileRows[0].job_title,
            salary: profileRows[0].salary,
            currency: profileRows[0].currency,
            hireDate: profileRows[0].hire_date,
            notes: profileRows[0].notes,
        };

        return NextResponse.json(newEmployee, { status: 201 });

    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error creating employee:', error);
        if (error.code === '23505') {
             return NextResponse.json({ message: 'Username or phone number already exists' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Error creating employee' }, { status: 500 });
    } finally {
        client.release();
    }
}
