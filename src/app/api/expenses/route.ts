// src/app/api/expenses/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query(
      `SELECT id, transaction_date, amount, currency, description, user_id
       FROM transactions 
       WHERE type = 'expense' AND classification = 'expense'
       ORDER BY transaction_date DESC`
    );
    // Parse description to extract recipient
    const expenses = rows.map(row => {
        let recipient = '';
        let main_description = row.description || '';
        if (row.description && row.description.includes(':')) {
            const parts = row.description.split(':');
            recipient = parts.shift()?.trim() || '';
            main_description = parts.join(':').trim();
        }
        return {
            ...row,
            recipient,
            description: main_description,
        }
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ message: 'Error fetching expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { amount, currency, description, recipient, transaction_date, user_id } = await request.json();

    if (!amount || !description) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Combine recipient and description into a single text field
    const fullDescription = recipient ? `${recipient}: ${description}` : description;
    
    const { rows } = await db.query(
      `INSERT INTO transactions (type, classification, amount, currency, description, transaction_date, user_id) 
       VALUES ('expense', 'expense', $1, $2, $3, $4, $5) 
       RETURNING *`,
      [amount, currency, fullDescription, transaction_date, user_id]
    );

    const savedExpense = rows[0];
     let savedRecipient = '';
     let main_description = savedExpense.description || '';
      if (savedExpense.description && savedExpense.description.includes(':')) {
            const parts = savedExpense.description.split(':');
            savedRecipient = parts.shift()?.trim() || '';
            main_description = parts.join(':').trim();
      }

    return NextResponse.json({
        ...savedExpense,
        recipient: savedRecipient,
        description: main_description
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ message: 'Error creating expense' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await db.query(`DELETE FROM transactions WHERE type = 'expense' AND classification = 'expense'`);
    return NextResponse.json({ message: 'All expenses deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting all expenses:', error);
    return NextResponse.json({ message: 'Error deleting all expenses', error: error.message }, { status: 500 });
  }
}
