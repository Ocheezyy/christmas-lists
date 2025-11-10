'use client';

import { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Get authentication options from server
      const optionsRes = await fetch('/api/auth/login/options', {
        method: 'POST',
      });

      if (!optionsRes.ok) {
        const json = await optionsRes.json();
        throw new Error(json?.error || 'Failed to get login options');
      }

      const options = await optionsRes.json();

      // Start WebAuthn authentication
      const credential = await startAuthentication(options);

      // Verify the authentication with the server
      const verifyRes = await fetch('/api/auth/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credential),
      });

      if (!verifyRes.ok) {
        const json = await verifyRes.json();
        throw new Error(json?.error || 'Login failed');
      }

      // Login successful - redirect to home
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <p className="text-gray-600">
          Use your security key or biometric authentication to sign in.
        </p>
        
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Authenticating...' : 'Login with Passkey'}
        </button>

        <div className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <a href="/admin/invite" className="text-blue-600 hover:underline">
            Contact admin for invite
          </a>
        </div>
      </div>
    </div>
  );
}
