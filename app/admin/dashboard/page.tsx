'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Plus, CheckCircle, Users } from 'lucide-react';

interface User {
  id: number;
  email: string;
  balance: number;
}

interface Withdrawal {
  id: number;
  user_id: number;
  email: string;
  amount: number;
  withdrawal_address: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'withdrawals' | 'balance'>('withdrawals');
  const [users, setUsers] = useState<User[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (tab === 'withdrawals') {
      fetchPendingWithdrawals();
    }
  }, [tab]);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
  };

  const fetchPendingWithdrawals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/withdraw/pending', {
        headers: { 'X-Admin-Token': token || '' },
      });
      const data = await response.json();
      if (data.success) setWithdrawals(data.withdrawals);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/withdraw/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token || '',
        },
        body: JSON.stringify({ withdrawalId }),
      });

      if (response.ok) {
        setMessage('Withdrawal approved successfully');
        fetchPendingWithdrawals();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Error approving withdrawal');
    }
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/balance/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token || '',
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          amount: parseFloat(amount),
          reason,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Balance added! New balance: $${data.newBalance.toFixed(2)}`);
        setUserId('');
        setAmount('');
        setReason('');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Error adding balance');
      }
    } catch (error) {
      setMessage('Error adding balance');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-lg p-2">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
            {message}
          </div>
        )}

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setTab('withdrawals')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              tab === 'withdrawals'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Pending Withdrawals
          </button>
          <button
            onClick={() => setTab('balance')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              tab === 'balance'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Add Balance
          </button>
        </div>

        {tab === 'withdrawals' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Withdrawals</h2>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : withdrawals.length === 0 ? (
                <p className="text-gray-500">No pending withdrawals</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">User Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Withdrawal Address</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{w.email}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{w.amount} USDT</td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600 truncate">{w.withdrawal_address}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{new Date(w.created_at).toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => handleApproveWithdrawal(w.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'balance' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Balance to User
            </h2>
            <form onSubmit={handleAddBalance} className="space-y-4">
              <input
                type="number"
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount (USDT)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
              <textarea
                placeholder="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                rows={2}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
              >
                {loading ? 'Adding...' : 'Add Balance'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
