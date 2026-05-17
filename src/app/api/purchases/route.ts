// src/app/api/purchases/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { PurchaseItem } from '@/components/purchases-modal';

// GET all purchases
export async function GET() {
  try {
    const { rows } = await db.query(`
        SELECT 
            p.id, 
            p.invoice_number AS "invoiceId",
            s.id AS "supplierId",
            s.name AS supplier,
            p.purchase_date AS date,
            p.total_amount AS "totalAmount",
            p.currency,
            p.notes
        FROM purchases p
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        ORDER BY p.purchase_date DESC
    `);
    
    const purchaseIds = rows.map(p => p.id);
    if (purchaseIds.length === 0) {
        return NextResponse.json([]);
    }

    const itemsResult = await db.query(`
        SELECT 
            purchase_id, 
            item_name as name, 
            quantity, 
            price_per_unit as price
        FROM purchase_items
        WHERE purchase_id = ANY($1::bigint[])
    `, [purchaseIds]);

    const itemsByPurchaseId = itemsResult.rows.reduce((acc, item) => {
        if (!acc[item.purchase_id]) {
            acc[item.purchase_id] = [];
        }
        acc[item.purchase_id].push({
            ...item,
            quantity: parseInt(item.quantity, 10),
            price: parseFloat(item.price),
            total: parseInt(item.quantity, 10) * parseFloat(item.price)
        });
        return acc;
    }, {} as Record<number, PurchaseItem[]>);

    const fullPurchases = rows.map(p => ({
        ...p,
        totalAmount: parseFloat(p.totalAmount),
        items: itemsByPurchaseId[p.id] || []
    }));
    
    return NextResponse.json(fullPurchases);
  } catch (error: any) {
    console.error('[Purchases API] Error fetching purchases:', error);
    return NextResponse.json({ message: 'Error fetching purchases', error: error.message }, { status: 500 });
  }
}

// POST a new purchase
export async function POST(request: Request) {
  const client = await db.connect();
  try {
    const { supplierId, invoice_number, purchase_date, items, totalAmount, currency, notes, userId } = await request.json();

    if (!supplierId || !items || items.length === 0) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Insert into purchases
    const purchaseRes = await client.query(
        `INSERT INTO purchases (supplier_id, invoice_number, purchase_date, total_amount, currency, notes) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, purchase_date`,
        [supplierId, invoice_number, purchase_date, totalAmount, currency, notes]
    );
    const newPurchase = purchaseRes.rows[0];

    // 2. Insert into purchase_items
    for (const item of items) {
        await client.query(
            `INSERT INTO purchase_items (purchase_id, item_name, quantity, price_per_unit) VALUES ($1, $2, $3, $4)`,
            [newPurchase.id, item.name, item.quantity, item.price]
        );
    }
    
    const supplierRes = await client.query('SELECT name FROM suppliers WHERE id = $1', [supplierId]);
    const supplierName = supplierRes.rows[0]?.name || 'Unknown';


    // 3. Insert into transactions
    await client.query(
        `INSERT INTO transactions (user_id, type, classification, amount, currency, description, related_id, transaction_date)
         VALUES ($1, 'expense', 'purchases', $2, $3, $4, $5, $6)`,
         [userId, totalAmount, currency, `فاتورة مشتريات #${newPurchase.id} من ${supplierName}`, newPurchase.id.toString(), newPurchase.purchase_date]
    );

    await client.query('COMMIT');

    return NextResponse.json({
        id: newPurchase.id,
        supplierId,
        supplier: supplierName,
        invoiceId: invoice_number,
        date: newPurchase.purchase_date,
        totalAmount,
        currency,
        notes,
        items: items.map((i: PurchaseItem) => ({...i, total: i.quantity * i.price}))
    }, { status: 201 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[Purchases API] Error creating purchase:', error);
    return NextResponse.json({ message: 'Error creating purchase', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
