import { NextRequest, NextResponse } from 'next/server';
import { addUserBalance } from '@/lib/deposit-service';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('X-Admin-Token');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, amount, reason } = await request.json();

    if (!userId || !amount) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

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
      newBalance: result.newBalance,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
