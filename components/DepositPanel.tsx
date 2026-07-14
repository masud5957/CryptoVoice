'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, X, AlertCircle } from 'lucide-react';

interface DepositPanelProps {
  depositAddress: string;
  onClose: () => void;
}

export function DepositPanel({ depositAddress, onClose }: DepositPanelProps) {
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateQR();
  }, [depositAddress]);

  const generateQR = async () => {
    try {
      const response = await fetch('/api/deposit/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: depositAddress }),
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qr);
      }
    } catch (error) {
      console.error('Error generating QR:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Deposit USDT (BEP20)</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Send USDT on BEP20 network only. Other networks will result in loss of funds.
            </p>
          </div>

          {/* QR Code */}
          <div>
            <p className="text-sm font-medium mb-3 text-center">Scan QR Code</p>
            {loading ? (
              <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center">
                <p className="text-gray-500">Loading QR code...</p>
              </div>
            ) : qrCode ? (
              <div className="flex justify-center">
                <img src={qrCode} alt="Deposit QR" className="w-48 h-48" />
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-100 rounded flex items-center justify-center">
                <p className="text-gray-500">Failed to load QR code</p>
              </div>
            )}
          </div>

          {/* Address */}
          <div>
            <p className="text-sm font-medium mb-2">BEP20 Address</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 p-3 rounded font-mono text-sm break-all">
                {depositAddress}
              </div>
              <button
                onClick={copyAddress}
                className="p-2 hover:bg-gray-100 rounded transition"
              >
                <Copy className={`w-5 h-5 ${copied ? 'text-green-600' : 'text-gray-600'}`} />
              </button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 mt-1">Address copied!</p>
            )}
          </div>

          {/* Minimum Amount */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-900">
              <strong>Minimum deposit:</strong> 500 USDT
            </p>
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600 space-y-2 bg-gray-50 p-4 rounded">
            <p className="font-medium">Instructions:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Send USDT to the address above</li>
              <li>Ensure you&apos;re using BEP20 network</li>
              <li>Wait for confirmation (2-5 minutes)</li>
              <li>Balance will update automatically</li>
            </ol>
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
