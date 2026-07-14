'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { DepositPanel } from './DepositPanel';

interface User {
  id: number;
  email: string;
  phone: string;
  balance: number;
  deposit_address: string;
}

interface Deposit {
  id: number;
  amount: number;
  status: string;
  tx_hash?: string;
  created_at: string;
}

interface DashboardData {
  user: User;
  deposits: Deposit[];
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDepositPanel, setShowDepositPanel] = useState(false);
  const [runError, setRunError] = useState('');
  const [runLoading, setRunLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/user/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      setError('Failed to load dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    setRunError('');
    setRunLoading(true);

    try {
      const response = await fetch('/api/user/run', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.needsDeposit) {
          setShowDepositPanel(true);
          setRunError(
            `Insufficient balance. You need ${result.depositNeeded.toFixed(2)} USDT more.`
          );
        } else {
          setRunError(result.error);
        }
        return;
      }

      alert('Run started successfully!');
    } catch (err) {
      setRunError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setRunLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="text-center py-8 text-red-600">Failed to load dashboard</div>;
  }

  const { user, deposits } = data;
  const hasMinimumBalance = user.balance >= 500;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold">Binance Work</h1>
        <p className="text-amber-100 mt-1">Active Panel</p>
      </div>

      {/* Balance Card */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h2 className="text-gray-600 font-medium mb-2">Current Balance</h2>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-amber-600">${user.balance.toFixed(2)}</span>
          <span className="text-gray-500">USDT</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {hasMinimumBalance
            ? '✓ Minimum balance requirement met'
            : `⚠ Need $${(500 - user.balance).toFixed(2)} USDT more`}
        </p>
      </div>

      {/* Run Button */}
      <div className="space-y-3">
        <Button
          onClick={handleRun}
          disabled={runLoading}
          className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 text-white"
        >
          {runLoading ? 'Processing...' : 'Run'}
        </Button>

        {runError && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{runError}</p>
          </div>
        )}
      </div>

      {/* Deposit Panel */}
      {showDepositPanel && (
        <DepositPanel
          depositAddress={user.deposit_address}
          onClose={() => {
            setShowDepositPanel(false);
            fetchDashboard();
          }}
        />
      )}

      {/* Recent Deposits */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">Recent Deposits</h3>
        {deposits.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No deposits yet</p>
        ) : (
          <div className="space-y-3">
            {deposits.map((deposit) => (
              <div key={deposit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">${deposit.amount.toFixed(2)}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        deposit.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : deposit.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {deposit.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(deposit.created_at).toLocaleDateString()}
                  </p>
                </div>
                {deposit.status === 'confirmed' && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {deposit.status === 'pending' && (
                  <Clock className="w-5 h-5 text-yellow-600" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="bg-gray-50 rounded-lg p-6 text-sm text-gray-600 space-y-2">
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Phone:</strong> {user.phone}
        </p>
      </div>
    </div>
  );
}
