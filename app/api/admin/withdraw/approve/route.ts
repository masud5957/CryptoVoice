import { NextRequest, NextResponse } from 'next/server';
import { approveWithdrawal } from '@/lib/withdraw-service';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('X-Admin-Token');
    
    // Basic token validation (in production, verify JWT properly)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { withdrawalId } = await request.json();

    const result = await approveWithdrawal(withdrawalId, 1);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
