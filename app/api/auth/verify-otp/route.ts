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
  try {
    const body = await request.json();
    const { email, otp } = verifySchema.parse(body);

    const client = await pool.connect();
    try {
      // Get user and verify OTP
      const userResult = await client.query(
        `SELECT id, otp_code, otp_expires_at FROM users WHERE email = $1`,
        [email]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const user = userResult.rows[0];

      // Verify OTP
      if (user.otp_code !== otp) {
        return NextResponse.json(
          { error: 'Invalid OTP' },
          { status: 400 }
        );
      }

      // Check OTP expiration
      if (new Date() > new Date(user.otp_expires_at)) {
        return NextResponse.json(
          { error: 'OTP expired' },
          { status: 400 }
        );
      }

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

      // Create session
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await client.query(
        `INSERT INTO sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3)`,
        [user.id, sessionToken, expiresAt]
      );

      // Generate QR code for deposit
      const qrCode = await generateQRCode(BEP20_ADDRESS);

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

      return response;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
