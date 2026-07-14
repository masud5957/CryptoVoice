import { NextRequest, NextResponse } from 'next/server';
import { manualScanForDeposits } from '@/lib/blockchain-monitor';

export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get('X-Admin-Key');
    const expectedKey = process.env.ADMIN_KEY || 'admin-key';

    if (adminKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[v0] Manual deposit scan triggered');
    await manualScanForDeposits();

    return NextResponse.json({
      success: true,
      message: 'Blockchain deposit scan initiated',
    });
  } catch (error) {
    console.error('[v0] Monitor error:', error);
    return NextResponse.json(
      { error: 'Failed to scan for deposits' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Blockchain deposit monitor endpoint',
    method: 'POST',
    description: 'Scans blockchain for USDT deposits to user addresses',
  });
}
