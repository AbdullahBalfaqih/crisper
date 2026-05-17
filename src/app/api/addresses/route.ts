
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET user addresses
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const { rows } = await db.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    return NextResponse.json(rows);

  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ message: 'Error fetching addresses' }, { status: 500 });
  }
}


// POST a new address
export async function POST(request: Request) {
  try {
    const { userId, addressName, addressDetails, latitude, longitude } = await request.json();

    if (!userId || !addressName || !addressDetails || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    const { rows } = await db.query(
      `INSERT INTO addresses (user_id, address_name, address_details, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, addressName, addressDetails, latitude, longitude]
    );

    return NextResponse.json(rows[0], { status: 201 });

  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json({ message: 'Error creating address' }, { status: 500 });
  }
}

