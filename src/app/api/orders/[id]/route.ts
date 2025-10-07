// src/app/api/orders/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const statusTranslations: { [key: string]: string } = {
    preparing: 'طلبك قيد التجهيز الآن.',
    ready: 'طلبك جاهز للاستلام.',
    'out-for-delivery': 'طلبك في الطريق إليك.',
    completed: 'تم توصيل طلبك بنجاح.',
    rejected: 'تم رفض طلبك.',
};

async function createNotification(userId: string, message: string, orderId: number) {
    try {
        await db.query(
            'INSERT INTO notifications (user_id, message, link) VALUES ($1, $2, $3)',
            [userId, message, `/track-order?id=${orderId}`]
        );
    } catch(e) {
        console.error(`Failed to create notification for user ${userId}:`, e);
    }
}


export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const client = await db.connect();
  try {
    const { id } = params;
    const { status } = await request.json();

    if (!status) {
        return NextResponse.json({ message: 'Invalid status provided.' }, { status: 400 });
    }
    
    await client.query('BEGIN');

    const orderResult = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }
    const order = orderResult.rows[0];

    // If order is already in the requested state, do nothing.
    if (order.status === status) {
        await client.query('ROLLBACK');
        return NextResponse.json(order);
    }
    
    // Update order status
    const { rows } = await client.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    // If the order is being accepted ('preparing'), record it as revenue
    if (status === 'preparing' && order.status === 'new') {
        if (order.payment_method !== 'ضيافة') {
            await client.query(
               `INSERT INTO transactions (user_id, type, classification, amount, currency, description, related_id)
                VALUES ($1, 'revenue', 'sales', $2, $3, $4, $5)`,
               [order.user_id, order.final_amount, 'ر.ي', `مبيعات أونلاين #${order.id}`, order.id]
            );

            // If it's a bank transfer, update the bank balance
            if (order.payment_method === 'تحويل بنكي' && order.order_notes && order.order_notes.includes('تحويل بنكي عبر:')) {
                const bankName = order.order_notes.replace('تحويل بنكي عبر:', '').trim();
                if (bankName) {
                    await client.query(
                        'UPDATE banks SET balance = balance + $1 WHERE name = $2',
                        [order.final_amount, bankName]
                    );
                }
            }
        }
    }
    
    // If order is refunded ('rejected'), return items to inventory and record an expense transaction
    if (status === 'rejected') {
        const itemsResult = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [id]);
        for(const item of itemsResult.rows) {
            await client.query('UPDATE inventory SET quantity = quantity + $1 WHERE product_id = $2', [item.quantity, item.product_id]);
        }
        
        // Record as expense
        await client.query(
            `INSERT INTO transactions (user_id, type, classification, amount, currency, description, related_id, transaction_date)
             VALUES ($1, 'expense', 'sales', $2, $3, $4, $5, NOW())`,
             [order.user_id, order.final_amount, 'ر.ي', `مسترجع الفاتورة #${order.id}`, order.id]
        );
    }
    
    // Create a notification for the user
    if (order.user_id && statusTranslations[status]) {
        const message = `حالة الطلب #${order.id}: ${statusTranslations[status]}`;
        await createNotification(order.user_id, message, order.id);
    }

    await client.query('COMMIT');

    return NextResponse.json(rows[0]);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating order:', error);
    return NextResponse.json({ message: 'Error updating order' }, { status: 500 });
  } finally {
      client.release();
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    // The ON DELETE CASCADE on order_items will handle item deletion.
    const { rowCount } = await db.query('DELETE FROM orders WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ message: 'Error deleting order' }, { status: 500 });
  }
}
