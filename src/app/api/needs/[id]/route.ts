// src/app/api/needs/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { name, quantity, notes, status } = await request.json();

    if (status) {
        // Handle status toggle
        if (!['required', 'purchased'].includes(status)) {
            return NextResponse.json({ message: 'Invalid status value' }, { status: 400 });
        }
        const { rows } = await db.query(
            'UPDATE needs SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );
        return NextResponse.json(rows[0]);
    } else {
        // Handle full edit
        if (!name || !quantity) {
            return NextResponse.json({ message: 'Name and quantity are required' }, { status: 400 });
        }
        const { rows } = await db.query(
            'UPDATE needs SET name = $1, quantity = $2, notes = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
            [name, quantity, notes, id]
        );
        if (rows.length === 0) {
            return NextResponse.json({ message: 'Need not found' }, { status: 404 });
        }
        return NextResponse.json(rows[0]);
    }

  } catch (error) {
    console.error('Error updating need:', error);
    return NextResponse.json({ message: 'Error updating need' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { rowCount } = await db.query('DELETE FROM needs WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Need not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Need deleted successfully' });
  } catch (error) {
    console.error('Error deleting need:', error);
    return NextResponse.json({ message: 'Error deleting need' }, { status: 500 });
  }
}
