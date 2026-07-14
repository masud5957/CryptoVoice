'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Mail, Calendar, Copy, CheckCircle } from 'lucide-react';

interface UserProfile {
  id: number;
  email: string;
  balance: number;
  deposit_address: string;
  verified: boolean;
  created_at: string;
}

interface ProfilePageProps {
  onBack: () => void;
}

export function ProfilePage({ onBack }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/dashboard');
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
          {error || 'Failed to load profile'}
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {profile.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{profile.email}</h2>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  {profile.verified ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Verified Account
                    </>
                  ) : (
                    <span>Pending Verification</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-amber-600" />
                <label className="text-sm font-semibold text-gray-700">Email Address</label>
              </div>
              <p className="text-gray-900 font-mono text-sm break-all">{profile.email}</p>
            </div>

            {/* Account Created */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <label className="text-sm font-semibold text-gray-700">Account Created</label>
              </div>
              <p className="text-gray-900 text-sm">{formatDate(profile.created_at)}</p>
            </div>

            {/* Balance */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
              <label className="text-sm font-semibold text-gray-700 block mb-2">Current Balance</label>
              <p className="text-3xl font-bold text-amber-600">${profile.balance.toFixed(2)}</p>
              <p className="text-xs text-amber-600 mt-1">USDT</p>
            </div>

            {/* Account Status */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <label className="text-sm font-semibold text-gray-700 block mb-2">Account Status</label>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-gray-900 font-medium">Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Deposit Address Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">BEP20 Deposit Address</h3>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-mono text-gray-600 break-all flex-1">
                {profile.deposit_address}
              </p>
              <button
                onClick={() => copyToClipboard(profile.deposit_address)}
                className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex-shrink-0 text-sm"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <p className="text-sm text-blue-900">
            For security reasons, some profile information cannot be changed. If you need to update your account details, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
