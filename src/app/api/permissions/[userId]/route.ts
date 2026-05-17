// src/app/api/permissions/[userId]/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET handler to fetch permissions for a user
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const { rows } = await db.query(
      'SELECT permissions FROM user_permissions WHERE user_id = $1',
      [userId]
    );

    // إذا ما فيه بيانات، رجّع array فارغة بدل 404
    if (rows.length === 0) {
      return NextResponse.json({
        permissions: [],
      });
    }

    return NextResponse.json({
      permissions: rows[0].permissions || [],
    });

  } catch (error: any) {
    console.error('Error fetching permissions:', error);

    return NextResponse.json(
      {
        message: 'Error fetching permissions',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST handler to update or create permissions for a user
export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const body = await request.json();
    const { permissions } = body;

    // تحقق من وجود permissions
    if (permissions === undefined) {
      return NextResponse.json(
        {
          message: 'Permissions data is required',
        },
        { status: 400 }
      );
    }

    // INSERT أو UPDATE إذا المستخدم موجود
    const { rows } = await db.query(
      `
      INSERT INTO user_permissions (user_id, permissions)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET permissions = EXCLUDED.permissions
      RETURNING user_id, permissions
      `,
      [userId, JSON.stringify(permissions)]
    );

    return NextResponse.json(
      {
        user_id: rows[0].user_id,
        permissions: rows[0].permissions,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error saving permissions:', error);

    return NextResponse.json(
      {
        message: 'Error saving permissions',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
