import { pool } from './db';

interface DepositResult {
  success: boolean;
  balanceUpdated: boolean;
  previousBalance: number;
  newBalance: number;
}

export async function addUserBalance(
  userId: number,
  depositAmount: number,
  description: string,
  relatedId?: number,
  relatedType?: string
): Promise<DepositResult> {
  let client;
  try {
    client = await pool.connect();

    // Get current balance
    const userResult = await client.query(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const previousBalance = parseFloat(userResult.rows[0].balance) || 0;
    const newBalance = previousBalance + depositAmount;

    // Update user balance
    await client.query(
      'UPDATE users SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newBalance, userId]
    );

    // Record in balance ledger
    await client.query(
      `INSERT INTO balance_ledger 
       (user_id, transaction_type, amount, balance_before, balance_after, description, related_id, related_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, 'DEPOSIT', depositAmount, previousBalance, newBalance, description, relatedId || null, relatedType || null]
    );

    console.log('[v0] Balance updated - User:', userId, 'Previous:', previousBalance, 'New:', newBalance, 'Amount:', depositAmount);

    client.release();
    return {
      success: true,
      balanceUpdated: true,
      previousBalance,
      newBalance,
    };
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error adding user balance:', error);
    return {
      success: false,
      balanceUpdated: false,
      previousBalance: 0,
      newBalance: 0,
    };
  }
}

export async function getBalanceLedger(userId: number, limit: number = 20): Promise<any[]> {
  let client;
  try {
    client = await pool.connect();

    const result = await client.query(
      `SELECT id, transaction_type, amount, balance_before, balance_after, description, created_at
       FROM balance_ledger
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    client.release();
    return result.rows;
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error fetching balance ledger:', error);
    return [];
  }
}

export async function getTotalDeposits(userId: number): Promise<number> {
  let client;
  try {
    client = await pool.connect();

    const result = await client.query(
      `SELECT SUM(amount) as total
       FROM balance_ledger
       WHERE user_id = $1 AND transaction_type = 'DEPOSIT'`,
      [userId]
    );

    client.release();
    return parseFloat(result.rows[0]?.total || 0);
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error calculating total deposits:', error);
    return 0;
  }
}

export async function processDepositConfirmation(
  userId: number,
  depositAmount: number,
  txHash: string
): Promise<boolean> {
  let client;
  try {
    client = await pool.connect();

    // Update deposit status to confirmed
    await client.query(
      `UPDATE deposits 
       SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND tx_hash = $2`,
      [userId, txHash]
    );

    // Add amount to user balance
    const result = await addUserBalance(
      userId,
      depositAmount,
      `Deposit from system wallet (TX: ${txHash})`,
      undefined,
      'DEPOSIT'
    );

    client.release();
    return result.balanceUpdated;
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error processing deposit confirmation:', error);
    return false;
  }
}
