import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, otp, password } = await request.json();

    if (!email || !otp || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    let client;
    try {
      client = await pool.connect();

      // Verify OTP
      const result = await client.query(
        'SELECT otp, otp_expires_at FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        client.release();
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const user = result.rows[0];

      // Check if OTP is still valid
      if (!user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
        client.release();
        return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
      }

      // Verify OTP matches
      if (user.otp !== otp) {
        client.release();
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
      }

      // Update password and clear OTP
      await client.query(
        'UPDATE users SET password = $1, otp = NULL, otp_expires_at = NULL WHERE email = $2',
        [password, email]
      );

      client.release();

      return NextResponse.json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      if (client) client.release();
      throw error;
    }
  } catch (error) {
    console.error('[v0] Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
