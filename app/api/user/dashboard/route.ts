import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('sessionToken')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const client = await pool.connect();
    try {
      // Get user from session
      const sessionResult = await client.query(
        `SELECT user_id FROM sessions WHERE session_token = $1 AND expires_at > CURRENT_TIMESTAMP`,
        [sessionToken]
      );

      if (sessionResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Session expired' },
          { status: 401 }
        );
      }

      const userId = sessionResult.rows[0].user_id;

      // Get user data
      const userResult = await client.query(
        `SELECT id, email, phone, balance, deposit_address, verified, created_at FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const user = userResult.rows[0];

      // Get recent deposits
      const depositsResult = await client.query(
        `SELECT id, amount, status, tx_hash, created_at, confirmed_at FROM deposits 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [userId]
      );

      return NextResponse.json({
        user,
        deposits: depositsResult.rows,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
