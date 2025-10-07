// src/app/api/coupons/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query('SELECT id, type, value, max_uses, times_used, is_active, expiry_date FROM coupons ORDER BY created_at DESC');
    return NextResponse.json(rows.map(c => ({...c, value: parseFloat(c.value) })));
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ message: 'Error fetching coupons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, type, value, max_uses, expiry_date } = await request.json();

    if (!id || !type || value === undefined || max_uses === undefined) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    const { rows } = await db.query(
      'INSERT INTO coupons (id, type, value, max_uses, expiry_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id.toUpperCase(), type, value, max_uses, expiry_date]
    );

    return NextResponse.json({...rows[0], value: parseFloat(rows[0].value)}, { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') { // unique_violation
        return NextResponse.json({ message: 'Coupon code already exists' }, { status: 409 });
    }
    console.error('Error creating coupon:', error);
    return NextResponse.json({ message: 'Error creating coupon' }, { status: 500 });
  }
}
