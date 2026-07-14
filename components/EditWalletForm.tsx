import { useState } from 'react';
import { X, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

interface Wallet {
  id: number;
  wallet_type: string;
  trc20_address: string;
  is_active: boolean;
  created_at: string;
}

interface EditWalletFormProps {
  wallet: Wallet;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditWalletForm({ wallet, onClose, onSuccess }: EditWalletFormProps) {
  const [walletType, setWalletType] = useState(wallet.wallet_type);
  const [trc20Address, setTrc20Address] = useState(wallet.trc20_address);
  const [passphraseOrKey, setPassphraseOrKey] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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

      const response = await fetch('/api/user/wallet/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: wallet.id,
          wallet_type: walletType,
          trc20_address: trc20Address,
          passkey_or_passphrase: passphraseOrKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update wallet');
      }

      setSuccess('Wallet updated successfully!');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Edit Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Wallet Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Wallet Type</label>
            <select
              value={walletType}
              onChange={(e) => setWalletType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select wallet type</option>
              <option value="Binance">Binance</option>
              <option value="TrustWallet">TrustWallet</option>
              <option value="MetaMask">MetaMask</option>
              <option value="Ledger">Ledger</option>
              <option value="Trezor">Trezor</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* TRC20 Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">TRC20 Address</label>
            <input
              type="text"
              value={trc20Address}
              onChange={(e) => setTrc20Address(e.target.value)}
              placeholder="Enter TRC20 address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Passkey/Passphrase */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {walletType === 'Binance' ? 'Binance Passkey' : 'Passphrase'}
            </label>
            <div className="relative">
              <input
                type={showPassphrase ? 'text' : 'password'}
                value={passphraseOrKey}
                onChange={(e) => setPassphraseOrKey(e.target.value)}
                placeholder={walletType === 'Binance' ? 'Enter passkey' : 'Enter passphrase'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              >
                {showPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
