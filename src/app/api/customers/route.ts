// src/app/api/customers/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query(`
        SELECT 
            u.id,
            u.full_name,
            u.username,
            u.email,
            u.phone_number,
            COALESCE(o.total_orders, 0) AS "totalOrders",
            COALESCE(o.total_spent, 0) AS "totalSpent"
        FROM users u
        LEFT JOIN (
            SELECT 
                user_id, 
                COUNT(id) AS total_orders, 
                SUM(final_amount) AS total_spent 
            FROM orders 
            WHERE user_id IS NOT NULL
            GROUP BY user_id
        ) o ON u.id = o.user_id
        WHERE u.role = 'customer'
        ORDER BY o.total_spent DESC, u.created_at DESC
    `);
    
    const customers = rows.map(row => ({
        id: row.id,
        name: row.full_name,
        username: row.username,
        email: row.email,
        phone: row.phone_number,
        totalOrders: parseInt(row.totalOrders, 10),
        totalSpent: parseFloat(row.totalSpent)
    }));

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ message: 'Error fetching customers' }, { status: 500 });
  }
}
