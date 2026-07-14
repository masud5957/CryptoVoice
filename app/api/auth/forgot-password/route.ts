import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { generateOTP, sendOTPEmail } from '@/lib/otp';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const client = await pool.connect();
    try {
      // Check if user exists
      const userResult = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        // Don't reveal if email exists or not (security best practice)
        return NextResponse.json(
          {
            success: true,
            message: 'If an account exists, reset instructions have been sent',
          },
          { status: 200 }
        );
      }

      // Generate reset token (using OTP)
      const resetToken = generateOTP();
      const tokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

      // Store reset token
      await client.query(
        'UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE email = $3',
        [resetToken, tokenExpiresAt, email]
      );

      // Send reset email
      const emailSent = await sendOTPEmail(
        email,
        resetToken,
        'Password Reset'
      );

      if (!emailSent) {
        throw new Error('Failed to send reset email');
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Reset instructions sent to your email',
        },
        { status: 200 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Forgot password error:', error);
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
