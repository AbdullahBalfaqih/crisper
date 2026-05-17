// src/app/api/purchases/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { PurchaseItem } from '@/components/purchases-modal';

// Update a purchase
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const client = await db.connect();
  try {
    const { id } = params;
    const { supplierId, invoice_number, purchase_date, items, totalAmount, currency, notes } = await request.json();

    if (!supplierId || !items || items.length === 0) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    await client.query('BEGIN');

    // Update the main purchase record
    const { rows: purchaseRows } = await client.query(
      `UPDATE purchases 
       SET supplier_id = $1, invoice_number = $2, purchase_date = $3, total_amount = $4, currency = $5, notes = $6, updated_at = NOW() 
       WHERE id = $7 RETURNING *`,
      [supplierId, invoice_number, purchase_date, totalAmount, currency, notes, id]
    );

    if (purchaseRows.length === 0) {
        throw new Error('Purchase not found');
    }
    
    // Delete old items
    await client.query('DELETE FROM purchase_items WHERE purchase_id = $1', [id]);
    
    // Insert new items
    for (const item of items) {
        await client.query(
            `INSERT INTO purchase_items (purchase_id, item_name, quantity, price_per_unit) VALUES ($1, $2, $3, $4)`,
            [id, item.name, item.quantity, item.price]
        );
    }

    // Update the associated transaction
    await client.query(
        `UPDATE transactions SET amount = $1, currency = $2, description = $3, transaction_date = $4 WHERE classification = 'purchases' AND related_id = $5`,
        [totalAmount, currency, `فاتورة مشتريات #${id} من المورد`, purchase_date, id.toString()]
    );

    await client.query('COMMIT');
    
    const supplierRes = await db.query('SELECT name FROM suppliers WHERE id = $1', [supplierId]);
    const supplierName = supplierRes.rows[0]?.name || 'Unknown';

    return NextResponse.json({
        ...purchaseRows[0],
        id: purchaseRows[0].id,
        supplier: supplierName,
        supplierId: purchaseRows[0].supplier_id,
        invoiceId: purchaseRows[0].invoice_number,
        date: purchaseRows[0].purchase_date,
        totalAmount: parseFloat(purchaseRows[0].total_amount),
        items: items.map((i: PurchaseItem) => ({...i, total: i.quantity * i.price}))
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[Purchase API] Error updating purchase:', error);
    return NextResponse.json({ message: 'Error updating purchase', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

// Delete a purchase
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const client = await db.connect();
  try {
    const { id } = params;

    await client.query('BEGIN');
    
    // The ON DELETE CASCADE on purchase_items will handle item deletion.
    // We also need to delete the associated transaction.
    await client.query(`DELETE FROM transactions WHERE classification = 'purchases' AND related_id = $1`, [id]);
    const { rowCount } = await client.query('DELETE FROM purchases WHERE id = $1', [id]);

    if (rowCount === 0) {
      throw new Error('Purchase not found');
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Purchase deleted successfully' });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[Purchase API] Error deleting purchase:', error);
    return NextResponse.json({ message: 'Error deleting purchase', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
