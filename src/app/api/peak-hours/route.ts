// src/app/api/peak-hours/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query('SELECT id, day, hour_range, orders FROM peak_hours ORDER BY day, hour_range');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching peak hours:', error);
    return NextResponse.json({ message: 'Error fetching peak hours' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { day, hour_range, orders } = await request.json();
    
    if (!day || !hour_range || orders === undefined) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    const ordersInt = parseInt(orders, 10);
    if (isNaN(ordersInt)) {
        return NextResponse.json({ message: 'Invalid number of orders' }, { status: 400 });
    }

    const { rows } = await db.query(
      `INSERT INTO peak_hours (day, hour_range, orders) 
       VALUES ($1, $2, $3) 
       RETURNING id, day, hour_range, orders`,
      [day, hour_range, ordersInt]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating peak hour:', error);
    return NextResponse.json({ message: 'Error creating peak hour', error: error.message }, { status: 500 });
  }
}
