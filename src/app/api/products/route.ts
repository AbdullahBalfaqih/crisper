// src/app/api/products/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query('SELECT id, name, price, category_id as "categoryId", image_url as "imageUrl", description FROM products ORDER BY name');
    return NextResponse.json(rows.map(p => ({...p, price: parseFloat(p.price)})));
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ message: 'Error fetching products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    const { name, price, categoryId, imageUrl, description } = await request.json();
    
    if (!name || !price || !categoryId) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Name, price, and category are required' }, { status: 400 });
    }

    // Insert into products table
    const productResult = await client.query(
      'INSERT INTO products (name, price, category_id, image_url, description, is_available) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id, name, price, category_id as "categoryId", image_url as "imageUrl", description',
      [name, price, categoryId, imageUrl, description]
    );
    const newProduct = productResult.rows[0];

    // Insert into inventory table
    await client.query(
        'INSERT INTO inventory (product_id, quantity) VALUES ($1, 0)',
        [newProduct.id]
    );

    await client.query('COMMIT');

    return NextResponse.json({...newProduct, price: parseFloat(newProduct.price)}, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating product:', error);
    return NextResponse.json({ message: 'Error creating product' }, { status: 500 });
  } finally {
      client.release();
  }
}
