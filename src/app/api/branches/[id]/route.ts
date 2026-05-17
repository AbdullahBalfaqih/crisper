// src/app/api/branches/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { name, city, address, phone_number, manager_id } = await request.json();

    if (!name) {
      return NextResponse.json({ message: 'Branch name is required' }, { status: 400 });
    }
    
    const { rows } = await db.query(
      'UPDATE branches SET name = $1, city = $2, address = $3, phone_number = $4, manager_id = $5 WHERE id = $6 RETURNING *',
      [name, city, address, phone_number, manager_id, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Branch not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating branch:', error);
    return NextResponse.json({ message: 'Error updating branch' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { rowCount } = await db.query('DELETE FROM branches WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Branch not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return NextResponse.json({ message: 'Error deleting branch' }, { status: 500 });
  }
}
