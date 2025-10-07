// src/app/api/inventory/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query(`
        SELECT 
            i.id as "inventoryId", 
            p.id as "productId",
            p.name as "productName", 
            i.quantity, 
            i.last_updated as "lastUpdated",
            p.price
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        ORDER BY p.name
    `);
    return NextResponse.json(rows.map(item => ({...item, price: parseFloat(item.price), quantity: parseInt(item.quantity)})));
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ message: 'Error fetching inventory' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    try {
        await db.query('UPDATE inventory SET quantity = 0, last_updated = NOW()');
        return NextResponse.json({ message: 'Inventory cleared successfully' });
    } catch (error) {
        console.error('Error clearing inventory:', error);
        return NextResponse.json({ message: 'Error clearing inventory' }, { status: 500 });
    }
}
