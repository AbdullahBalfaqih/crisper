
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET a single address by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { rows } = await db.query('SELECT * FROM addresses WHERE id = $1', [id]);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching address:', error);
    return NextResponse.json({ message: 'Error fetching address' }, { status: 500 });
  }
}


// PUT update an address
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { addressName, addressDetails, latitude, longitude } = await request.json();

    if (!addressName || !addressDetails || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    const { rows } = await db.query(
      `UPDATE addresses 
       SET address_name = $1, address_details = $2, latitude = $3, longitude = $4 
       WHERE id = $5 RETURNING *`,
      [addressName, addressDetails, latitude, longitude, id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ message: 'Error updating address' }, { status: 500 });
  }
}

// DELETE an address
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { rowCount } = await db.query('DELETE FROM addresses WHERE id = $1', [id]);

    if (rowCount === 0) {
      return NextResponse.json({ message: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ message: 'Error deleting address' }, { status: 500 });
  }
}
