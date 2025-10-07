// src/app/api/complaints/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const MAX_COMPLAINTS_PER_USER = 3;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
       const { rows } = await db.query('SELECT * FROM complaints WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
       return NextResponse.json(rows);
    }

    const { rows } = await db.query('SELECT * FROM complaints ORDER BY created_at DESC');
    return NextResponse.json(rows);

  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ message: 'Error fetching complaints' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { customer_name, user_id, subject, description } = await request.json();
    if (!customer_name || !subject || !description) {
        return NextResponse.json({ message: 'Customer name, subject, and description are required' }, { status: 400 });
    }
    
    // Check if the user has reached their complaint limit
    if (user_id) {
        const countResult = await db.query('SELECT COUNT(*) FROM complaints WHERE user_id = $1', [user_id]);
        const complaintCount = parseInt(countResult.rows[0].count, 10);
        if (complaintCount >= MAX_COMPLAINTS_PER_USER) {
            return NextResponse.json({ message: 'لقد وصلت إلى الحد الأقصى للشكاوى المسموح به.' }, { status: 403 });
        }
    }

    const { rows } = await db.query(
      'INSERT INTO complaints (customer_name, user_id, subject, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [customer_name, user_id, subject, description]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json({ message: 'Error creating complaint' }, { status: 500 });
  }
}
