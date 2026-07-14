import { NextRequest, NextResponse } from 'next/server';
import { getPendingSweepTasks, executeSweep } from '@/lib/sweep-service';

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Executing pending sweep tasks');

    // Get pending tasks
    const pendingTasks = await getPendingSweepTasks();
    console.log('[v0] Found', pendingTasks.length, 'pending sweep tasks');

    let successCount = 0;
    let failureCount = 0;

    // Execute each task
    for (const task of pendingTasks) {
      const result = await executeSweep(task.id);

      if (result.success) {
        successCount++;
        console.log('[v0] Sweep executed successfully - Task:', task.id, 'TxHash:', result.txHash);
      } else {
        failureCount++;
        console.error('[v0] Sweep execution failed - Task:', task.id, 'Error:', result.error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Executed ${successCount} sweeps successfully, ${failureCount} failed`,
      executed: successCount,
      failed: failureCount,
    });
  } catch (error) {
    console.error('[v0] Error executing sweeps:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
