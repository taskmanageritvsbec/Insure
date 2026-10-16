import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login as apiLogin } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Eye, EyeOff, ArrowRight, AlertCircle,
  Car, Building, Scale, Zap
} from 'lucide-react';

interface QuickAccount {
  role: 'customer' | 'admin' | 'compliance_officer';
  roleLabel: string;
  email: string;
  icon: React.ElementType;
  route: string;
  colorClass: string;
}

const QUICK_ACCOUNTS: QuickAccount[] = [
  {
    role: 'customer',
    roleLabel: 'Customer',
    email: 'tharunkumark4743@gmail.com',
    icon: Car,
    route: '/',
    colorClass: 'hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/50 text-slate-700',
  },
  {
    role: 'admin',
    roleLabel: 'Admin',
    email: 'tharunkumark42007@gmail.com',
    icon: Building,
    route: '/admin',
    colorClass: 'hover:border-blue-500 hover:text-blue-700 hover:bg-blue-50/50 text-slate-700',
  },
  {
    role: 'compliance_officer',
    roleLabel: 'Compliance',
    email: 'vsbecitc2428@gmail.com',
    icon: Scale,
    route: '/compliance',
    colorClass: 'hover:border-purple-500 hover:text-purple-700 hover:bg-purple-50/50 text-slate-700',
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeOneClickRole, setActiveOneClickRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Return to location if redirected by protected route
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const performLogin = async (targetEmail: string, targetPass: string, defaultRoute?: string) => {
    setError(null);
    setUnverifiedEmail(null);

    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Email address is required.');
      return;
    }
    if (!targetPass) {
      setError('Password is required.');
      return;
    }

    try {
      const res = await apiLogin({ email: cleanEmail, password: targetPass });
      login(res.token, res.user);

      // Strict role-based route redirection
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else if (res.user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (res.user.role === 'compliance_officer') {
        navigate('/compliance', { replace: true });
      } else {
        navigate(defaultRoute || '/', { replace: true });
      }
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password.';
      setError(msg);
      if (err.requiresVerification || msg.toLowerCase().includes('verify your email')) {
        setUnverifiedEmail(cleanEmail);
      }
      throw err;
    }
  };

  const handleOneClickLogin = async (account: QuickAccount) => {
    setActiveOneClickRole(account.role);
    setEmail(account.email);
    setPassword('123456');
    try {
      await performLogin(account.email, '123456', account.route);
    } catch {
      // Handled in performLogin
    } finally {
      setActiveOneClickRole(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await performLogin(email, password);
    } catch {
      // Handled in performLogin
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <img
            src="/logo-shield.png"
            alt="INSURE Logo"
            className="w-14 h-14 object-contain mx-auto mb-2.5 drop-shadow-xs"
          />
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">INSURE</h1>
          <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
            Consented Telematics & Fair Pricing Platform
          </p>
        </div>

        {/* Credentials Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Sign In to Your Account</h2>
          <p className="text-xs text-slate-500 mb-5">
            Enter your email and password to access your portal.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <span>{error}</span>
                {unverifiedEmail && (
                  <div className="mt-1.5">
                    <Link
                      to="/verify-email"
                      state={{ email: unverifiedEmail }}
                      className="inline-flex items-center gap-1 font-semibold text-rose-800 underline hover:text-rose-900"
                    >
                      Verify your email now →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all pr-10 font-mono"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={submitting || activeOneClickRole !== null}
              className="w-full mt-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all text-sm cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* ── TINY 1-CLICK ROLE ACCESS BOX AT BOTTOM ── */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                1-Click Quick Login
              </span>
              <span className="text-[10px] font-mono text-slate-400">pwd: 123456</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {QUICK_ACCOUNTS.map(acc => {
                const Icon = acc.icon;
                const isLoggingIn = activeOneClickRole === acc.role;

                return (
                  <button
                    key={acc.role}
                    type="button"
                    id={`quick-login-${acc.role}`}
                    title={`1-Click login as ${acc.roleLabel} (${acc.email})`}
                    disabled={submitting || activeOneClickRole !== null}
                    onClick={() => handleOneClickLogin(acc)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 ${acc.colorClass}`}
                  >
                    {isLoggingIn ? (
                      <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{acc.roleLabel}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-emerald-600 hover:text-emerald-700">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
