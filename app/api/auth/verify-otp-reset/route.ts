import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 });
    }

    let client;
    try {
      client = await pool.connect();

      // Check if OTP matches
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

      // Verify OTP
      if (user.otp !== otp) {
        client.release();
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
      }

      client.release();
      return NextResponse.json({ success: true, message: 'OTP verified' });
    } catch (error) {
      if (client) client.release();
      throw error;
    }
  } catch (error) {
    console.error('[v0] OTP verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
