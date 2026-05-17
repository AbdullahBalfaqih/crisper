// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: 'اسم المستخدم وكلمة المرور مطلوبان.' }, { status: 400 });
    }

    // Query the user from the database
    const { rows } = await db.query(
        `SELECT id, full_name, username, email, role, password_hash FROM users WHERE username = $1 OR email = $1`, 
        [username]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' }, { status: 401 });
    }

    const user = rows[0];

    // Direct password comparison (plaintext)
    const passwordMatch = user.password_hash === password;

    if (!passwordMatch) {
      return NextResponse.json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' }, { status: 401 });
    }
    
    // Do not send the password hash to the client
    const { password_hash, ...userWithoutPassword } = user;

    return NextResponse.json({ message: 'Login successful', user: userWithoutPassword });

  } catch (error) {
    console.error('[Login API] Error:', error);
    return NextResponse.json({ message: 'فشل الاتصال بقاعدة البيانات. يرجى التحقق من الإعدادات.' }, { status: 500 });
  }
}
