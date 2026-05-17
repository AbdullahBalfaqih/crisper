// src/app/api/complaints/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { customer_name, subject, description, status, user_id } = await request.json();

    let query = 'UPDATE complaints SET ';
    const values = [];
    let setClauses = [];

    if (customer_name) {
      setClauses.push(`customer_name = $${values.length + 1}`);
      values.push(customer_name);
    }
    if (subject) {
      setClauses.push(`subject = $${values.length + 1}`);
      values.push(subject);
    }
    if (description) {
      setClauses.push(`description = $${values.length + 1}`);
      values.push(description);
    }
    if (status) {
      setClauses.push(`status = $${values.length + 1}`);
      values.push(status);
    }
     if (user_id) {
      setClauses.push(`user_id = $${values.length + 1}`);
      values.push(user_id);
    }
    
    if (setClauses.length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    query += setClauses.join(', ') + ` WHERE id = $${values.length + 1} RETURNING *`;
    values.push(id);
    
    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Complaint not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating complaint:', error);
    return NextResponse.json({ message: 'Error updating complaint' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { rowCount } = await db.query('DELETE FROM complaints WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Complaint not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    return NextResponse.json({ message: 'Error deleting complaint' }, { status: 500 });
  }
}
