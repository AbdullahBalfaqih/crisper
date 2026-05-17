// src/app/api/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { full_name, username, email, role, phone_number } = await request.json();

    if (!full_name || !username || !role || !phone_number) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    const { rows } = await db.query(
      `UPDATE users 
       SET full_name = $1, username = $2, email = $3, role = $4, phone_number = $5, updated_at = NOW() 
       WHERE id = $6
       RETURNING id, full_name, username, email, phone_number, role`,
      [full_name, username, email, role, phone_number, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: any) {
    if (error.code === '23505') { // unique_violation
      return NextResponse.json({ message: 'Username, email or phone number already exists' }, { status: 409 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ message: 'Error updating user', error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    // Use a transaction to delete from users and user_permissions
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM user_permissions WHERE user_id = $1', [id]);
        const { rowCount } = await client.query('DELETE FROM users WHERE id = $1', [id]);
        await client.query('COMMIT');
        
        if (rowCount === 0) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'User deleted successfully' });
    } catch(e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }

  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ message: 'Error deleting user', error: error.message }, { status: 500 });
  }
}
