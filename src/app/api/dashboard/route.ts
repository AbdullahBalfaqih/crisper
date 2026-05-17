// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { startOfMonth, subMonths, endOfMonth } from 'date-fns';

async function getMonthlyFigure(query: string, date: Date) {
    const startDate = startOfMonth(date);
    const endDate = endOfMonth(date);
    const { rows } = await db.query(query, [startDate, endDate]);
    return parseFloat(rows[0]?.figure || '0');
}

function calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) {
        return current > 0 ? Infinity : 0;
    }
    return ((current - previous) / previous) * 100;
}

export async function GET() {
  try {
    const now = new Date();
    const lastMonth = subMonths(now, 1);

    // Queries
    const transactionsRevenueQuery = `SELECT SUM(amount) as figure FROM transactions WHERE type='revenue' AND transaction_date BETWEEN $1 AND $2`;
    
    const newCustomersQuery = `SELECT COUNT(id) as figure FROM users WHERE role='customer' AND created_at BETWEEN $1 AND $2`;
    const totalSalesQuery = `SELECT COUNT(id) as figure FROM orders WHERE status='completed' AND created_at BETWEEN $1 AND $2`;
    
    // Active Now (last hour)
    const activeNowQuery = `SELECT COUNT(id) as figure FROM orders WHERE created_at >= NOW() - INTERVAL '1 hour'`;
    
    // Daily sales for the last 7 days
    const dailySalesQuery = `
        SELECT 
            DATE(day) as date, 
            COALESCE(SUM(final_amount), 0) as sales
        FROM 
            generate_series(
                NOW() - INTERVAL '6 days', 
                NOW(), 
                '1 day'
            ) as day
        LEFT JOIN 
            orders ON DATE(orders.created_at) = DATE(day) AND status='completed'
        GROUP BY 
            day
        ORDER BY 
            day ASC;
    `;

    // Fetching data in parallel
    const [
        currentMonthRevenue,
        previousMonthRevenue,
        currentMonthCustomers,
        previousMonthCustomers,
        currentMonthSales,
        previousMonthSales,
        activeNowResult,
        dailySalesResult
    ] = await Promise.all([
        getMonthlyFigure(transactionsRevenueQuery, now),
        getMonthlyFigure(transactionsRevenueQuery, lastMonth),
        getMonthlyFigure(newCustomersQuery, now),
        getMonthlyFigure(newCustomersQuery, lastMonth),
        getMonthlyFigure(totalSalesQuery, now),
        getMonthlyFigure(totalSalesQuery, lastMonth),
        db.query(activeNowQuery),
        db.query(dailySalesQuery),
    ]);
    
    const dashboardData = {
        totalRevenue: currentMonthRevenue,
        revenueChange: calculatePercentageChange(currentMonthRevenue, previousMonthRevenue),
        newCustomers: currentMonthCustomers,
        customersChange: calculatePercentageChange(currentMonthCustomers, previousMonthCustomers),
        totalSales: currentMonthSales,
        salesChange: calculatePercentageChange(currentMonthSales, previousMonthSales),
        activeNow: parseInt(activeNowResult.rows[0].figure, 10),
        dailySales: dailySalesResult.rows.map(r => ({
            date: r.date,
            sales: parseFloat(r.sales)
        }))
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ message: 'Error fetching dashboard data' }, { status: 500 });
  }
}
