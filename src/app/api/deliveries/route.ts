// src/app/api/deliveries/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all deliveries
export async function GET() {
  try {
    const { rows } = await db.query('SELECT * FROM deliveries ORDER BY assigned_at DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json({ message: 'Error fetching deliveries' }, { status: 500 });
  }
}

// POST a new delivery mission
export async function POST(request: Request) {
  const client = await db.connect();
  try {
    const { orderId, driverName, driverPhone, commission } = await request.json();
    
    if (!orderId || !driverName) {
      return NextResponse.json({ message: 'يجب تحديد الطلب واسم السائق' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Check if there is already an ACTIVE mission for this order
    const existingMissionCheck = await client.query(
      "SELECT id FROM deliveries WHERE order_id = $1 AND status IN ('assigned', 'picked_up')",
      [orderId]
    );

    if (existingMissionCheck.rows.length > 0) {
      throw new Error('هذا الطلب مُسند بالفعل إلى سائق وهو في الطريق.');
    }

    // Create the delivery record
    const { rows } = await client.query(
      'INSERT INTO deliveries (order_id, driver_name, driver_phone, commission, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [orderId, driverName, driverPhone, commission, 'assigned']
    );

    // Update the order status to 'out-for-delivery'
    await client.query("UPDATE orders SET status = 'out-for-delivery' WHERE id = $1", [orderId]);

    await client.query('COMMIT');
    
    return NextResponse.json(rows[0], { status: 201 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating delivery:', error);
    return NextResponse.json({ message: error.message || 'فشل إسناد المهمة للسائق.' }, { status: 500 });
  } finally {
    client.release();
  }
}
