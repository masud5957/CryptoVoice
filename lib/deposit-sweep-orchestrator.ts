import { pool } from './db';
import { createSweepTask, executeSweep } from './sweep-service';
import { addUserBalance } from './deposit-service';
import { recordGasFee, calculateGasFee } from './gas-fee-service';

/**
 * Complete automated flow:
 * 1. Detect deposit on user's system wallet
 * 2. Confirm deposit and add to user balance (using balance ledger)
 * 3. Create sweep task to move from system wallet to hot wallet
 * 4. Record gas fee (paid from hot wallet)
 * 5. Execute sweep automatically
 */

export async function processDepositAndSweep(
  userId: number,
  depositAmount: number,
  txHash: string,
  fromAddress: string,
  systemWalletAddress: string,
  hotWalletAddress: string
): Promise<{
  success: boolean;
  balanceAdded: boolean;
  sweepCreated: boolean;
  sweepExecuted: boolean;
  gasFeeRecorded: boolean;
  message: string;
}> {
  console.log('[v0] Processing deposit and sweep flow for user:', userId);

  try {
    // Step 1: Confirm deposit and add to user balance
    const balanceResult = await addUserBalance(
      userId,
      depositAmount,
      `Deposit confirmed (TX: ${txHash})`,
      undefined,
      'DEPOSIT'
    );

    if (!balanceResult.balanceUpdated) {
      console.error('[v0] Failed to add balance for user:', userId);
      return {
        success: false,
        balanceAdded: false,
        sweepCreated: false,
        sweepExecuted: false,
        gasFeeRecorded: false,
        message: 'Failed to credit deposit to balance',
      };
    }

    console.log('[v0] Balance credited - User:', userId, 'Amount:', depositAmount, 'New Balance:', balanceResult.newBalance);

    // Step 2: Create sweep task
    const sweepTaskResult = await createSweepTask(
      userId,
      systemWalletAddress,
      depositAmount
    );

    if (!sweepTaskResult) {
      console.error('[v0] Failed to create sweep task for user:', userId);
      return {
        success: false,
        balanceAdded: true,
        sweepCreated: false,
        sweepExecuted: false,
        gasFeeRecorded: false,
        message: 'Balance credited but failed to create sweep task',
      };
    }

    const sweepTaskId = sweepTaskResult.taskId;
    console.log('[v0] Sweep task created - ID:', sweepTaskId, 'Amount:', depositAmount);

    // Step 3: Calculate and record gas fee (paid from hot wallet)
    const gasFee = calculateGasFee(depositAmount);
    const gasFeeRecorded = await recordGasFee(userId, sweepTaskId, gasFee);

    if (!gasFeeRecorded) {
      console.error('[v0] Failed to record gas fee for user:', userId);
    } else {
      console.log('[v0] Gas fee recorded - Amount:', gasFee, 'User:', userId);
    }

    // Step 4: Execute sweep automatically
    const sweepResult = await executeSweep(sweepTaskId);

    if (!sweepResult.success) {
      console.error('[v0] Failed to execute sweep task:', sweepTaskId, 'Error:', sweepResult.error);
    } else {
      console.log('[v0] Sweep executed successfully - Task:', sweepTaskId, 'TX:', sweepResult.txHash);
    }

    return {
      success: true,
      balanceAdded: true,
      sweepCreated: true,
      sweepExecuted: sweepResult.success,
      gasFeeRecorded: gasFeeRecorded,
      message: 'Deposit processed and sweep initiated',
    };
  } catch (error) {
    console.error('[v0] Error in deposit-sweep orchestration:', error);
    return {
      success: false,
      balanceAdded: false,
      sweepCreated: false,
      sweepExecuted: false,
      gasFeeRecorded: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Call this from a cron job or webhook when deposit is detected
 * Example: From blockchain webhook listener or scheduled task
 */
export async function handleDepositWebhook(
  userId: number,
  depositAmount: number,
  txHash: string,
  fromAddress: string
): Promise<boolean> {
  const systemWalletAddress = process.env.HD_WALLET_ADDRESS || '';
  const hotWalletAddress = process.env.HOT_WALLET_ADDRESS || '';

  if (!systemWalletAddress || !hotWalletAddress) {
    console.error('[v0] Missing wallet addresses in environment');
    return false;
  }

  const result = await processDepositAndSweep(
    userId,
    depositAmount,
    txHash,
    fromAddress,
    systemWalletAddress,
    hotWalletAddress
  );

  return result.success;
}
