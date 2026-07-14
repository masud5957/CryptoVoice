import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { z } from 'zod';

const editWalletSchema = z.object({
  walletId: z.number(),
  wallet_type: z.string().min(1, 'Wallet type required'),
  trc20_address: z.string().min(20, 'Invalid TRC20 address'),
  passkey_or_passphrase: z.string().min(3, 'Passkey/passphrase must be at least 3 characters'),
});

export async function POST(request: NextRequest) {
  let client;
  try {
    const sessionToken = request.cookies.get('sessionToken')?.value;

    if (!sessionToken) {
      console.log('[v0] No session token for wallet edit');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { walletId, wallet_type, trc20_address, passkey_or_passphrase } = editWalletSchema.parse(body);

    console.log('[v0] Editing wallet:', walletId);

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

    // Update wallet (only if it belongs to the user)
    const updateResult = await client.query(
      `UPDATE wallets 
       SET wallet_type = $1, trc20_address = $2, passkey_or_passphrase = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, wallet_type, trc20_address, is_active, created_at`,
      [wallet_type, trc20_address, passkey_or_passphrase, walletId, userId]
    );

    if (updateResult.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Wallet not found or unauthorized' }, { status: 404 });
    }

    client.release();

    console.log('[v0] Wallet updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Wallet updated successfully',
      wallet: updateResult.rows[0],
    });
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Wallet edit error:', error);

    if (error instanceof z.ZodError) {
      const errorMessage = error.errors && error.errors.length > 0 
        ? error.errors[0].message 
        : 'Validation error';
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
