// src/app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { db, setupDatabase } from '@/lib/db';
import type { OrderItem } from '@/lib/types';

export async function GET(request: Request) {
    try {
        // await setupDatabase(); // Commented out to avoid potential locks since DB is already up
        const { searchParams } = new URL(request.url);
        const isOnline = searchParams.get('online') === 'true';
        const userId = searchParams.get('userId');
        const orderIdParam = searchParams.get('id');

        if (orderIdParam) {
            const orderId = parseInt(orderIdParam, 10);
            if (isNaN(orderId)) {
                return NextResponse.json({ message: 'Invalid Order ID format' }, { status: 400 });
            }
            const { rows } = await db.query(`
                SELECT
                    o.id, o.created_at, o.customer_name, u.phone_number as customer_phone, o.status, o.type,
                    o.final_amount, o.payment_method, o.payment_status, o.payment_proof_url,
                    o.order_notes, a.address_details, d.driver_name, d.commission as driver_commission,
                    a.latitude, a.longitude,
                    (SELECT json_agg(
                        json_build_object('name', p.name, 'quantity', oi.quantity, 'notes', oi.notes, 'price', oi.price_per_item)
                    ) FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id) as items
                FROM orders o
                LEFT JOIN addresses a ON o.address_id = a.id
                LEFT JOIN deliveries d ON o.id = d.order_id
                LEFT JOIN users u ON o.user_id = u.id
                WHERE o.id = $1
            `, [orderId]);

            if (rows.length === 0) return NextResponse.json({ message: 'Order not found' }, { status: 404 });
            const order = rows[0];
            return NextResponse.json({
                ...order,
                date: new Date(order.created_at),
                final_amount: parseFloat(order.final_amount),
                items: order.items || [],
            });
        }

        let query = `
            SELECT
                o.id, o.created_at, COALESCE(u.full_name, 'غير مسجل') as cashier, o.total_amount,
                o.discount_amount, o.final_amount, o.payment_method, o.payment_status, o.status,
                o.order_notes, o.customer_name, u.phone_number as customer_phone, o.type,
                o.payment_proof_url, o.address_id, a.address_details, a.latitude, a.longitude,
                 d.driver_name,
                (SELECT json_agg(
                    json_build_object(
                        'id', COALESCE(p.id::text, ''), 
                        'name', COALESCE(p.name, 'منتج غير معروف'), 
                        'quantity', COALESCE(oi.quantity, 0), 
                        'price', COALESCE(oi.price_per_item, 0),
                        'notes', COALESCE(oi.notes, ''), 
                        'imageUrl', COALESCE(p.image_url, ''), 
                        'categoryId', COALESCE(p.category_id::text, ''),
                        'imageHint', ''
                    )
                ) FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id) as items
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN addresses a ON o.address_id = a.id
            LEFT JOIN deliveries d ON o.id = d.order_id
        `;

        const queryParams = [];
        let whereClauses = [];

        if (userId) {
            queryParams.push(userId);
            whereClauses.push(`o.user_id = $${queryParams.length}`);
        }

        if (isOnline) {
            whereClauses.push("o.type != 'pickup' OR o.customer_name IS NOT NULL");
            whereClauses.push("o.payment_method != 'ضيافة'");
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        if (isOnline) {
            query += ` ORDER BY o.created_at ASC`;
        } else {
            query += ` ORDER BY o.created_at DESC`;
        }


        const { rows } = await db.query(query, queryParams);

        const formattedOrders = rows.map(order => {
            let dateStr = 'Invalid Date';
            try {
                if (order.created_at) {
                    const d = new Date(order.created_at);
                    if (!isNaN(d.getTime())) {
                        dateStr = d.toISOString();
                    }
                }
            } catch (e) {
                console.error("Date parsing error:", e);
            }

            return {
                id: typeof order.id === 'string' ? parseInt(order.id, 10) : order.id,
                date: dateStr,
                cashier: order.cashier || 'غير مسجل',
                items: order.items || [],
                total_amount: parseFloat(order.total_amount || 0),
                discount_amount: parseFloat(order.discount_amount || 0),
                final_amount: parseFloat(order.final_amount || 0),
                payment_method: order.payment_method,
                payment_status: (order.payment_method === 'تحويل بنكي' || order.payment_status === 'paid') ? 'paid' : 'unpaid',
                status: order.status,
                type: order.type,
                customer_name: order.customer_name,
                customer_phone: order.customer_phone,
                order_notes: order.order_notes,
                address_details: order.address_details,
                latitude: order.latitude,
                longitude: order.longitude,
                driver_name: order.driver_name,
                payment_proof_url: order.payment_proof_url,
                bankName: order.payment_method === 'شبكة' ? (order.order_notes || '').replace('دفعة الشبكة: ', '') : undefined,
            };
        });

        const responseJson = {
            orders: formattedOrders,
            debugCount: rows.length
        };

        return NextResponse.json(formattedOrders, {
            headers: {
                'X-Debug-Count': rows.length.toString()
            }
        });

    } catch (error: any) {
        console.error("Error fetching orders:", error);
        return NextResponse.json({
            message: 'Error fetching orders',
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}


export async function POST(request: Request) {
    const client = await db.connect();
    try {
        const payload = await request.json();
        console.log("Creating new order with payload:", JSON.stringify(payload, null, 2));
        
        const {
            userId,
            total_amount,
            discount_amount,
            final_amount,
            payment_method,
            payment_status,
            type,
            items,
            bankName,
            order_notes,
            customer_name,
            customer_phone,
            payment_proof_url,
            address_id
        } = payload;

        if (!items || items.length === 0 || !payment_method) {
            console.error("Missing required fields in order payload");
            return NextResponse.json({ message: 'Missing required fields: items and payment_method are required' }, { status: 400 });
        }

        await client.query('BEGIN');

        // Step 1: Check/Update inventory
        console.log("Checking inventory for items...");
        for (const item of items) {
            const inventoryResult = await client.query('SELECT quantity FROM inventory WHERE product_id = $1', [item.id]);
            if (inventoryResult.rows.length === 0) {
                console.warn(`Product ${item.name} (${item.id}) not found in inventory. Creating record...`);
                await client.query('INSERT INTO inventory (product_id, quantity) VALUES ($1, $2)', [item.id, 0]);
                throw new Error(`المنتج ${item.name} غير متوفر في المخزون حالياً.`);
            }
            
            if (inventoryResult.rows[0].quantity < item.quantity) {
                throw new Error(`الكمية المطلوبة من ${item.name} غير متوفرة (المتاح: ${inventoryResult.rows[0].quantity})`);
            }
        }

        // Combine bank name with order notes
        let combinedNotes = order_notes || '';
        if (payment_method === 'شبكة' && bankName) {
            combinedNotes = combinedNotes ? `${combinedNotes} | دفعة الشبكة: ${bankName}` : `دفعة الشبكة: ${bankName}`;
        }

        // Determine order status
        const status = (type === 'pickup' && !customer_name) ? 'completed' : 'new';
        console.log(`Setting order status to: ${status}`);

        // Step 2: Create the order
        console.log("Inserting order into database...");
        const orderResult = await client.query(
            `INSERT INTO orders (user_id, customer_name, customer_phone, total_amount, discount_amount, final_amount, payment_method, payment_status, type, status, order_notes, payment_proof_url, address_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, created_at`,
            [
                userId || null,
                customer_name || null,
                customer_phone || null,
                total_amount || 0,
                discount_amount || 0,
                final_amount || 0,
                payment_method,
                payment_status || 'paid',
                type || 'pickup',
                status,
                combinedNotes,
                payment_proof_url || null,
                address_id || null
            ]
        );
        const newOrder = orderResult.rows[0];
        console.log(`Order created successfully with ID: ${newOrder.id}`);

        // Step 3: Insert order items
        for (const item of items) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, quantity, price_per_item, notes)
         VALUES ($1, $2, $3, $4, $5)`,
                [newOrder.id, item.id, item.quantity, item.price, item.notes || '']
            );
        }

        // Step 4: Update inventory
        for (const item of items) {
            await client.query(
                'UPDATE inventory SET quantity = quantity - $1, last_updated = NOW() WHERE product_id = $2',
                [item.quantity, item.id]
            );
        }

        // Step 5: Record transaction
        if (payment_method !== 'ضيافة' && status === 'completed') {
            console.log("Recording transaction in accounting fund...");
            await client.query(
                `INSERT INTO transactions (user_id, type, classification, amount, currency, description, related_id)
            VALUES ($1, 'revenue', 'sales', $2, $3, $4, $5)`,
                [userId || null, final_amount, 'ر.ي', `مبيعات الفاتورة #${newOrder.id}`, newOrder.id]
            );

            if (payment_method === 'شبكة' && bankName) {
                await client.query(
                    'UPDATE banks SET balance = balance + $1 WHERE name = $2',
                    [final_amount, bankName]
                );
            }
        }

        await client.query('COMMIT');
        console.log("Transaction committed successfully.");

        return NextResponse.json({ ...newOrder, items }, { status: 201 });

    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        return NextResponse.json({ 
            message: error.message || 'Error creating order',
            detail: error.detail || null 
        }, { status: 500 });
    } finally {
        client.release();
    }
}
