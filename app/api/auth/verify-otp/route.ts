import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { generateQRCode, BEP20_ADDRESS } from '@/lib/crypto';
import crypto from 'crypto';
import { z } from 'zod';

const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function POST(request: NextRequest) {
  let client;
  try {
    const body = await request.json();
    const { email, otp } = verifySchema.parse(body);

    console.log('[v0] OTP verification attempt for email:', email);

    client = await pool.connect();

    // Get user and verify OTP
    const userResult = await client.query(
      `SELECT id, otp_code, otp_expires_at FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log('[v0] User not found for email:', email);
      client.release();
      return NextResponse.json(
        { error: 'User not found. Please sign up first.' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    console.log('[v0] User found, OTP code stored:', user.otp_code, 'OTP provided:', otp);

    // Verify OTP
    if (user.otp_code !== otp) {
      console.log('[v0] Invalid OTP provided');
      client.release();
      return NextResponse.json(
        { error: 'Invalid OTP. Please check and try again.' },
        { status: 400 }
      );
    }

    // Check OTP expiration
    const now = new Date();
    const expiresAt = new Date(user.otp_expires_at);

    if (now > expiresAt) {
      console.log('[v0] OTP expired');
      client.release();
      return NextResponse.json(
        { error: 'OTP expired. Please request a new one.' },
        { status: 400 }
      );
    }

    console.log('[v0] OTP verified successfully');

      // Generate deposit address (using HD wallet address)
      const depositAddress = BEP20_ADDRESS;

      // Update user
      const updateResult = await client.query(
        `UPDATE users 
         SET verified = TRUE, otp_code = NULL, otp_expires_at = NULL, deposit_address = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, email, balance`,
        [user.id, depositAddress]
      );

      console.log('[v0] User verified and updated');

      // Create session
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await client.query(
        `INSERT INTO sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3)`,
        [user.id, sessionToken, sessionExpiresAt]
      );

      console.log('[v0] Session created');

      // Generate QR code for deposit
      const qrCode = await generateQRCode(BEP20_ADDRESS);

      client.release();

      const response = NextResponse.json({
        success: true,
        sessionToken,
        user: updateResult.rows[0],
        depositQR: qrCode,
      });

      response.cookies.set('sessionToken', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
      });

      console.log('[v0] OTP verification completed successfully');
      return response;
  } catch (error) {
    if (client) client.release();
    console.error('[v0] OTP verification error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
