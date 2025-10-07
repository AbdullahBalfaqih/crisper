// src/app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query('SELECT * FROM transactions ORDER BY transaction_date DESC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ message: 'Error fetching transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { 
        branch_id, 
        user_id, 
        type, 
        classification, 
        amount, 
        currency, 
        description, 
        related_id, 
        transaction_date 
    } = await request.json();

    if (!type || !classification || !amount || !currency || !description) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    const { rows } = await db.query(
      `INSERT INTO transactions (branch_id, user_id, type, classification, amount, currency, description, related_id, transaction_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [branch_id, user_id, type, classification, amount, currency, description, related_id, transaction_date]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ message: 'Error creating transaction' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await db.query('DELETE FROM transactions');
    return NextResponse.json({ message: 'All transactions deleted successfully' });
  } catch (error) {
    console.error('Error deleting all transactions:', error);
    return NextResponse.json({ message: 'Error deleting all transactions' }, { status: 500 });
  }
}
