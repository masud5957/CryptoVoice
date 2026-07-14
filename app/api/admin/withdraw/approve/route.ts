import { NextRequest, NextResponse } from 'next/server';
import { approveWithdrawal } from '@/lib/withdraw-service';

export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get('X-Admin-Key');
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { withdrawalId, adminNotes } = await request.json();
    const result = await approveWithdrawal(withdrawalId, 1, adminNotes);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Withdrawal approved' });
  } catch (error) {
    console.error('[v0] Admin withdraw error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
