'use client';

import { useEffect, useState, useRef } from 'react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, AlertCircle, CheckCircle, Clock, User, Settings, LogOut, ChevronDown, Plus, Wallet, X, Landmark, Edit2, Trash2 } from 'lucide-react';
import { DepositPanel } from './DepositPanel';
import { ProfilePage } from './ProfilePage';
import { SettingsPage } from './SettingsPage';
import { AddWalletForm } from './AddWalletForm';
import { EditWalletForm } from './EditWalletForm';

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

interface Wallet {
  id: number;
  wallet_type: string;
  trc20_address: string;
  is_active: boolean;
  created_at: string;
}

interface DashboardData {
  user: User;
  deposits: Deposit[];
  wallets: Wallet[];
}

interface DashboardProps {
  onLogout?: () => void;
}

type DashboardView = 'main' | 'profile' | 'settings';

export function Dashboard({ onLogout }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDepositPanel, setShowDepositPanel] = useState(false);
  const [runError, setRunError] = useState('');
  const [runLoading, setRunLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>('main');
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const depositSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      console.log('[v0] Fetching dashboard data...');
      const response = await fetch('/api/user/dashboard');
      
      console.log('[v0] Dashboard response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('[v0] Dashboard error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch dashboard');
      }

      const dashboardData = await response.json();
      console.log('[v0] Dashboard data received:', dashboardData);
      setData(dashboardData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard';
      console.error('[v0] Dashboard fetch error:', errorMessage);
      setError(errorMessage);
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

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-900 font-semibold">Error Loading Dashboard</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={() => fetchDashboard()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-yellow-900 font-semibold">Dashboard Not Available</h3>
            <p className="text-yellow-700 text-sm mt-1">Please try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  const { user, deposits } = data;
  const hasMinimumBalance = user.balance >= 500;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">CV</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">CryptoVoice</h1>
            </div>

            {/* Right side - Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user.email.split('@')[0]}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Logged in as</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setCurrentView('profile');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  
                  <button 
                    onClick={() => {
                      setCurrentView('settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>

                  <div className="border-t border-gray-100 mt-1">
                    <button 
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onLogout) {
                          onLogout();
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {currentView === 'profile' && (
        <ProfilePage onBack={() => setCurrentView('main')} />
      )}

      {currentView === 'settings' && (
        <SettingsPage onBack={() => setCurrentView('main')} email={data?.user.email} />
      )}

      {currentView === 'main' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-gray-600 font-medium mb-2">Current Balance</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-amber-600">${user.balance.toFixed(2)}</span>
              <span className="text-gray-500">USDT</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {hasMinimumBalance
                ? '✓ Minimum balance requirement met'
                : `⚠ Need $${(500 - user.balance).toFixed(2)} USDT more`}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            depositSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="w-full py-3 px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium mt-4"
        >
          Deposit USDT
        </button>
      </div>

      {/* System Wallet Deposit Section */}
      <div ref={depositSectionRef} className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Landmark className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800">CryptoVoice Deposit Address</h3>
        </div>
        
        <div className="bg-white border border-gray-300 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Your BEP20 Deposit Address</p>
          <p className="text-sm font-mono text-gray-800 break-all mb-3">{user.deposit_address}</p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(user.deposit_address);
              alert('Address copied to clipboard');
            }}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            <Copy className="w-4 h-4" />
            Copy Address
          </button>
        </div>

        {/* QR Code Section */}
        <div className="bg-white border border-gray-300 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-600 mb-3">Scan to deposit</p>
          <div className="inline-block">
            {/* QR code will be generated here */}
            <div className="w-40 h-40 bg-gray-100 flex items-center justify-center rounded">
              <p className="text-xs text-gray-500">QR Code Loading...</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Minimum deposit: 500 USDT</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Send only BEP20 (BSC) tokens to this address. Other networks or currencies will not be credited.
          </p>
        </div>
      </div>

      {/* Connected Wallets Card */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Connected Wallets</h3>
        
        {data?.wallets && data.wallets.length > 0 ? (
          <div className="space-y-3 mb-4">
            {data.wallets.map((wallet) => (
              <div key={wallet.id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Landmark className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800">{wallet.wallet_type}</p>
                    <p className="text-sm text-gray-600 truncate">{wallet.trc20_address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => setEditingWallet(wallet)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit wallet"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this wallet?')) {
                        try {
                          const response = await fetch('/api/user/wallet/delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ walletId: wallet.id }),
                          });

                          if (response.ok) {
                            fetchDashboard();
                          } else {
                            alert('Failed to delete wallet');
                          }
                        } catch (err) {
                          alert('Error deleting wallet');
                        }
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete wallet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">No wallets connected yet</p>
        )}

        <button
          onClick={() => setShowAddWallet(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Crypto Wallet
        </button>
        <p className="text-sm text-gray-600 mt-3">Connect your Binance, TrustWallet, or other crypto wallets</p>
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

      {/* Add Wallet Modal */}
      {showAddWallet && (
        <AddWalletForm
          onClose={() => setShowAddWallet(false)}
          onSuccess={() => {
            setShowAddWallet(false);
            fetchDashboard();
          }}
        />
      )}

      {/* Edit Wallet Modal */}
      {editingWallet && (
        <EditWalletForm
          wallet={editingWallet}
          onClose={() => setEditingWallet(null)}
          onSuccess={() => {
            setEditingWallet(null);
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
      </div>
      )}
    </div>
  );
}
