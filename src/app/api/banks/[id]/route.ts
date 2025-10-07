// src/app/api/banks/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { name, iban, balance } = await request.json();

    if (!name) {
      return NextResponse.json({ message: 'Bank name is required' }, { status: 400 });
    }
    
    const { rows } = await db.query(
      'UPDATE banks SET name = $1, iban = $2, balance = $3 WHERE id = $4 RETURNING *',
      [name, iban, balance, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Bank not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating bank:', error);
    return NextResponse.json({ message: 'Error updating bank' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { rowCount } = await db.query('DELETE FROM banks WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Bank not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Bank deleted successfully' });
  } catch (error) {
    console.error('Error deleting bank:', error);
    return NextResponse.json({ message: 'Error deleting bank' }, { status: 500 });
  }
}
