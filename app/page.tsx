'use client';

import { useEffect, useState } from 'react';
import { AuthPage } from '@/components/AuthPage';
import { OTPVerification } from '@/components/OTPVerification';
import { Dashboard } from '@/components/Dashboard';

type PageState = 'auth' | 'otp' | 'dashboard';

export default function Page() {
  const [state, setState] = useState<PageState>('auth');
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
      } else if (response.status === 401) {
        // Session invalid or expired
        setIsAuthenticated(false);
        setState('auth');
      }
    } catch (error) {
      // Not authenticated
      setIsAuthenticated(false);
      setState('auth');
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

  const handleLogout = () => {
    setIsAuthenticated(false);
    setState('auth');
    setEmail('');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main Content */}
      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : state === 'auth' ? (
        <AuthPage
          onAuthSuccess={(userEmail) => {
            setEmail(userEmail);
            setState('otp');
          }}
        />
      ) : (
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-2">Verify Email</h2>
            <p className="text-gray-600 mb-6">Enter the OTP code sent to your email</p>
            <OTPVerification
              email={email}
              onSuccess={() => {
                setIsAuthenticated(true);
                setState('dashboard');
              }}
              onBack={() => setState('auth')}
            />
          </div>
        </div>
      )}
    </main>
  );
}
