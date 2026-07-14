import { NextRequest, NextResponse } from 'next/server';
import { addUserBalance } from '@/lib/deposit-service';
import { z } from 'zod';

const addBalanceSchema = z.object({
  userId: z.number().int().positive(),
  amount: z.number().positive(),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get('X-Admin-Key');
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, amount, reason } = addBalanceSchema.parse(body);

    const result = await addUserBalance(
      userId,
      amount,
      `Admin added balance: ${reason || 'Manual adjustment'}`
    );

    if (!result.balanceUpdated) {
      return NextResponse.json({ error: 'Failed to add balance' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      previousBalance: result.previousBalance,
      newBalance: result.newBalance,
    });
  } catch (error) {
    console.error('[v0] Admin balance error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
