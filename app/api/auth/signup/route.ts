import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { generateOTP, sendOTPEmail } from '@/lib/otp';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Invalid phone number'),
  binancePin: z.string().min(4, 'Invalid Binance PIN'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, binancePin } = signupSchema.parse(body);

    const client = await pool.connect();
    try {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }

      // Generate OTP
      const otp = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Hash Binance PIN
      const hashedPin = await bcrypt.hash(binancePin, 10);

      // Create user
      const result = await client.query(
        `INSERT INTO users (email, phone, binance_pin, otp_code, otp_expires_at) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, email`,
        [email, phone, hashedPin, otp, otpExpiresAt]
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
          userId: result.rows[0].id,
        },
        { status: 201 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Signup error:', error);
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
