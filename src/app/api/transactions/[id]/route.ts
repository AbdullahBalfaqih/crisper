// src/app/api/transactions/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
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
      `UPDATE transactions 
       SET 
         branch_id = $1, 
         user_id = $2, 
         type = $3, 
         classification = $4, 
         amount = $5, 
         currency = $6, 
         description = $7, 
         related_id = $8, 
         transaction_date = $9
       WHERE id = $10
       RETURNING *`,
      [branch_id, user_id, type, classification, amount, currency, description, related_id, transaction_date, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }
    
    return NextResponse.json(rows[0]);

  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ message: 'Error updating transaction', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { rowCount } = await db.query('DELETE FROM transactions WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ message: 'Error deleting transaction', error: error.message }, { status: 500 });
  }
}
