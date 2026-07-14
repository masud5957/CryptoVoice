'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Activity } from 'lucide-react';

interface LiveTransaction {
  id: string;
  fromWallet: string;
  toWallet: string;
  amount: number;
  timestamp: Date;
}

export function TransactionLive() {
  const [transactions, setTransactions] = useState<LiveTransaction[]>([]);

  // Generate random wallet address (first 6 and last 4 characters visible)
  const generateRandomWallet = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const prefix = Array(6)
      .fill(0)
      .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
      .join('');
    const suffix = Array(4)
      .fill(0)
      .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
      .join('');
    return `${prefix}...${suffix}`;
  };

  // Generate random transaction amount between 100 and 50000 USDT
  const generateRandomAmount = () => {
    return Math.floor(Math.random() * (50000 - 100 + 1) + 100);
  };

  // Add new transaction every 2-3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const newTransaction: LiveTransaction = {
        id: Date.now().toString(),
        fromWallet: generateRandomWallet(),
        toWallet: generateRandomWallet(),
        amount: generateRandomAmount(),
        timestamp: new Date(),
      };

      setTransactions((prev) => [newTransaction, ...prev].slice(0, 15)); // Keep last 15 transactions
    }, 2500 + Math.random() * 1000); // 2.5 to 3.5 seconds

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
          <Activity className="w-5 h-5 text-green-600 animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Live Transactions</h3>
          <p className="text-sm text-gray-600">Real-time wallet transfers</p>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Waiting for transactions...</p>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:border-green-300 transition-all"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-mono text-sm font-medium text-gray-900 truncate">
                    {tx.fromWallet}
                  </span>
                  <ArrowRight className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="font-mono text-sm font-medium text-gray-900 truncate">
                    {tx.toWallet}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                <div className="text-right">
                  <p className="font-bold text-green-600">${tx.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{formatTime(tx.timestamp)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Total transactions shown: {transactions.length}
        </p>
      </div>
    </div>
  );
}
