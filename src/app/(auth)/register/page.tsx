'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', email, password, name }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      window.location.href = '/workflows';
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#0C2340" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Flow<span className="text-[#C9A227]">Forge</span>
          </span>
        </div>

        <div className="glass rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-2">Create your account</h1>
          <p className="text-gray-400 text-center text-sm mb-6">Start automating in minutes — free forever</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] transition-colors"
                placeholder="Syed Ali Adnan"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] transition-colors"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#C9A227] transition-colors"
                placeholder="Minimum 8 characters"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#C9A227] text-[#0C2340] font-semibold rounded-lg hover:bg-[#D4AF37] transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#C9A227] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
