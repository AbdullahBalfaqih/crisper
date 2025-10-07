// src/app/api/peak-hours/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { rowCount } = await db.query('DELETE FROM peak_hours WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Peak hour not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Peak hour deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting peak hour:', error);
    return NextResponse.json({ message: 'Error deleting peak hour', error: error.message }, { status: 500 });
  }
}
