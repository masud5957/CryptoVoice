import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { processDepositConfirmation } from '@/lib/deposit-service';
import { z } from 'zod';

const confirmDepositSchema = z.object({
  userId: z.number().positive('Invalid user ID'),
  amount: z.number().positive('Amount must be positive'),
  txHash: z.string().min(10, 'Invalid transaction hash'),
});

export async function POST(request: NextRequest) {
  let client;
  try {
    const body = await request.json();
    const { userId, amount, txHash } = confirmDepositSchema.parse(body);

    console.log('[v0] Confirming deposit - User:', userId, 'Amount:', amount, 'TxHash:', txHash);

    // Process deposit and add to user balance
    const success = await processDepositConfirmation(userId, amount, txHash);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to confirm deposit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deposit confirmed and balance updated',
      userId,
      amount,
      txHash,
    });
  } catch (error) {
    console.error('[v0] Deposit confirmation error:', error);

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
