import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { z } from 'zod';

const addWalletSchema = z.object({
  wallet_type: z.string().min(1, 'Wallet type required'),
  trc20_address: z.string().min(20, 'Invalid TRC20 address'),
  passkey_or_passphrase: z.string().min(3, 'Passkey/passphrase must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
});

async function initializeWalletsTable(client: any) {
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        wallet_type VARCHAR(50) NOT NULL,
        trc20_address VARCHAR(255) NOT NULL,
        passkey_or_passphrase VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[v0] Wallets table initialized');
  } catch (err) {
    console.log('[v0] Wallets table already exists or init skipped');
  }
}

export async function POST(request: NextRequest) {
  let client;
  try {
    const sessionToken = request.cookies.get('sessionToken')?.value;

    if (!sessionToken) {
      console.log('[v0] No session token for wallet add');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { wallet_type, trc20_address, passkey_or_passphrase, email, phone } = addWalletSchema.parse(body);

    console.log('[v0] Adding wallet for user');

    client = await pool.connect();
    
    // Initialize wallets table if needed
    await initializeWalletsTable(client);

    // Get user from session
    const sessionResult = await client.query(
      `SELECT user_id FROM sessions WHERE session_token = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [sessionToken]
    );

    if (sessionResult.rows.length === 0) {
      console.log('[v0] Session expired for wallet add');
      client.release();
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const userId = sessionResult.rows[0].user_id;

    // Update user with email and phone if provided
    if (email || phone) {
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (email) {
        updateFields.push(`email = $${paramCount++}`);
        updateValues.push(email);
      }

      if (phone) {
        updateFields.push(`phone = $${paramCount++}`);
        updateValues.push(phone);
      }

      if (updateFields.length > 0) {
        updateValues.push(userId);
        await client.query(
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
          updateValues
        );
      }
    }

    // Check if wallet already exists with this address
    const existingWallet = await client.query(
      `SELECT id FROM wallets WHERE user_id = $1 AND trc20_address = $2`,
      [userId, trc20_address]
    );

    if (existingWallet.rows.length > 0) {
      console.log('[v0] Wallet address already exists');
      client.release();
      return NextResponse.json(
        { error: 'This wallet address is already added' },
        { status: 400 }
      );
    }

    // Add new wallet
    const result = await client.query(
      `INSERT INTO wallets (user_id, wallet_type, trc20_address, passkey_or_passphrase)
       VALUES ($1, $2, $3, $4)
       RETURNING id, wallet_type, trc20_address`,
      [userId, wallet_type, trc20_address, passkey_or_passphrase]
    );

    client.release();

    console.log('[v0] Wallet added successfully');

    return NextResponse.json(
      {
        success: true,
        message: 'Wallet added successfully',
        wallet: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Wallet add error:', error);

    if (error instanceof z.ZodError) {
      const errorMessage = error.errors && error.errors.length > 0 
        ? error.errors[0].message 
        : 'Validation error';
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Check if it's a database error
      if (error.message.includes('relation')) {
        return NextResponse.json(
          { error: 'Database initialization in progress, please try again' },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
