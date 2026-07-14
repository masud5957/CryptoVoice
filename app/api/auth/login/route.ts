import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { generateOTP, sendOTPEmail } from '@/lib/otp';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = loginSchema.parse(body);

    const client = await pool.connect();
    try {
      // Check if user exists
      const userResult = await client.query(
        'SELECT id, email FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Generate OTP
      const otp = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Update user with OTP
      await client.query(
        'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE email = $3',
        [otp, otpExpiresAt, email]
      );

      // Send OTP email
      const otpSent = await sendOTPEmail(email, otp);

      if (!otpSent) {
        throw new Error('Failed to send OTP email');
      }

      return NextResponse.json(
        {
          success: true,
          message: 'OTP sent to your email',
          userId: userResult.rows[0].id,
        },
        { status: 200 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Login error:', error);
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
