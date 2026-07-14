import { pool } from './db';
import { addUserBalance } from './deposit-service';

export async function createWithdrawalRequest(
  userId: number,
  amount: number,
  walletId: number
): Promise<{ success: boolean; requestId?: number; error?: string }> {
  let client;
  try {
    client = await pool.connect();

    // Check user balance
    const userResult = await client.query(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const userBalance = parseFloat(userResult.rows[0].balance) || 0;

    if (userBalance < amount) {
      return {
        success: false,
        error: 'Insufficient balance',
      };
    }

    // Create withdrawal request
    const result = await client.query(
      `INSERT INTO withdrawals (user_id, amount, wallet_id, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [userId, amount, walletId]
    );

    const requestId = result.rows[0].id;
    console.log('[v0] Withdrawal request created - ID:', requestId, 'User:', userId, 'Amount:', amount);

    client.release();
    return { success: true, requestId };
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error creating withdrawal request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create request',
    };
  }
}

export async function approveWithdrawal(
  withdrawalId: number,
  adminId: number,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  let client;
  try {
    client = await pool.connect();

    // Get withdrawal request
    const withdrawResult = await client.query(
      'SELECT user_id, amount, status FROM withdrawals WHERE id = $1',
      [withdrawalId]
    );

    if (withdrawResult.rows.length === 0) {
      return { success: false, error: 'Withdrawal request not found' };
    }

    const { user_id, amount, status } = withdrawResult.rows[0];

    if (status !== 'pending') {
      return { success: false, error: 'Withdrawal already processed' };
    }

    // Deduct from user balance (withdrawal out)
    await client.query(
      'UPDATE users SET balance = balance - $1 WHERE id = $2',
      [amount, user_id]
    );

    // Record balance deduction in ledger
    await client.query(
      `INSERT INTO balance_ledger (user_id, transaction_type, amount, balance_before, balance_after, description, related_id, related_type)
       SELECT id, 'WITHDRAWAL', $1, balance + $1, balance, $2, $3, 'WITHDRAWAL'
       FROM users WHERE id = $4`,
      [amount, `Withdrawal approved by admin #${adminId}`, withdrawalId, user_id]
    );

    // Update withdrawal status
    await client.query(
      `UPDATE withdrawals SET status = 'approved', admin_id = $1, admin_notes = $2, confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [adminId, adminNotes || '', withdrawalId]
    );

    console.log('[v0] Withdrawal approved - ID:', withdrawalId, 'Amount:', amount);
    client.release();
    return { success: true };
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error approving withdrawal:', error);
    return { success: false, error: 'Failed to approve withdrawal' };
  }
}

export async function rejectWithdrawal(
  withdrawalId: number,
  adminId: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  let client;
  try {
    client = await pool.connect();

    await client.query(
      `UPDATE withdrawals SET status = 'rejected', admin_id = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [adminId, reason, withdrawalId]
    );

    console.log('[v0] Withdrawal rejected - ID:', withdrawalId);
    client.release();
    return { success: true };
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error rejecting withdrawal:', error);
    return { success: false, error: 'Failed to reject withdrawal' };
  }
}

export async function getPendingWithdrawals(): Promise<any[]> {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      `SELECT w.id, w.user_id, u.email, w.amount, w.wallet_id, wt.wallet_type, wt.trc20_address, w.created_at
       FROM withdrawals w
       JOIN users u ON w.user_id = u.id
       LEFT JOIN wallets wt ON w.wallet_id = wt.id
       WHERE w.status = 'pending'
       ORDER BY w.created_at ASC`
    );

    client.release();
    return result.rows;
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error fetching pending withdrawals:', error);
    return [];
  }
}

export async function getUserWithdrawals(userId: number): Promise<any[]> {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      `SELECT id, amount, status, wallet_id, created_at, confirmed_at
       FROM withdrawals
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    client.release();
    return result.rows;
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error fetching user withdrawals:', error);
    return [];
  }
}
