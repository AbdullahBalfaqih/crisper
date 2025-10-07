// src/app/api/categories/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ message: 'Category name is required' }, { status: 400 });
    }
    
    const { rows } = await db.query(
      'UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ message: 'Error updating category' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    // Check if any product is using this category
    const productCheck = await db.query('SELECT id FROM products WHERE category_id = $1 LIMIT 1', [id]);
    if (productCheck.rowCount > 0) {
        return NextResponse.json({ message: 'Cannot delete category as it is being used by products.' }, { status: 409 });
    }

    const { rowCount } = await db.query('DELETE FROM categories WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ message: 'Error deleting category' }, { status: 500 });
  }
}
