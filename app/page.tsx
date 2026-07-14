'use client';

import { useEffect, useState } from 'react';
import { SignupForm } from '@/components/SignupForm';
import { OTPVerification } from '@/components/OTPVerification';
import { Dashboard } from '@/components/Dashboard';

type PageState = 'signup' | 'otp' | 'dashboard';

export default function Page() {
  const [state, setState] = useState<PageState>('signup');
  const [email, setEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/user/dashboard');
      if (response.ok) {
        setIsAuthenticated(true);
        setState('dashboard');
      }
    } catch {
      // Not authenticated
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-600">Binance Work</h1>
          {isAuthenticated && (
            <button
              onClick={() => {
                setIsAuthenticated(false);
                setState('signup');
                setEmail('');
              }}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-8">
        {isAuthenticated ? (
          <Dashboard />
        ) : state === 'signup' ? (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-2">Create Account</h2>
            <p className="text-gray-600 mb-6">Sign up to access Binance Work</p>
            <SignupForm
              onSuccess={(userId, userEmail) => {
                setEmail(userEmail);
                setState('otp');
              }}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-2">Verify Email</h2>
            <p className="text-gray-600 mb-6">Enter the OTP code sent to your email</p>
            <OTPVerification
              email={email}
              onSuccess={() => {
                setIsAuthenticated(true);
                setState('dashboard');
              }}
              onBack={() => setState('signup')}
            />
          </div>
        )}
      </div>
    </main>
  );
}
