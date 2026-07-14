import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

const MINIMUM_BALANCE = 500; // USDT

export async function POST(request: NextRequest) {
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

      // Get user balance
      const userResult = await client.query(
        `SELECT balance FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const balance = parseFloat(userResult.rows[0].balance);

      // Check minimum balance requirement
      if (balance < MINIMUM_BALANCE) {
        return NextResponse.json(
          {
            error: 'Insufficient balance',
            currentBalance: balance,
            requiredBalance: MINIMUM_BALANCE,
            depositNeeded: MINIMUM_BALANCE - balance,
            needsDeposit: true,
          },
          { status: 402 }
        );
      }

      // If sufficient balance, proceed with run
      return NextResponse.json({
        success: true,
        message: 'Run started successfully',
        balance,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Run error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
