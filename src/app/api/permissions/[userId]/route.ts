// src/app/api/permissions/[userId]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET handler to fetch permissions for a user
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params;
    const { rows } = await db.query(
        'SELECT permissions FROM user_permissions WHERE user_id = $1',
        [userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'No permissions found for this user' }, { status: 404 });
    }

    return NextResponse.json({ permissions: rows[0].permissions });
  } catch (error: any) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ message: 'Error fetching permissions', error: error.message }, { status: 500 });
  }
}

// POST handler to update or create permissions for a user
export async function POST(request: Request, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params;
    const { permissions } = await request.json();

    if (!permissions) {
      return NextResponse.json({ message: 'Permissions data is required' }, { status: 400 });
    }

    // Use INSERT ... ON CONFLICT to either insert a new row or update the existing one
    const { rows } = await db.query(
      `INSERT INTO user_permissions (user_id, permissions)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET permissions = EXCLUDED.permissions
       RETURNING user_id, permissions`,
      [userId, JSON.stringify(permissions)]
    );

    return NextResponse.json(rows[0], { status: 200 });
  } catch (error: any)
    {
    console.error('Error saving permissions:', error);
    return NextResponse.json({ message: 'Error saving permissions', error: error.message }, { status: 500 });
  }
}
