'use client';

import { useState } from 'react';
import { X, Eye, EyeOff, Plus } from 'lucide-react';

interface AddWalletFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddWalletForm({ onClose, onSuccess }: AddWalletFormProps) {
  const [walletType, setWalletType] = useState('binance');
  const [trc20Address, setTrc20Address] = useState('');
  const [passphraseOrKey, setPassphraseOrKey] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!walletType || !trc20Address || !passphraseOrKey) {
        throw new Error('All fields are required');
      }

      if (trc20Address.length < 20) {
        throw new Error('Invalid TRC20 address (minimum 20 characters)');
      }

      if (passphraseOrKey.length < 3) {
        throw new Error('Passkey/passphrase must be at least 3 characters');
      }

      const response = await fetch('/api/user/wallet/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_type: walletType,
          trc20_address: trc20Address,
          passkey_or_passphrase: passphraseOrKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add wallet');
      }

      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('[v0] Wallet add error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Crypto Wallet
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Wallet Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Wallet Type
            </label>
            <select
              value={walletType}
              onChange={(e) => setWalletType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="binance">Binance</option>
              <option value="trustwallet">TrustWallet</option>
              <option value="metamask">MetaMask</option>
              <option value="other">Other Wallet</option>
            </select>
          </div>

          {/* TRC20 Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              TRC20 Address
            </label>
            <input
              type="text"
              value={trc20Address}
              onChange={(e) => setTrc20Address(e.target.value)}
              placeholder="T9yD14Nj9j7xAB4dbGknRjpQzPEGA..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Enter your TRON (TRC20) wallet address</p>
          </div>

          {/* Passkey or Passphrase */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {walletType === 'binance' ? 'Binance Passkey' : 'Wallet Passphrase'}
            </label>
            <div className="relative">
              <input
                type={showPassphrase ? 'text' : 'password'}
                value={passphraseOrKey}
                onChange={(e) => setPassphraseOrKey(e.target.value)}
                placeholder={walletType === 'binance' ? 'Enter your Binance passkey' : 'Enter wallet passphrase or private key'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Keep this secure and never share it</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Wallet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
