'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Plus } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'users' | 'balance'>('users');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [addingBalance, setAddingBalance] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      console.log('[v0] No token, redirecting to login');
      router.push('/admin/login');
      return;
    }
    console.log('[v0] Token found, fetching users');
    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[v0] fetchUsers starting');
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        console.log('[v0] No token in fetchUsers');
        throw new Error('No admin token');
      }

      console.log('[v0] Making API call to /api/admin/users/list');
      const response = await fetch('/api/admin/users/list', {
        headers: { 'X-Admin-Token': token },
      });

      console.log('[v0] API response status:', response.status);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[v0] API response data:', { success: data.success, usersCount: data.users?.length });
      
      if (data.success && Array.isArray(data.users)) {
        console.log('[v0] Setting users:', data.users.length);
        setUsers(data.users);
      } else {
        throw new Error(data.error || 'Failed to load users');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[v0] Fetch users error:', errorMsg);
      setError(`Error: ${errorMsg}`);
      setUsers([]);
    } finally {
      setLoading(false);
      console.log('[v0] fetchUsers completed');
    }
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId || !amount) {
      setMessage('Please fill in all fields');
      return;
    }

    try {
      setAddingBalance(true);
      setMessage('');
      const token = localStorage.getItem('adminToken');

      const response = await fetch('/api/admin/balance/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token || '',
        },
        body: JSON.stringify({
          user_id: parseInt(selectedUserId),
          amount: parseFloat(amount),
          reason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Balance added successfully');
        setSelectedUserId('');
        setSelectedUserEmail('');
        setAmount('');
        setReason('');
        setTab('users');
        fetchUsers();
      } else {
        setMessage(data.error || 'Failed to add balance');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setAddingBalance(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/admin/login');
  };

  const filteredUsers = searchEmail
    ? users.filter(u => u.email.toLowerCase().includes(searchEmail.toLowerCase()))
    : users;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg border ${
            message.includes('success')
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-yellow-50 border-yellow-200 text-yellow-700'
          }`}>
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
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

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">All Users ({filteredUsers.length})</h2>
              <input
                type="text"
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>

            {loading ? (
              <p className="text-center text-gray-500 py-8">Loading users...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Balance</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{user.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">${(parseFloat(user.balance) || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => {
                              setSelectedUserId(user.id.toString());
                              setSelectedUserEmail(user.email);
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
        )}

        {/* Add Balance Tab */}
        {tab === 'balance' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Balance
            </h2>

            <form onSubmit={handleAddBalance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="number"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  placeholder="Enter user ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              {selectedUserEmail && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <p className="text-blue-900">
                    <span className="font-medium">User:</span> {selectedUserEmail}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USDT)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Bonus, refund, etc."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={addingBalance}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
              >
                {addingBalance ? 'Adding...' : 'Add Balance'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('users');
                  setSelectedUserId('');
                  setSelectedUserEmail('');
                  setAmount('');
                  setReason('');
                }}
                className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
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
