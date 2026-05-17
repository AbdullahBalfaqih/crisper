// src/app/api/currencies/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const client = await db.connect();
  try {
    const { id } = params;
    const { name, symbol, exchange_rate_to_main, is_main_currency } = await request.json();

    if (is_main_currency) {
      await client.query('BEGIN');
      // Demote current main currency
      await client.query('UPDATE currencies SET is_main_currency = false WHERE is_main_currency = true');
      // Promote new main currency
      const { rows } = await client.query(
        'UPDATE currencies SET name = $1, symbol = $2, exchange_rate_to_main = $3, is_main_currency = true WHERE id = $4 RETURNING *',
        [name, symbol, 1, id]
      );
       // Recalculate other currencies based on the new main currency
      const newMainRate = exchange_rate_to_main; // The rate of the new main currency relative to the OLD main currency
      if (newMainRate > 0) {
        await client.query('UPDATE currencies SET exchange_rate_to_main = exchange_rate_to_main / $1 WHERE is_main_currency = false', [newMainRate]);
      }
      await client.query('COMMIT');
      return NextResponse.json(rows[0]);

    } else {
      const { rows } = await client.query(
        'UPDATE currencies SET name = $1, symbol = $2, exchange_rate_to_main = $3 WHERE id = $4 RETURNING *',
        [name, symbol, exchange_rate_to_main, id]
      );
      if (rows.length === 0) {
        return NextResponse.json({ message: 'Currency not found' }, { status: 404 });
      }
      return NextResponse.json(rows[0]);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating currency:', error);
    return NextResponse.json({ message: 'Error updating currency' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    // Prevent deleting the main currency
    const checkMain = await db.query('SELECT is_main_currency FROM currencies WHERE id = $1', [id]);
    if (checkMain.rows[0]?.is_main_currency) {
        return NextResponse.json({ message: 'Cannot delete the main currency' }, { status: 400 });
    }

    const { rowCount } = await db.query('DELETE FROM currencies WHERE id = $1', [id]);
    if (rowCount === 0) {
      return NextResponse.json({ message: 'Currency not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Currency deleted successfully' });
  } catch (error) {
    console.error('Error deleting currency:', error);
    return NextResponse.json({ message: 'Error deleting currency' }, { status: 500 });
  }
}
