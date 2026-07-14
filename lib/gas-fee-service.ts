import { pool } from './db';

// Gas fee rates based on transaction amount
const GAS_FEE_RATES = {
  LOW: 0.01,      // 1% for amounts < $100
  MEDIUM: 0.02,   // 2% for amounts $100-$1000
  HIGH: 0.03,     // 3% for amounts $1000-$5000
  PREMIUM: 0.05,  // 5% for amounts > $5000
};

function getGasFeeRate(amount: number): number {
  if (amount < 100) return GAS_FEE_RATES.LOW;
  if (amount < 1000) return GAS_FEE_RATES.MEDIUM;
  if (amount < 5000) return GAS_FEE_RATES.HIGH;
  return GAS_FEE_RATES.PREMIUM;
}

export async function calculateGasFee(amount: number): Promise<number> {
  const rate = getGasFeeRate(amount);
  const gasFee = amount * rate;
  
  console.log('[v0] Gas fee calculation - Amount:', amount, 'Rate:', rate, 'Fee:', gasFee);
  
  // Round to 8 decimal places for USDT precision
  return Math.round(gasFee * 100000000) / 100000000;
}

export async function deductGasFee(
  userId: number,
  sweepTaskId: number,
  gasFeeAmount: number
): Promise<boolean> {
  let client;
  try {
    client = await pool.connect();

    // Update user balance
    await client.query(
      'UPDATE users SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [gasFeeAmount, userId]
    );

    // Record gas fee deduction
    await client.query(
      `INSERT INTO gas_fees (user_id, sweep_task_id, amount, deducted_from_balance)
       VALUES ($1, $2, $3, TRUE)`,
      [userId, sweepTaskId, gasFeeAmount]
    );

    console.log('[v0] Gas fee deducted - User:', userId, 'Amount:', gasFeeAmount);
    client.release();
    return true;
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error deducting gas fee:', error);
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
