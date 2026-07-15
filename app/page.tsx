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
        <div className="min-h-screen flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-xl shadow-xl p-8 space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">Verify Your Email</h1>
                <p className="text-gray-600">Enter the verification code we sent to your inbox</p>
              </div>
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
        </div>
      )}
    </main>
  );
}
