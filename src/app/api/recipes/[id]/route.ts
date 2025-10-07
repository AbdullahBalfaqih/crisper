
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { name, category_id, prep_time_minutes, cook_time_minutes, ingredients, instructions } = await request.json();

    if (!name || !category_id) {
      return NextResponse.json({ message: 'Name and category are required' }, { status: 400 });
    }
    
    const { rows } = await db.query(
      'UPDATE recipes SET name = $1, category_id = $2, prep_time_minutes = $3, cook_time_minutes = $4, ingredients = $5, instructions = $6, updated_at = NOW() WHERE id = $7 RETURNING *',
      [name, category_id, prep_time_minutes, cook_time_minutes, ingredients, instructions, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json({ message: 'Error updating recipe' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { rowCount } = await db.query('DELETE FROM recipes WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json({ message: 'Error deleting recipe' }, { status: 500 });
  }
}
