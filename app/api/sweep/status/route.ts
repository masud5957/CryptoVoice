import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSweepHistory } from '@/lib/sweep-service';

export async function GET(request: NextRequest) {
  let client;
  try {
    const sessionToken = request.cookies.get('sessionToken')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[v0] Fetching sweep status for user');

    client = await pool.connect();

    // Get user from session
    const sessionResult = await client.query(
      `SELECT user_id FROM sessions WHERE session_token = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const userId = sessionResult.rows[0].user_id;

    client.release();

    // Get sweep history
    const sweepHistory = await getSweepHistory(userId, 20);

    // Get current pending/processing tasks
    const pendingTasks = sweepHistory.filter(
      (task) => task.status === 'pending' || task.status === 'processing'
    );

    return NextResponse.json({
      pendingCount: pendingTasks.length,
      history: sweepHistory,
    });
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error fetching sweep status:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
