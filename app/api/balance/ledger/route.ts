import { NextRequest, NextResponse } from 'next/server';
import { getBalanceLedger, getTotalDeposits } from '@/lib/deposit-service';

export async function GET(request: NextRequest) {
  let client;
  try {
    const sessionToken = request.cookies.get('sessionToken')?.value;

    if (!sessionToken) {
      console.log('[v0] No session token for balance ledger');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session (simplified - in production use proper session lookup)
    const { pool } = await import('@/lib/db');
    client = await pool.connect();

    const sessionResult = await client.query(
      `SELECT user_id FROM sessions WHERE session_token = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      console.log('[v0] Session not found or expired');
      client.release();
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const userId = sessionResult.rows[0].user_id;
    client.release();

    console.log('[v0] Fetching balance ledger for user:', userId);

    // Get balance ledger
    const ledger = await getBalanceLedger(userId, 50);
    const totalDeposits = await getTotalDeposits(userId);

    return NextResponse.json({
      success: true,
      ledger,
      totalDeposits,
      count: ledger.length,
    });
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Balance ledger error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
