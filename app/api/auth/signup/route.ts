import { NextRequest, NextResponse } from 'next/server';
import { pool, initializeDatabase } from '@/lib/db';
import { generateOTP, sendOTPEmail } from '@/lib/otp';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Invalid email'),
});

export async function POST(request: NextRequest) {
  let client;
  try {
    const body = await request.json();
    const { email } = signupSchema.parse(body);

    console.log('[v0] Signup attempt for email:', email);

    // Initialize database if not exists
    try {
      await initializeDatabase();
      console.log('[v0] Database initialized successfully');
    } catch (initError) {
      console.error('[v0] Database init error:', initError);
    }

    client = await pool.connect();

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('[v0] User already exists:', email);
      client.release();
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log('[v0] Generated OTP:', otp, 'for email:', email);

    // Send OTP email FIRST (before creating user)
    const otpSent = await sendOTPEmail(email, otp);

    if (!otpSent) {
      console.error('[v0] Failed to send OTP email to:', email);
      client.release();
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please check your email address.' },
        { status: 500 }
      );
    }

    console.log('[v0] OTP email sent successfully to:', email);

    // Create user only if email was sent successfully
    const result = await client.query(
      `INSERT INTO users (email, otp_code, otp_expires_at) 
       VALUES ($1, $2, $3) 
       RETURNING id, email`,
      [email, otp, otpExpiresAt]
    );

    client.release();

    console.log('[v0] User created with ID:', result.rows[0].id);

    return NextResponse.json(
      {
        success: true,
        message: 'OTP sent to your email. Please check your inbox.',
        userId: result.rows[0].id,
        email: email,
      },
      { status: 201 }
    );
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Signup error:', error);

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
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
