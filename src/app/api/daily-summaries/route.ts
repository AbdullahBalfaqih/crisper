// src/app/api/daily-summaries/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query('SELECT * FROM daily_summaries ORDER BY summary_date DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching daily summaries:', error);
    return NextResponse.json({ message: 'Error fetching daily summaries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { 
        summary_date,
        net_sales,
        total_refunds,
        total_orders,
        cash_total,
        card_total,
        network_total,
        network_by_bank,
        top_selling_items,
        cashier_performance
    } = await request.json();

    if (summary_date === undefined || net_sales === undefined) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const { rows } = await db.query(
      `INSERT INTO daily_summaries (
          summary_date, net_sales, total_refunds, total_orders, cash_total, card_total, network_total, network_by_bank, top_selling_items, cashier_performance
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [
        summary_date, 
        net_sales, 
        total_refunds, 
        total_orders, 
        cash_total, 
        card_total, 
        network_total, 
        JSON.stringify(network_by_bank), 
        JSON.stringify(top_selling_items), 
        JSON.stringify(cashier_performance)
      ]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating daily summary:', error);
    return NextResponse.json({ message: 'Error creating daily summary' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (id) {
            // Delete a single summary
            const { rowCount } = await db.query('DELETE FROM daily_summaries WHERE id = $1', [id]);
            if (rowCount === 0) {
                return NextResponse.json({ message: 'Summary not found' }, { status: 404 });
            }
            return NextResponse.json({ message: 'Summary deleted successfully' });
        } else {
            // Clear all summaries
            await db.query('TRUNCATE TABLE daily_summaries RESTART IDENTITY');
            return NextResponse.json({ message: 'All summaries cleared' });
        }

    } catch (error) {
        console.error('Error deleting summaries:', error);
        return NextResponse.json({ message: 'Error deleting summaries' }, { status: 500 });
    }
}
