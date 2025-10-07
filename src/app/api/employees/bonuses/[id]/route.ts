// src/app/api/employees/bonuses/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { rowCount } = await db.query('DELETE FROM employee_bonuses WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Bonus record not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Bonus record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting bonus record:', error);
    return NextResponse.json({ message: 'Error deleting bonus record' }, { status: 500 });
  }
}
