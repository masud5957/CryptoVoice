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
  const [tab, setTab] = useState<'users' | 'withdrawals' | 'balance'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (tab === 'users') {
      fetchAllUsers();
    } else if (tab === 'withdrawals') {
      fetchPendingWithdrawals();
    }
  }, [tab]);

  useEffect(() => {
    const filtered = searchEmail.trim()
      ? users.filter(u => u.email.toLowerCase().includes(searchEmail.toLowerCase()))
      : users;
    setFilteredUsers(filtered);
  }, [searchEmail, users]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.log('[v0] No admin token found, redirecting to login');
        router.push('/admin/login');
        return;
      }
      console.log('[v0] Admin token found, allowing dashboard access');
      setAuthLoading(false);
    } catch (error) {
      console.error('[v0] Auth check error:', error);
      router.push('/admin/login');
    }
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setMessage('Admin token expired. Please login again.');
        router.push('/admin/login');
        return;
      }
      const response = await fetch('/api/admin/users/list', {
        headers: { 'X-Admin-Token': token },
      });
      
      if (response.status === 401) {
        setMessage('Authentication failed. Please login again.');
        router.push('/admin/login');
        return;
      }

      const data = await response.json();
      if (data.success && data.users) {
        setUsers(data.users);
        setFilteredUsers(data.users);
      } else {
        setMessage(data.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('[v0] Error fetching users:', error);
      setMessage('Error loading users. Please try again.');
    } finally {
      setLoading(false);
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

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

        {message && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {message}
          </div>
        )}

        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setTab('users')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              tab === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Users
          </button>
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

        {tab === 'users' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>

              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : filteredUsers.length === 0 ? (
                <p className="text-gray-500">No users found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">User ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Balance</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">${user.balance.toFixed(2)} USDT</td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => {
                                setUserId(user.id.toString());
                                setUserEmail(user.email);
                                setTab('balance');
                              }}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                            >
                              Add Balance
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="number"
                  placeholder="User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {userEmail && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <p className="text-blue-900">
                    <span className="font-medium">Selected User:</span> {userEmail}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USDT)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <textarea
                  placeholder="e.g., Bonus, Refund, Adjustment"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !userId || !amount}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
              >
                {loading ? 'Adding...' : 'Add Balance'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserId('');
                  setUserEmail('');
                  setAmount('');
                  setReason('');
                  setTab('users');
                }}
                className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Back to Users
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
