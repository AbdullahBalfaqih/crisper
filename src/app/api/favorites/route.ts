// src/app/api/favorites/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET user's favorites
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const { rows } = await db.query(`
      SELECT 
        p.id, 
        p.name, 
        p.price, 
        p.image_url as "imageUrl",
        p.description
      FROM user_favorites uf
      JOIN products p ON uf.product_id = p.id
      WHERE uf.user_id = $1
      ORDER BY uf.created_at DESC
    `, [userId]);
    
    return NextResponse.json(rows.map(p => ({...p, price: parseFloat(p.price)})));

  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ message: 'Error fetching favorites' }, { status: 500 });
  }
}

// POST to add a favorite
export async function POST(request: Request) {
  try {
    const { userId, productId } = await request.json();
    if (!userId || !productId) {
      return NextResponse.json({ message: 'User ID and Product ID are required' }, { status: 400 });
    }

    await db.query(
      'INSERT INTO user_favorites (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, productId]
    );

    return NextResponse.json({ message: 'Favorite added' }, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ message: 'Error adding favorite' }, { status: 500 });
  }
}

// DELETE to remove a favorite
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');

    if (!userId || !productId) {
      return NextResponse.json({ message: 'User ID and Product ID are required' }, { status: 400 });
    }

    const { rowCount } = await db.query(
      'DELETE FROM user_favorites WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Favorite not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Favorite removed' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ message: 'Error removing favorite' }, { status: 500 });
  }
}
