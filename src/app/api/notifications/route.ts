
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET notifications for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const { rows } = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ message: 'Error fetching notifications' }, { status: 500 });
  }
}


// Create a new notification
export async function POST(request: Request) {
  try {
    const { user_id, message, link } = await request.json();
    if (!user_id || !message) {
      return NextResponse.json({ message: 'User ID and message are required' }, { status: 400 });
    }

    const { rows } = await db.query(
      'INSERT INTO notifications (user_id, message, link) VALUES ($1, $2, $3) RETURNING *',
      [user_id, message, link]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ message: 'Error creating notification' }, { status: 500 });
  }
}

// Mark notification as read
export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'Notification ID is required' }, { status: 400 });
        }

        const { rows } = await db.query(
            'UPDATE notifications SET status = $1 WHERE id = $2 RETURNING *',
            ['read', id]
        );
        
        if (rows.length === 0) {
            return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json(rows[0]);

    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json({ message: 'Error updating notification' }, { status: 500 });
    }
}


// Delete a notification or all notifications for a user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (id) {
      // Delete a single notification
      const { rowCount } = await db.query('DELETE FROM notifications WHERE id = $1', [id]);
      if (rowCount === 0) {
        return NextResponse.json({ message: 'Notification not found' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Notification deleted successfully' });
    } else if (userId) {
      // Delete all notifications for a user
      await db.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
      return NextResponse.json({ message: 'All notifications for the user have been deleted' });
    } else {
      return NextResponse.json({ message: 'Notification ID or User ID is required' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error deleting notification(s):', error);
    return NextResponse.json({ message: 'Error deleting notification(s)' }, { status: 500 });
  }
}
