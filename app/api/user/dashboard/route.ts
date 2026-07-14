import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  let client;
  try {
    const sessionToken = request.cookies.get('sessionToken')?.value;

    console.log('[v0] Dashboard request received');
    console.log('[v0] Session token exists:', !!sessionToken);

    if (!sessionToken) {
      console.log('[v0] No session token found');
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      );
    }

    client = await pool.connect();
    console.log('[v0] Database connected');

    // Get user from session
    const sessionResult = await client.query(
      `SELECT user_id FROM sessions WHERE session_token = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [sessionToken]
    );

    console.log('[v0] Session query result:', sessionResult.rows.length, 'rows');

    if (sessionResult.rows.length === 0) {
      console.log('[v0] Session not found or expired');
      client.release();
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    const userId = sessionResult.rows[0].user_id;
    console.log('[v0] User ID from session:', userId);

    // Get user data
    const userResult = await client.query(
      `SELECT id, email, phone, balance, deposit_address, verified, created_at FROM users WHERE id = $1`,
      [userId]
    );

    console.log('[v0] User query result:', userResult.rows.length, 'rows');

    if (userResult.rows.length === 0) {
      console.log('[v0] User not found');
      client.release();
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];
    console.log('[v0] User found:', user.email);

    // Get recent deposits
    let depositsResult;
    try {
      depositsResult = await client.query(
        `SELECT id, amount, status, tx_hash, created_at FROM deposits 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 10`,
        [userId]
      );
      console.log('[v0] Deposits query result:', depositsResult.rows.length, 'rows');
    } catch (depositError) {
      console.log('[v0] Deposits table might not exist yet, returning empty array');
      depositsResult = { rows: [] };
    }

    // Get user wallets
    let walletsResult;
    try {
      walletsResult = await client.query(
        `SELECT id, wallet_type, trc20_address, is_active, created_at FROM wallets 
         WHERE user_id = $1 AND is_active = TRUE
         ORDER BY created_at DESC`,
        [userId]
      );
      console.log('[v0] Wallets query result:', walletsResult.rows.length, 'rows');
    } catch (walletError) {
      console.log('[v0] Wallets table might not exist yet, returning empty array');
      walletsResult = { rows: [] };
    }

    client.release();

    const response = {
      user: {
        id: user.id,
        email: user.email,
        balance: parseFloat(user.balance) || 0,
        deposit_address: user.deposit_address,
        verified: user.verified,
        created_at: user.created_at,
      },
      deposits: depositsResult.rows,
      wallets: walletsResult.rows,
    };

    console.log('[v0] Dashboard response prepared successfully');
    return NextResponse.json(response);
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Dashboard error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Internal server error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
