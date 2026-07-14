import { NextRequest, NextResponse } from 'next/server';
import { getPendingWithdrawals } from '@/lib/withdraw-service';

export async function GET(request: NextRequest) {
  try {
    const adminKey = request.headers.get('X-Admin-Key');
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const withdrawals = await getPendingWithdrawals();

    return NextResponse.json({
      success: true,
      count: withdrawals.length,
      withdrawals,
    });
  } catch (error) {
    console.error('[v0] Error fetching pending withdrawals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
