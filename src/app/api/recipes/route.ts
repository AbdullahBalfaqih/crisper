
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await db.query(`
        SELECT 
            r.id, 
            r.name, 
            r.category_id, 
            c.name as category_name,
            r.prep_time_minutes,
            r.cook_time_minutes,
            r.ingredients,
            r.instructions
        FROM recipes r
        JOIN categories c ON r.category_id = c.id
        ORDER BY r.created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ message: 'Error fetching recipes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, category_id, prep_time_minutes, cook_time_minutes, ingredients, instructions } = await request.json();
    if (!name || !category_id) {
        return NextResponse.json({ message: 'Name and category are required' }, { status: 400 });
    }
    const { rows } = await db.query(
      'INSERT INTO recipes (name, category_id, prep_time_minutes, cook_time_minutes, ingredients, instructions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, category_id, prep_time_minutes, cook_time_minutes, ingredients, instructions]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json({ message: 'Error creating recipe' }, { status: 500 });
  }
}
