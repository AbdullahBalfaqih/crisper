// src/app/api/deliveries/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const { status } = await request.json();
        
        if (!status) {
            return NextResponse.json({ message: 'Status is required' }, { status: 400 });
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            
            const deliveryResult = await client.query('SELECT * FROM deliveries WHERE id = $1', [id]);
            if (deliveryResult.rows.length === 0) {
                 throw new Error('Delivery mission not found');
            }
            const delivery = deliveryResult.rows[0];

            // Update delivery status and completed_at timestamp if applicable
            const { rows } = await client.query(
                'UPDATE deliveries SET status = $1, completed_at = CASE WHEN $1 = ANY($2::text[]) THEN NOW() ELSE completed_at END WHERE id = $3 RETURNING *',
                [status, ['delivered', 'cancelled'], id]
            );

            // Update the corresponding order's status based on the new delivery status
            if (status === 'delivered') {
                await client.query("UPDATE orders SET status = 'completed' WHERE id = $1", [delivery.order_id]);
            } else if (status === 'cancelled') {
                 await client.query("UPDATE orders SET status = 'ready' WHERE id = $1", [delivery.order_id]);
            }
            
            await client.query('COMMIT');
            
            return NextResponse.json(rows[0]);

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error: any) {
        console.error('Error updating delivery:', error);
        return NextResponse.json({ message: 'Error updating delivery' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { rowCount } = await db.query('DELETE FROM deliveries WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Delivery not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Delivery deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery:', error);
    return NextResponse.json({ message: 'Error deleting delivery.' }, { status: 500 });
  }
}
