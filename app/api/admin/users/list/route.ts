import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('X-Admin-Token');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let client;
    try {
      client = await pool.connect();
      const result = await client.query(
        `SELECT id, email, balance, created_at 
         FROM users 
         ORDER BY created_at DESC`
      );

      client.release();

      return NextResponse.json({
        success: true,
        users: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      if (client) client.release();
      throw error;
    }
  } catch (error) {
    console.error('[v0] Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
