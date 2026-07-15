import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('X-Admin-Token');
    console.log('[v0] Admin users API: token received:', token ? 'yes' : 'no');
    
    if (!token) {
      console.log('[v0] Admin users API: no token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate token format (basic check - tokens should start with 'admin:')
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      console.log('[v0] Admin users API: decoded token start:', decoded.substring(0, 20));
      
      if (!decoded.startsWith('admin:')) {
        console.log('[v0] Admin users API: token format invalid');
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    } catch (err) {
      console.log('[v0] Admin users API: token decode error:', err);
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
    }

    let client;
    try {
      console.log('[v0] Admin users API: connecting to database');
      client = await pool.connect();
      console.log('[v0] Admin users API: executing query');
      
      const result = await client.query(
        `SELECT id, email, COALESCE(balance, 0) as balance, created_at 
         FROM users 
         ORDER BY created_at DESC`
      );

      client.release();
      console.log('[v0] Admin users API: query successful, rows:', result.rows.length);

      return NextResponse.json({
        success: true,
        users: result.rows || [],
        count: (result.rows || []).length,
      });
    } catch (error) {
      if (client) client.release();
      console.error('[v0] Admin users API: database error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[v0] Error fetching users:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      users: []
    }, { status: 500 });
  }
}
