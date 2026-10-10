'use client'

import { useState } from 'react';
import { Mail, CheckCircle2, User, Lock } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error || 'Registration failed.');
      } else {
        setStatus('success');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto mt-24 text-center space-y-6">
        <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome to Skyline!</h1>
        <p className="text-muted-foreground">Your account has been created successfully.</p>
        <Link href="/login" className="inline-block gradient-primary text-primary-foreground font-medium py-2.5 px-6 rounded-[var(--radius-md)] hover:opacity-90 transition-opacity">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-24 mb-24">
      <div className="bg-card border rounded-[var(--radius-xl)] shadow-sm p-8 space-y-8 card-hover">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Create an Account</h1>
          <p className="text-muted-foreground">Join the Skyline Student Association</p>
        </div>

        {status === 'error' && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-[var(--radius-md)] text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input border rounded-[var(--radius-md)] focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-shadow"
                placeholder="Jane Doe"
                disabled={status === 'loading'}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Student Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input border rounded-[var(--radius-md)] focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-shadow"
                placeholder="you@university.edu"
                disabled={status === 'loading'}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input border rounded-[var(--radius-md)] focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-shadow"
                placeholder="••••••••"
                disabled={status === 'loading'}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full gradient-primary text-primary-foreground font-medium py-2.5 rounded-[var(--radius-md)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {status === 'loading' ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
