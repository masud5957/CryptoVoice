import { pool } from './db';

// Fixed gas fee of 0.00001 BNB per sweep
const FIXED_GAS_FEE = 0.00001;

export function calculateGasFee(amount: number): number {
  // Fixed gas fee regardless of transaction amount
  console.log('[v0] Gas fee calculation - Amount:', amount, 'Fee: 0.00001 BNB');
  
  // Return fixed amount with 8 decimal places precision
  return FIXED_GAS_FEE;
}

export async function recordGasFee(
  userId: number,
  sweepTaskId: number,
  gasFeeAmount: number
): Promise<boolean> {
  let client;
  try {
    client = await pool.connect();

    // Record gas fee (paid from hot wallet, not from user balance)
    await client.query(
      `INSERT INTO gas_fees (user_id, sweep_task_id, amount, deducted_from_balance)
       VALUES ($1, $2, $3, FALSE)`,
      [userId, sweepTaskId, gasFeeAmount]
    );

    console.log('[v0] Gas fee recorded - User:', userId, 'Amount:', gasFeeAmount, 'Paid from hot wallet');
    client.release();
    return true;
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error recording gas fee:', error);
    return false;
  }
}

export async function getGasFeeHistory(userId: number, limit: number = 10): Promise<any[]> {
  let client;
  try {
    client = await pool.connect();

    const result = await client.query(
      `SELECT id, amount, sweep_task_id, created_at 
       FROM gas_fees 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );

    client.release();
    return result.rows;
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error fetching gas fee history:', error);
    return [];
  }
}

export async function getTotalGasFeesForUser(userId: number): Promise<number> {
  let client;
  try {
    client = await pool.connect();

    const result = await client.query(
      'SELECT SUM(amount) as total FROM gas_fees WHERE user_id = $1',
      [userId]
    );

    client.release();
    return parseFloat(result.rows[0]?.total || 0);
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error calculating total gas fees:', error);
    return 0;
  }
}
