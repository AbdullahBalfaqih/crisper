// src/app/api/products/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { name, price, categoryId, imageUrl, description } = await request.json();

    if (!name || !price || !categoryId) {
      return NextResponse.json({ message: 'Name, price, and category are required' }, { status: 400 });
    }
    
    const { rows } = await db.query(
      'UPDATE products SET name = $1, price = $2, category_id = $3, image_url = $4, description = $5, updated_at = NOW() WHERE id = $6 RETURNING id, name, price, category_id as "categoryId", image_url as "imageUrl", description',
      [name, price, categoryId, imageUrl, description, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({...rows[0], price: parseFloat(rows[0].price)});
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ message: 'Error updating product' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    // The inventory table has ON DELETE CASCADE, so inventory record will be deleted automatically.
    const { rowCount } = await db.query('DELETE FROM products WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    // You might get a foreign key violation error if the product is in an order
    // It's better to handle this gracefully.
    return NextResponse.json({ message: 'Error deleting product. It might be used in existing orders.' }, { status: 500 });
  }
}
