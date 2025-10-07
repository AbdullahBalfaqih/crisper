'use server';

import { db } from '@/lib/db';

export async function fetchUsers() {
  try {
    const { rows } = await db.query(`SELECT id, full_name, username, email, role FROM users LIMIT 10`);
    return rows;
  } catch (e) {
    console.error('Failed to fetch users:', e);
    // Propagate the error to be caught by the client-side component
    throw new Error('Failed to fetch users from the database.');
  }
}
