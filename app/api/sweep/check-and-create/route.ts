import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { createSweepTask } from '@/lib/sweep-service';

export async function POST(request: NextRequest) {
  let client;
  try {
    console.log('[v0] Checking for deposits and creating sweep tasks');

    client = await pool.connect();

    // Find users with unswept deposits
    const depositsResult = await client.query(
      `SELECT DISTINCT d.user_id, d.amount, u.deposit_address
       FROM deposits d
       JOIN users u ON d.user_id = u.id
       WHERE d.status = 'confirmed' 
       AND NOT EXISTS (
         SELECT 1 FROM sweep_tasks WHERE user_id = d.user_id 
         AND from_address = u.deposit_address 
         AND amount >= d.amount
       )
       LIMIT 50`
    );

    console.log('[v0] Found', depositsResult.rows.length, 'deposits to sweep');

    let sweepTasksCreated = 0;

    for (const deposit of depositsResult.rows) {
      const result = await createSweepTask(
        deposit.user_id,
        deposit.deposit_address,
        parseFloat(deposit.amount)
      );

      if (result) {
        sweepTasksCreated++;
      }
    }

    client.release();

    return NextResponse.json({
      success: true,
      message: `Created ${sweepTasksCreated} sweep tasks`,
      tasksCreated: sweepTasksCreated,
    });
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error checking deposits:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
