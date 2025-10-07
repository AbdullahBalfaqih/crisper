// src/app/api/inventory/[productId]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { productId: string } }) {
  try {
    const { productId } = params;
    const { quantity } = await request.json();

    if (quantity === undefined || isNaN(parseInt(quantity))) {
      return NextResponse.json({ message: 'Valid quantity is required' }, { status: 400 });
    }
    
    const { rows } = await db.query(
      'UPDATE inventory SET quantity = $1, last_updated = NOW() WHERE product_id = $2 RETURNING *',
      [quantity, productId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Inventory item not found for this product' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ message: 'Error updating inventory' }, { status: 500 });
  }
}
