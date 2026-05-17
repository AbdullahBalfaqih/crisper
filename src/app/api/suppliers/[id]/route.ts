// src/app/api/suppliers/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { name, phone_number, address, contact_person } = await request.json();

    if (!name) {
      return NextResponse.json({ message: 'Supplier name is required' }, { status: 400 });
    }
    
    const { rows } = await db.query(
      'UPDATE suppliers SET name = $1, phone_number = $2, address = $3, contact_person = $4 WHERE id = $5 RETURNING *',
      [name, phone_number, address, contact_person, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    if (error.code === '23505') { // unique_violation
        return NextResponse.json({ message: 'Supplier name or phone already exists' }, { status: 409 });
    }
    console.error('Error updating supplier:', error);
    return NextResponse.json({ message: 'Error updating supplier' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Check if supplier is used in purchases
    const purchaseCheck = await db.query('SELECT id FROM purchases WHERE supplier_id = $1 LIMIT 1', [id]);
    if (purchaseCheck.rowCount > 0) {
        return NextResponse.json({ message: 'Cannot delete supplier, as they are linked to existing purchases.' }, { status: 409 });
    }

    const { rowCount } = await db.query('DELETE FROM suppliers WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json({ message: 'Error deleting supplier' }, { status: 500 });
  }
}
