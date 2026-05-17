// src/app/api/hospitality/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // We are fetching orders that were marked as 'hospitality'
    const { rows } = await db.query(`
        SELECT 
            o.id, 
            o.created_at AS date,
            o.final_amount AS total,
            o.order_notes AS notes,
            u.full_name AS user,
            COALESCE(o.customer_name, emp.full_name) as employee
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN users emp ON o.order_notes LIKE '%' || emp.full_name || '%' -- This is a simplification
        WHERE o.payment_method = 'ضيافة'
        ORDER BY o.created_at DESC
    `);

    // The logic to extract employee name from notes is simplified. 
    // A better approach would be to store a dedicated guest/employee ID.
    const hospitalityData = rows.map(row => {
        let employeeName = row.employee;
        if (!employeeName && row.notes && row.notes.startsWith('ضيافة: ')) {
            employeeName = row.notes.replace('ضيافة: ', '').trim();
        }

        return {
            id: row.id,
            employee: employeeName || 'غير محدد',
            date: new Date(row.date).toLocaleString('ar-SA'),
            total: parseFloat(row.total),
            user: row.user || 'غير معروف',
            notes: row.notes || '-',
        };
    });

    return NextResponse.json(hospitalityData);
  } catch (error) {
    console.error('Error fetching hospitality log:', error);
    return NextResponse.json({ message: 'Error fetching hospitality log' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (id) {
            // Delete a single hospitality order
            const { rowCount } = await db.query('DELETE FROM orders WHERE id = $1 AND payment_method = $2', [id, 'ضيافة']);
            if (rowCount === 0) {
                return NextResponse.json({ message: 'Hospitality invoice not found' }, { status: 404 });
            }
            return NextResponse.json({ message: 'Hospitality invoice deleted successfully' });
        } else {
            // Clear all hospitality orders
            await db.query('DELETE FROM orders WHERE payment_method = $1', ['ضيافة']);
            return NextResponse.json({ message: 'All hospitality invoices cleared' });
        }

    } catch (error) {
        console.error('Error deleting hospitality log:', error);
        return NextResponse.json({ message: 'Error deleting hospitality log' }, { status: 500 });
    }
}
