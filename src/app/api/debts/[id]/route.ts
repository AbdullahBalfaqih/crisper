// src/app/api/debts/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const translateStatusToEnglish = (status: 'مسدد' | 'غير مسدد'): 'paid' | 'unpaid' => {
    return status === 'مسدد' ? 'paid' : 'unpaid';
};

const translateStatusToArabic = (status: 'paid' | 'unpaid'): 'مسدد' | 'غير مسدد' => {
    return status === 'paid' ? 'مسدد' : 'غير مسدد';
};

// Update a debt (e.g., set as 'settled')
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { status } = await request.json();

    if (status !== 'مسدد') {
        return NextResponse.json({ message: 'Invalid status update' }, { status: 400 });
    }
    
    const englishStatus = translateStatusToEnglish(status);

    const { rows } = await db.query(
      'UPDATE debts SET status = $1 WHERE id = $2 RETURNING *',
      [englishStatus, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Debt not found' }, { status: 404 });
    }

    const translatedRow = {
        ...rows[0],
        status: translateStatusToArabic(rows[0].status)
    };

    return NextResponse.json(translatedRow);
  } catch (error) {
    console.error('Error updating debt:', error);
    return NextResponse.json({ message: 'Error updating debt' }, { status: 500 });
  }
}

// Delete a debt
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { rowCount } = await db.query('DELETE FROM debts WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Debt not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Debt deleted successfully' });
  } catch (error) {
    console.error('Error deleting debt:', error);
    return NextResponse.json({ message: 'Error deleting debt' }, { status: 500 });
  }
}
