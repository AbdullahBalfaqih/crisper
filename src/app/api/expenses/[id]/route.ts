// src/app/api/expenses/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { amount, currency, description, recipient, transaction_date, user_id } = await request.json();

    if (!amount || !description) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const fullDescription = recipient ? `${recipient}: ${description}` : description;
    
    const { rows } = await db.query(
      `UPDATE transactions 
       SET 
         amount = $1, 
         currency = $2, 
         description = $3, 
         transaction_date = $4, 
         user_id = $5
       WHERE id = $6 AND type = 'expense' AND classification = 'expense'
       RETURNING *`,
      [amount, currency, fullDescription, transaction_date, user_id, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Expense not found' }, { status: 404 });
    }
    
    const updatedExpense = rows[0];
    let updatedRecipient = '';
    let main_description = updatedExpense.description || '';
    if (updatedExpense.description && updatedExpense.description.includes(':')) {
        const parts = updatedExpense.description.split(':');
        updatedRecipient = parts.shift()?.trim() || '';
        main_description = parts.join(':').trim();
    }

    return NextResponse.json({
        ...updatedExpense,
        recipient: updatedRecipient,
        description: main_description
    });

  } catch (error: any) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ message: 'Error updating expense', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { rowCount } = await db.query(
        'DELETE FROM transactions WHERE id = $1 AND type = $2 AND classification = $3', 
        [id, 'expense', 'expense']
    );

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ message: 'Error deleting expense', error: error.message }, { status: 500 });
  }
}
