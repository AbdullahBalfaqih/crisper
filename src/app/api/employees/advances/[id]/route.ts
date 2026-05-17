// src/app/api/employees/advances/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { rowCount } = await db.query('DELETE FROM employee_advances WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Advance record not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Advance record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting advance record:', error);
    return NextResponse.json({ message: 'Error deleting advance record' }, { status: 500 });
  }
}
