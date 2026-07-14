import { pool } from './db';
import { calculateGasFee, deductGasFee } from './gas-fee-service';
import { ethers } from 'ethers';

const HOT_WALLET_ADDRESS = process.env.HOT_WALLET_ADDRESS;
const HD_WALLET_MNEMONIC = process.env.HD_WALLET_MNEMONIC;
const BSC_RPC_URL = 'https://bsc-dataseed1.binance.org:443';

export async function createSweepTask(
  userId: number,
  fromAddress: string,
  amount: number
): Promise<{ taskId: number; gasFee: number } | null> {
  let client;
  try {
    // Calculate gas fee
    const gasFee = await calculateGasFee(amount);
    const netAmount = amount - gasFee;

    console.log('[v0] Creating sweep task - User:', userId, 'From:', fromAddress, 'Amount:', amount, 'Gas Fee:', gasFee);

    client = await pool.connect();

    // Create sweep task
    const result = await client.query(
      `INSERT INTO sweep_tasks (user_id, from_address, to_address, amount, gas_fee, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id`,
      [userId, fromAddress, HOT_WALLET_ADDRESS, netAmount, gasFee]
    );

    const taskId = result.rows[0].id;

    // Deduct gas fee from user balance
    await deductGasFee(userId, taskId, gasFee);

    client.release();

    console.log('[v0] Sweep task created - Task ID:', taskId, 'Net Amount:', netAmount);

    return { taskId, gasFee };
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error creating sweep task:', error);
    return null;
  }
}

export async function updateSweepStatus(
  taskId: number,
  status: string,
  txHash?: string,
  error?: string
): Promise<boolean> {
  let client;
  try {
    client = await pool.connect();

    await client.query(
      `UPDATE sweep_tasks 
       SET status = $1, tx_hash = $2, last_error = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, txHash || null, error || null, taskId]
    );

    console.log('[v0] Sweep task updated - Task ID:', taskId, 'Status:', status);

    client.release();
    return true;
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error updating sweep task:', error);
    return false;
  }
}

export async function getPendingSweepTasks(): Promise<any[]> {
  let client;
  try {
    client = await pool.connect();

    const result = await client.query(
      `SELECT st.id, st.user_id, st.from_address, st.to_address, st.amount, st.gas_fee, st.attempt_count
       FROM sweep_tasks st
       WHERE st.status = 'pending' AND st.attempt_count < 3
       ORDER BY st.created_at ASC
       LIMIT 10`
    );

    client.release();
    return result.rows;
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error fetching pending sweep tasks:', error);
    return [];
  }
}

export async function executeSweep(taskId: number): Promise<{ success: boolean; txHash?: string; error?: string }> {
  let client;
  try {
    client = await pool.connect();

    // Get sweep task details
    const taskResult = await client.query('SELECT * FROM sweep_tasks WHERE id = $1', [taskId]);

    if (taskResult.rows.length === 0) {
      return { success: false, error: 'Sweep task not found' };
    }

    const task = taskResult.rows[0];

    // Update status to processing
    await updateSweepStatus(taskId, 'processing');

    // Mock sweep execution (in production, use actual ethers.js to send transaction)
    console.log('[v0] Executing sweep - Task:', taskId, 'From:', task.from_address, 'To:', task.to_address, 'Amount:', task.amount);

    // Simulate successful sweep
    const mockTxHash = `0x${Math.random().toString(16).slice(2)}`;

    await updateSweepStatus(taskId, 'completed', mockTxHash);

    // Increment attempt count
    await client.query(
      'UPDATE sweep_tasks SET attempt_count = attempt_count + 1 WHERE id = $1',
      [taskId]
    );

    client.release();

    return { success: true, txHash: mockTxHash };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[v0] Error executing sweep:', errorMessage);

    await updateSweepStatus(taskId, 'failed', undefined, errorMessage);

    if (client) client.release();

    return { success: false, error: errorMessage };
  }
}

export async function getSweepHistory(userId: number, limit: number = 10): Promise<any[]> {
  let client;
  try {
    client = await pool.connect();

    const result = await client.query(
      `SELECT id, from_address, to_address, amount, gas_fee, status, tx_hash, created_at, updated_at
       FROM sweep_tasks
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    client.release();
    return result.rows;
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error fetching sweep history:', error);
    return [];
  }
}
