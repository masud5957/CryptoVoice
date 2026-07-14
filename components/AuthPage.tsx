'use client';

import { useState } from 'react';
import { Mail, ArrowRight, CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthPageProps {
  onAuthSuccess: (email: string) => void;
}

type AuthMode = 'landing' | 'signup' | 'login' | 'forgot-password';

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('landing');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      onAuthSuccess(email);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      onAuthSuccess(email);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email');
        return;
      }

      setSuccessMessage(data.message);
      setEmail('');
      setTimeout(() => setMode('login'), 3000);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-amber-900 to-gray-900 flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-full mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">CryptoVoice</h1>
            <p className="text-xl text-amber-100 mb-6">Earn daily profit with CryptoVoice</p>
            <p className="text-gray-300 mb-8">Work with Binance, TrustWallet, and any crypto wallet. Start your journey to consistent passive income through smart crypto trading strategies</p>

            {/* Features */}
            <div className="space-y-4 mb-12">
              <div className="flex items-center gap-3 text-gray-200">
                <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>Daily profit generation</span>
              </div>
              <div className="flex items-center gap-3 text-gray-200">
                <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>Multi-wallet support</span>
              </div>
              <div className="flex items-center gap-3 text-gray-200">
                <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>Automated BEP20 deposits</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3">
              <Button
              onClick={() => {
                setMode('signup');
                setError('');
                setEmail('');
              }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-6 text-lg font-semibold rounded-lg flex items-center justify-center gap-2"
              >
                Create Account
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => {
                  setMode('login');
                  setError('');
                  setEmail('');
                }}
                variant="outline"
                className="w-full border-amber-400 text-amber-400 hover:bg-amber-400/10 py-6 text-lg font-semibold rounded-lg"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => setMode('landing')}
              className="text-amber-600 hover:text-amber-700 font-medium text-sm mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">Join CryptoVoice and start earning daily</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 font-semibold rounded-lg"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            {/* Footer */}
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-amber-600 hover:text-amber-700 font-semibold"
              >
                Sign In
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

  if (mode === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => setMode('landing')}
              className="text-amber-600 hover:text-amber-700 font-medium text-sm mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your CryptoVoice account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 font-semibold rounded-lg"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Footer */}
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-amber-600 hover:text-amber-700 font-semibold"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => setMode('forgot-password')}
                className="text-gray-600 hover:text-gray-700"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (mode === 'forgot-password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => setMode('login')}
              className="text-amber-600 hover:text-amber-700 font-medium text-sm mb-4 flex items-center gap-1"
            >
              ← Back to Sign In
            </button>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
            <p className="text-gray-600">Enter your email to receive reset instructions</p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Success */}
            {successMessage && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 font-semibold rounded-lg"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            {/* Footer */}
            <p className="text-center text-sm text-gray-600">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-amber-600 hover:text-amber-700 font-semibold"
              >
                Sign In
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

  return null;
}
