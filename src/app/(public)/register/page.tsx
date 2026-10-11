'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Mail, CheckCircle2, User, Lock, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function RegisterForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (errorParam) {
      setStatus('error');
      if (errorParam === 'Configuration') {
        setErrorMsg('Authentication configuration error. Please check Google OAuth settings.');
      } else if (errorParam === 'AccessDenied') {
        setErrorMsg('Sign-up request was denied.');
      } else if (errorParam === 'OAuthAccountNotLinked') {
        setErrorMsg('An account already exists with this email using a different sign-in method.');
      } else {
        setErrorMsg(`Authentication error: ${errorParam}`);
      }
    }
  }, [errorParam]);

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
      <div className="max-w-md mx-auto mt-24 mb-24 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome to Skyline!</h1>
        <p className="text-muted-foreground">Your account has been created successfully.</p>
        <Link 
          href="/login" 
          className="inline-block gradient-primary text-primary-foreground font-semibold py-2.5 px-6 rounded-xl hover:opacity-90 transition-opacity"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12 sm:mt-20 mb-20 px-4">
      <div className="bg-card border rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create an Account</h1>
          <p className="text-sm text-muted-foreground">Join the Skyline Student Association</p>
        </div>

        {status === 'error' && (
          <div className="bg-destructive/10 text-destructive p-3.5 rounded-xl text-sm text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* 1-Click Google Sign Up Button */}
        <button
          type="button"
          onClick={() => signIn('google', { callbackUrl: '/account' })}
          className="w-full border border-border bg-card text-foreground font-semibold py-3 px-4 rounded-xl hover:bg-muted transition-colors flex justify-center items-center gap-3 shadow-xs"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Sign up with Google</span>
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
            <span className="px-3 bg-card text-muted-foreground">Or register with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-input border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-shadow text-sm"
                placeholder="Rohan Sharma"
                disabled={status === 'loading'}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Student Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-input border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-shadow text-sm"
                placeholder="you@university.edu"
                disabled={status === 'loading'}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-input border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-shadow text-sm"
                placeholder="••••••••"
                disabled={status === 'loading'}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full gradient-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
          >
            {status === 'loading' ? 'Creating account...' : 'Create Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground pt-2">
          Already have an account? <Link href="/login" className="font-semibold text-primary hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto mt-24 text-center text-muted-foreground text-sm">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
