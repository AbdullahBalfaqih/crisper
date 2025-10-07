// src/app/api/coupons/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { type, value, max_uses, expiry_date, is_active } = await request.json();

    if (!type || value === undefined || max_uses === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    const { rows } = await db.query(
      'UPDATE coupons SET type = $1, value = $2, max_uses = $3, expiry_date = $4, is_active = $5 WHERE id = $6 RETURNING *',
      [type, value, max_uses, expiry_date, is_active, id.toUpperCase()]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({...rows[0], value: parseFloat(rows[0].value)});
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ message: 'Error updating coupon' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { rowCount } = await db.query('DELETE FROM coupons WHERE id = $1', [id.toUpperCase()]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ message: 'Error deleting coupon' }, { status: 500 });
  }
}
