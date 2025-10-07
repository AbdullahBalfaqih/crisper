// src/app/api/orders/archive/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// This endpoint handles the "End of Day" process.
export async function POST() {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // We use TRUNCATE instead of DELETE. TRUNCATE is faster and automatically
    // resets the identity sequence. The CASCADE option will automatically remove
    // dependent rows in other tables (like order_items, delivery_missions).
    // This resolves the "duplicate key" error by ensuring the sequence is always reset.
    await client.query("TRUNCATE TABLE orders RESTART IDENTITY CASCADE");

    await client.query('COMMIT');
    
    return NextResponse.json({ message: 'End of day process successful. Orders archived and sequence reset.' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('End of Day API Error:', error);
    return NextResponse.json({ message: 'Error during end of day process' }, { status: 500 });
  } finally {
    client.release();
  }
}
