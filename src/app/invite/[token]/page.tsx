'use client';

import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';

export default function InvitePage({ params }: { params: { token: string } }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get registration options
      const optionsRes = await fetch('/api/auth/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, inviteToken: params.token }),
      });

      if (!optionsRes.ok) {
        const { error } = await optionsRes.json();
        throw new Error(error);
      }

      const options = await optionsRes.json();

      // Start registration with the browser
      const regResult = await startRegistration(options);

      // Verify registration with the server
      const verifyRes = await fetch('/api/auth/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regResult),
      });

      if (!verifyRes.ok) {
        const { error } = await verifyRes.json();
        throw new Error(error);
      }

      // Registration successful - redirect to home
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Join Family Christmas List</h1>
      <form onSubmit={handleRegister}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Your Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Your name"
          />
        </div>
        {error && (
          <div className="mb-4 text-red-600 text-sm">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}