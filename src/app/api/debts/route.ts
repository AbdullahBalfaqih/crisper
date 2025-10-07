// src/app/api/debts/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to translate debt type from Arabic to English
const translateDebtTypeToEnglish = (type: 'مدين' | 'دائن'): 'debtor' | 'creditor' => {
  return type === 'مدين' ? 'debtor' : 'creditor';
};

// Helper to translate debt type from English to Arabic
const translateDebtTypeToArabic = (type: 'debtor' | 'creditor'): 'مدين' | 'دائن' => {
  return type === 'debtor' ? 'مدين' : 'دائن';
};

const translateStatusToArabic = (status: 'paid' | 'unpaid'): 'مسدد' | 'غير مسدد' => {
    return status === 'paid' ? 'مسدد' : 'غير مسدد';
};


export async function GET() {
  try {
    const { rows } = await db.query('SELECT id, person_name, amount, currency, type, due_date, status FROM debts ORDER BY created_at DESC');
    const translatedRows = rows.map(row => ({
        ...row,
        type: translateDebtTypeToArabic(row.type),
        status: translateStatusToArabic(row.status)
    }));
    return NextResponse.json(translatedRows);
  } catch (error) {
    console.error('Error fetching debts:', error);
    return NextResponse.json({ message: 'Error fetching debts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { person_name, amount, currency, type, due_date } = await request.json();

    if (!person_name || !amount || !currency || !type || !due_date) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    const englishType = translateDebtTypeToEnglish(type);

    const { rows } = await db.query(
      'INSERT INTO debts (person_name, amount, currency, type, due_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [person_name, amount, currency, englishType, due_date]
    );

    const translatedRow = {
        ...rows[0],
        type: translateDebtTypeToArabic(rows[0].type),
        status: translateStatusToArabic(rows[0].status)
    };

    return NextResponse.json(translatedRow, { status: 201 });
  } catch (error) {
    console.error('Error creating debt:', error);
    return NextResponse.json({ message: 'Error creating debt' }, { status: 500 });
  }
}
