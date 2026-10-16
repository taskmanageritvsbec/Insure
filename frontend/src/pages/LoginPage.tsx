import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login as apiLogin } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Eye, EyeOff, ArrowRight, AlertCircle,
  Car, Building, Scale, Sparkles, CheckCircle2
} from 'lucide-react';

interface QuickAccount {
  role: 'customer' | 'admin' | 'compliance_officer';
  roleName: string;
  email: string;
  name: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  iconBg: string;
  description: string;
  route: string;
}

const QUICK_ACCOUNTS: QuickAccount[] = [
  {
    role: 'customer',
    roleName: 'Policyholder / Customer',
    email: 'tharunkumark4743@gmail.com',
    name: 'Tharun Kumar',
    badge: 'Customer Portal',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Car,
    iconBg: 'bg-emerald-600 text-white',
    description: 'Manage consent, inspect telematics & quote discounts',
    route: '/',
  },
  {
    role: 'admin',
    roleName: 'Insurance Admin / Owner',
    email: 'tharunkumark42007@gmail.com',
    name: 'Tharun Kumar',
    badge: 'Admin Portfolio',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Building,
    iconBg: 'bg-blue-600 text-white',
    description: 'Portfolio loss ratios & publish pricing rule parameters',
    route: '/admin',
  },
  {
    role: 'compliance_officer',
    roleName: 'Pricing & Compliance Officer',
    email: 'vsbecitc2428@gmail.com',
    name: 'Compliance Officer',
    badge: 'Compliance Center',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Scale,
    iconBg: 'bg-purple-600 text-white',
    description: 'Audit algorithmic fairness & adjudicate customer disputes',
    route: '/compliance',
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-4xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <img
            src="/logo-shield.png"
            alt="INSURE Logo"
            className="w-16 h-16 object-contain mx-auto mb-3 drop-shadow-sm"
          />
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">INSURE</h1>
          <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mt-1">
            Consented Telematics & Fair Pricing Platform
          </p>
        </div>

        {/* ── 1-CLICK EASY LOGIN PANEL ── */}
        <div className="mb-8 bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold tracking-wider uppercase text-emerald-100 backdrop-blur-xs mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Instant Role Access
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Easy 1-Click Role Login
              </h2>
              <p className="text-xs text-emerald-100/90 mt-1">
                Select your assigned role to authenticate instantly with verified seed credentials.
              </p>
            </div>
            <div className="text-xs text-white/70 font-mono hidden md:block text-right">
              Default password: <span className="bg-white/20 px-2 py-0.5 rounded font-bold text-white">123456</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {QUICK_ACCOUNTS.map(acc => {
              const Icon = acc.icon;
              const isLoggingIn = activeOneClickRole === acc.role;

              return (
                <div
                  key={acc.role}
                  className="bg-white/95 text-slate-800 rounded-2xl p-4.5 border border-white/20 shadow-sm flex flex-col justify-between hover:bg-white hover:scale-[1.02] transition-all duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${acc.iconBg} shadow-xs`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${acc.badgeColor} uppercase tracking-wider`}>
                        {acc.badge}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-800 leading-snug">
                      {acc.roleName}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                      {acc.email}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {acc.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      id={`one-click-${acc.role}`}
                      disabled={submitting || activeOneClickRole !== null}
                      onClick={() => handleOneClickLogin(acc)}
                      className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLoggingIn ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Signing in…</span>
                        </>
                      ) : (
                        <>
                          <span>1-Click Sign In</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MANUAL CREDENTIALS FORM CARD ── */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 max-w-xl mx-auto">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-slate-800">Or Sign In with Custom Email</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter custom credentials for existing or newly registered accounts.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <span>{error}</span>
                {unverifiedEmail && (
                  <div className="mt-2">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all text-sm cursor-pointer"
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

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-emerald-600 hover:text-emerald-700">
                Create Customer Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
