import { ethers } from 'ethers';
import { pool } from './db';
import { processDepositAndSweep } from './deposit-sweep-orchestrator';

// USDT Contract ABI (only Transfer event)
const USDT_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

const BSC_RPC_URL = process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org:8545';
const USDT_CONTRACT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS || '0x55d398326f99059fF775485246999027B3197955';
const SCAN_INTERVAL = 60000; // Scan every 60 seconds
const BLOCKS_TO_SCAN = 100; // Scan last 100 blocks

let lastScannedBlock = 0;

export async function initializeBlockchainMonitor(): Promise<void> {
  try {
    console.log('[v0] Initializing blockchain monitor...');
    
    // Get last scanned block from database
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT value FROM settings WHERE key = 'last_scanned_block'`
      );
      
      if (result.rows.length > 0) {
        lastScannedBlock = parseInt(result.rows[0].value);
      } else {
        // Initialize with current block
        const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
        lastScannedBlock = await provider.getBlockNumber() - 100;
        
        await client.query(
          `INSERT INTO settings (key, value) VALUES ('last_scanned_block', $1)
           ON CONFLICT (key) DO UPDATE SET value = $2`,
          [lastScannedBlock.toString(), lastScannedBlock.toString()]
        );
      }
      
      console.log('[v0] Blockchain monitor initialized at block:', lastScannedBlock);
    } finally {
      client.release();
    }

    // Start monitoring loop
    startMonitoringLoop();
  } catch (error) {
    console.error('[v0] Error initializing blockchain monitor:', error);
  }
}

function startMonitoringLoop(): void {
  setInterval(async () => {
    try {
      await scanForDeposits();
    } catch (error) {
      console.error('[v0] Error in monitoring loop:', error);
    }
  }, SCAN_INTERVAL);
}

async function scanForDeposits(): Promise<void> {
  try {
    const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
    const contract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, provider);
    
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(lastScannedBlock, currentBlock - BLOCKS_TO_SCAN);
    
    console.log('[v0] Scanning blocks', fromBlock, 'to', currentBlock);

    // Get all USDT transfers in the block range
    const transferEvents = await contract.queryFilter(
      contract.filters.Transfer(),
      fromBlock,
      currentBlock
    );

    console.log('[v0] Found', transferEvents.length, 'USDT transfers');

    // Get all user deposit addresses from database
    const userDeposits = await getUserDepositAddresses();

    for (const event of transferEvents) {
      const toAddress = event.args?.[1]?.toLowerCase();
      const fromAddress = event.args?.[0]?.toLowerCase();
      const amount = event.args?.[2];

      // Check if this is a transfer to one of our user deposit addresses
      const userDeposit = userDeposits.find(d => d.address.toLowerCase() === toAddress);

      if (userDeposit && amount) {
        const depositAmount = parseFloat(ethers.formatUnits(amount, 18));
        console.log('[v0] Deposit detected - User:', userDeposit.userId, 'Amount:', depositAmount, 'From:', fromAddress);

        // Trigger deposit processing
        await processDepositAndSweep(
          userDeposit.userId,
          depositAmount,
          event.transactionHash,
          fromAddress,
          userDeposit.address,
          process.env.HOT_WALLET_ADDRESS || ''
        );
      }
    }

    // Update last scanned block
    await updateLastScannedBlock(currentBlock);
  } catch (error) {
    console.error('[v0] Error scanning for deposits:', error);
  }
}

async function getUserDepositAddresses(): Promise<Array<{ userId: number; address: string }>> {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(
      'SELECT id, deposit_address FROM users WHERE deposit_address IS NOT NULL'
    );
    
    client.release();
    return result.rows.map(row => ({
      userId: row.id,
      address: row.deposit_address,
    }));
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error fetching user deposit addresses:', error);
    return [];
  }
}

async function updateLastScannedBlock(blockNumber: number): Promise<void> {
  let client;
  try {
    client = await pool.connect();
    await client.query(
      `INSERT INTO settings (key, value) VALUES ('last_scanned_block', $1)
       ON CONFLICT (key) DO UPDATE SET value = $2`,
      [blockNumber.toString(), blockNumber.toString()]
    );
    
    lastScannedBlock = blockNumber;
    client.release();
  } catch (error) {
    if (client) client.release();
    console.error('[v0] Error updating last scanned block:', error);
  }
}

export async function manualScanForDeposits(): Promise<void> {
  console.log('[v0] Manual scan triggered');
  await scanForDeposits();
}
