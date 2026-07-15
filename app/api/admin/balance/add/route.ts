import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('X-Admin-Token');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, amount, reason } = body;

    if (!user_id || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let client;
    try {
      client = await pool.connect();

      // Update user balance
      await client.query(
        `UPDATE users SET balance = balance + $1 WHERE id = $2`,
        [parseFloat(amount), parseInt(user_id)]
      );

      // Log the transaction if reason provided
      if (reason) {
        console.log(`[v0] Admin added $${amount} to user ${user_id}: ${reason}`);
      }

      client.release();

      return NextResponse.json({
        success: true,
        message: `Added $${amount} to user ${user_id}`,
      });
    } catch (error) {
      if (client) client.release();
      throw error;
    }
  } catch (error) {
    console.error('[v0] Error adding balance:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}
