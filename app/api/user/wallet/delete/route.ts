import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  let client;
  try {
    const sessionToken = request.cookies.get('sessionToken')?.value;

    if (!sessionToken) {
      console.log('[v0] No session token for wallet delete');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { walletId } = body;

    if (!walletId) {
      return NextResponse.json({ error: 'Wallet ID required' }, { status: 400 });
    }

    console.log('[v0] Deleting wallet:', walletId);

    client = await pool.connect();

    // Get session user
    const sessionResult = await client.query(
      `SELECT user_id FROM sessions WHERE session_token = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const userId = sessionResult.rows[0].user_id;

    // Delete wallet (only if it belongs to the user)
    const deleteResult = await client.query(
      `DELETE FROM wallets WHERE id = $1 AND user_id = $2 RETURNING id`,
      [walletId, userId]
    );

    if (deleteResult.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Wallet not found or unauthorized' }, { status: 404 });
    }

    client.release();

    console.log('[v0] Wallet deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Wallet deleted successfully',
    });
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Wallet delete error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
