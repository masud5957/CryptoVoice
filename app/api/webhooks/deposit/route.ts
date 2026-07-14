import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { handleDepositWebhook } from '@/lib/deposit-sweep-orchestrator';
import { z } from 'zod';

const depositWebhookSchema = z.object({
  userId: z.number().int().positive(),
  depositAmount: z.number().positive(),
  txHash: z.string().min(32),
  fromAddress: z.string().min(20),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, depositAmount, txHash, fromAddress } = depositWebhookSchema.parse(body);

    console.log('[v0] Deposit webhook received - User:', userId, 'Amount:', depositAmount);

    // Verify user exists
    const client = await pool.connect();
    try {
      const userResult = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    } finally {
      client.release();
    }

    // Trigger the complete deposit-to-sweep flow
    const success = await handleDepositWebhook(userId, depositAmount, txHash, fromAddress);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to process deposit and sweep' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deposit processed and sweep initiated',
      userId,
      depositAmount,
    });
  } catch (error) {
    console.error('[v0] Webhook error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Deposit webhook endpoint',
    method: 'POST',
    description: 'Receives deposit notifications and triggers automated sweep',
  });
}
