import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('sessionToken')?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: true });
    }

    let client;
    try {
      client = await pool.connect();

      // Delete the session from database
      await client.query(
        'DELETE FROM sessions WHERE session_token = $1',
        [sessionToken]
      );

      client.release();
    } catch (error) {
      if (client) client.release();
      throw error;
    }

    // Create response and clear the cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('sessionToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('[v0] Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
