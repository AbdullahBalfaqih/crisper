
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    try {
        console.log("DB DEBUG: Checking connection...");
        const start = Date.now();
        const { rows: test } = await db.query('SELECT 1 as test');
        const dbTime = Date.now() - start;
        
        console.log("DB DEBUG: Connection OK, time:", dbTime);
        
        console.log("DB DEBUG: Creating indexes...");
        await db.query('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)');
        await db.query('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)');
        await db.query('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)');
        console.log("DB DEBUG: Indexes created.");

        const { rows: tableSize } = await db.query('SELECT count(*) as count FROM orders');
        console.log("DB DEBUG: Table size:", tableSize[0].count);

        const { rows: activeQueries } = await db.query(`
            SELECT pid, state, query, wait_event_type, wait_event 
            FROM pg_stat_activity 
            WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%'
        `);

        return NextResponse.json({
            status: 'ok',
            connectionTime: dbTime,
            orderCount: tableSize[0].count,
            activeQueries: activeQueries
        });
    } catch (error: any) {
        console.error("DB DEBUG ERROR:", error);
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
