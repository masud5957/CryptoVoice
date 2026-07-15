'use client';

import { useState } from 'react';
import { CheckCircle, ArrowRight, Mail } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface AuthPageProps {
  onAuthSuccess: (email: string) => void;
}

type AuthMode = 'landing' | 'signup' | 'login' | 'forgot-password' | 'reset-password';

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('landing');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('[v0] Signup: sending request with email:', email);
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();
      console.log('[v0] Signup response:', { status: response.status, data });

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        return;
      }

      console.log('[v0] Signup success, calling onAuthSuccess');
      onAuthSuccess(email);
    } catch (err) {
      console.error('[v0] Signup error:', err);
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
      console.log('[v0] Login: sending request with email:', email);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log('[v0] Login response:', { status: response.status, data });

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      console.log('[v0] Login success, calling onAuthSuccess');
      onAuthSuccess(email);
    } catch (err) {
      console.error('[v0] Login error:', err);
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
        setError(data.error || 'Failed to send reset code');
        return;
      }

      setSuccessMessage('OTP sent to your email');
      setTimeout(() => {
        setMode('reset-password');
        setError('');
        setOtp('');
        setPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // First verify the OTP
      const verifyResponse = await fetch('/api/auth/verify-otp-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        setError(data.error || 'Invalid OTP');
        return;
      }

      // Then update the password
      const resetResponse = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      });

      const data = await resetResponse.json();

      if (!resetResponse.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }

      setSuccessMessage('Password reset successfully! Redirecting...');
      setTimeout(() => {
        setMode('login');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setOtp('');
        setSuccessMessage('');
      }, 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Landing Page
  if (mode === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          {/* Hero Section */}
          <div className="text-center mb-12">
            {/* USDT Logo */}
            <div className="mb-6 flex justify-center">
              <Image 
                src="/usdt-logo.png" 
                alt="USDT Logo" 
                width={64} 
                height={64}
                className="rounded-full shadow-lg"
              />
            </div>
            
            <h1 className="text-5xl font-black text-gray-900 mb-3 tracking-tight">CryptoVoice</h1>
            <p className="text-xl text-blue-600 mb-2 font-semibold">Automated Crypto Trading Platform</p>
            <p className="text-sm text-gray-600 mb-6 font-medium">Connect Binance, Trust Wallet & More</p>
            <p className="text-gray-700 mb-2 text-lg leading-relaxed font-medium">
              Earn consistent profits with automated trading strategies. Multi-wallet support for Binance and Trust Wallet, real-time monitoring, and transparent operations.
            </p>
            <p className="text-blue-600 mb-8 text-lg font-bold">Earn Commission Upto 3.5% Daily</p>

            {/* Features */}
            <div className="space-y-3 mb-12">
              <div className="flex items-center gap-3 text-gray-700">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium">Multi-wallet integration (Binance, Trust Wallet)</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium">Automated trading with real-time monitoring</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium">Daily profit distribution & instant withdrawals</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium">Transparent operations with audit trail</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  console.log('[v0] Changing mode to signup');
                  setMode('signup');
                  setError('');
                  setEmail('');
                  setName('');
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 text-base font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-200"
              >
                Create Account
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => {
                  console.log('[v0] Changing mode to login');
                  setMode('login');
                  setError('');
                  setEmail('');
                }}
                className="w-full border-2 border-gray-300 text-gray-800 hover:bg-gray-100 bg-white py-3 text-base font-bold rounded-xl transition-all duration-200"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sign Up Page
  if (mode === 'signup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => setMode('landing')}
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm mb-4 flex items-center gap-1 transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-4xl font-black text-slate-900 mb-2">Create Account</h2>
            <p className="text-slate-600 text-base">Join CryptoVoice and start earning today</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white transition-all text-slate-900 placeholder-slate-400"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white transition-all text-slate-900 placeholder-slate-400"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !name || !email}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            {/* Footer */}
            <p className="text-center text-sm text-slate-600 font-medium">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-blue-600 hover:text-blue-700 font-bold"
              >
                Sign In
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Sign In Page
  if (mode === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => setMode('landing')}
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm mb-4 flex items-center gap-1 transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-4xl font-black text-slate-900 mb-2">Welcome Back</h2>
            <p className="text-slate-600 text-base">Sign in to your CryptoVoice account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white transition-all text-slate-900 placeholder-slate-400"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Footer */}
            <div className="flex items-center justify-between text-sm pt-2">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-blue-600 hover:text-blue-700 font-bold transition-colors"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => setMode('forgot-password')}
                className="text-slate-600 hover:text-slate-700 font-bold transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Forgot Password Page
  if (mode === 'forgot-password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => setMode('login')}
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm mb-4 flex items-center gap-1 transition-colors"
            >
              ← Back to Sign In
            </button>
            <h2 className="text-4xl font-black text-slate-900 mb-2">Reset Password</h2>
            <p className="text-slate-600 text-base">Enter your email to receive a reset code</p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-12 pr-4 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white transition-all text-slate-900 placeholder-slate-400"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Success */}
            {successMessage && (
              <div className="p-3 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg text-sm font-medium">
                {successMessage}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 mt-2"
            >
              {loading ? 'Sending Code...' : 'Send Reset Code'}
            </Button>

            {/* Footer */}
            <p className="text-center text-sm text-slate-600 font-medium pt-2">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-blue-600 hover:text-blue-700 font-bold"
              >
                Sign In
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Reset Password Page (with OTP and New Password)
  if (mode === 'reset-password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => setMode('forgot-password')}
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm mb-4 flex items-center gap-1 transition-colors"
            >
              ← Back
            </button>
            <h2 className="text-4xl font-black text-slate-900 mb-2">Create New Password</h2>
            <p className="text-slate-600 text-base">Enter the code we sent and set your new password</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* OTP Code */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Verification Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white transition-all text-slate-900"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Check your email for the 6-digit code</p>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-12 pr-12 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white transition-all text-slate-900 placeholder-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-12 pr-12 py-3 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white transition-all text-slate-900 placeholder-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Success */}
            {successMessage && (
              <div className="p-3 bg-green-50 border-2 border-green-200 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                {successMessage}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !otp || !password || !confirmPassword}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 mt-2"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>

            {/* Footer */}
            <p className="text-center text-xs text-slate-600 pt-2">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-blue-600 hover:text-blue-700 font-bold"
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
