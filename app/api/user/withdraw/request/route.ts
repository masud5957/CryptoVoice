import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { createWithdrawalRequest } from '@/lib/withdraw-service';
import { z } from 'zod';

const withdrawSchema = z.object({
  amount: z.number().positive(),
  withdrawalAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid BEP20 address'),
});

export async function POST(request: NextRequest) {
  let client;
  try {
    const sessionToken = request.cookies.get('sessionToken')?.value;
    if (!sessionToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { amount, withdrawalAddress } = withdrawSchema.parse(body);

    client = await pool.connect();
    const userResult = await client.query(
      'SELECT user_id FROM sessions WHERE session_token = $1 AND expires_at > NOW()',
      [sessionToken]
    );

    if (userResult.rows.length === 0) {
      client.release();
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const userId = userResult.rows[0].user_id;
    client.release();

    const result = await createWithdrawalRequest(userId, amount, withdrawalAddress);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

    return NextResponse.json({ success: true, requestId: result.requestId });
  } catch (error) {
    if (client) client.release();
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
