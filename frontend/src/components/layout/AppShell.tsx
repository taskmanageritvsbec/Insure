import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import {
  Menu, Bell, Sun, Moon, Download, ShieldCheck,
  CheckCircle, AlertTriangle, FileText, X, Check,
  FileSpreadsheet, Printer, Sparkles, Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PAGE_METADATA: Record<string, { title: string; subtitle: string }> = {
  '/':             { title: 'Telematics Dashboard', subtitle: 'BEHAVIOURAL PRICING & TRIPS OVERVIEW' },
  '/admin':        { title: 'Admin Portfolio', subtitle: 'INSURE GOVERNANCE & ACTUARIAL RULES' },
  '/compliance':   { title: 'Compliance Center', subtitle: 'MODEL FAIRNESS & CUSTOMER DISPUTES' },
  '/simulator':    { title: 'IoT Driving Simulator', subtitle: 'SYNTHETIC TELEMATICS INGESTION ENGINE' },
  '/trips':        { title: 'Trip Telematics', subtitle: 'RAW MEASUREMENTS & SENSOR LOGS' },
  '/consent':      { title: 'Privacy & Consent', subtitle: 'DATA ACCESS & SOVEREIGN DRIVER PERMISSIONS' },
  '/assessments':  { title: 'Risk Assessments', subtitle: 'EXPLAINABLE 5-FACTOR SCORING ENGINE' },
  '/review':       { title: 'Underwriting Review', subtitle: 'HUMAN-IN-THE-LOOP AUDIT QUEUE' },
  '/audit':        { title: 'Compliance Audit Trail', subtitle: 'IMMUTABLE EVENT CHRONOLOGY' },
  '/profitability':{ title: 'Portfolio Growth & Economics', subtitle: 'UNDERWRITING PROFITABILITY SIMULATOR' },
};

function getHeaderMeta(path: string) {
  if (PAGE_METADATA[path]) return PAGE_METADATA[path];
  for (const [key, val] of Object.entries(PAGE_METADATA)) {
    if (key !== '/' && path.startsWith(key)) return val;
  }
  return { title: 'Telematics Dashboard', subtitle: 'BEHAVIOURAL PRICING & TRIPS OVERVIEW' };
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'dispute' | 'alert' | 'compliance' | 'system';
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Customer Pricing Dispute Submitted',
    message: 'Policyholder filed dispute for obstacle avoidance during harsh braking event.',
    timestamp: '5m ago',
    type: 'dispute',
    unread: true,
  },
  {
    id: 'n-2',
    title: 'Telematics Sensor Anomaly Flagged',
    message: 'Trip #84 quarantined 3 corrupted accelerometer packets without penalty.',
    timestamp: '22m ago',
    type: 'alert',
    unread: true,
  },
  {
    id: 'n-3',
    title: 'Underwriting Loss Ratio Updated',
    message: 'Simulated portfolio loss ratio adjusted to 58.4% (Target: <65%).',
    timestamp: '1h ago',
    type: 'compliance',
    unread: true,
  },
  {
    id: 'n-4',
    title: 'Algorithmic Fairness Audit Passed',
    message: 'Cohort demographic parity index evaluated at 0.98. Zero disparate impact.',
    timestamp: '2h ago',
    type: 'compliance',
    unread: true,
  },
  {
    id: 'n-5',
    title: 'Sovereign Telematics Consent Active',
    message: 'Driver consented to version v1.0 data minimization telemetry policy.',
    timestamp: '3h ago',
    type: 'system',
    unread: true,
  },
  {
    id: 'n-6',
    title: 'High Speed Safety Alert',
    message: 'Vehicle speed registered >110 km/h baseline. Scaled in risk index.',
    timestamp: '5h ago',
    type: 'alert',
    unread: true,
  },
  {
    id: 'n-7',
    title: 'Single-Use OTP Password Reset',
    message: 'Brevo SMTP OTP successfully authorized and invalidated immediately.',
    timestamp: '6h ago',
    type: 'system',
    unread: true,
  },
  {
    id: 'n-8',
    title: 'Pricing Rule v2.1 Activated',
    message: 'Base premium ₹2,000 published with immutable audit trail entry.',
    timestamp: '8h ago',
    type: 'compliance',
    unread: true,
  },
];

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { role, user } = useAuth();
  const meta = getHeaderMeta(location.pathname);

  // ── Dark Mode State ──────────────────────────────────────────────────────────
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('insure_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('insure_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('insure_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // ── Notification Center State ────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // ── Export Custom Report State ───────────────────────────────────────────────
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'executive' | 'telematics' | 'profitability'>('executive');
  const [reportFormat, setReportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const handleExportCustomReport = () => {
    setIsExporting(true);
    setExportSuccess(null);

    const now = new Date().toISOString();
    const filename = `INSURE_${reportType.toUpperCase()}_REPORT_${now.slice(0, 10)}`;

    if (reportFormat === 'pdf') {
      setIsExporting(false);
      setExportModalOpen(false);
      setTimeout(() => {
        window.print();
      }, 300);
      return;
    }

    if (reportFormat === 'csv') {
      const csvRows = [
        ['INSURE Report Type', reportType.toUpperCase()],
        ['Generated By', user?.fullName || role || 'Authorized User'],
        ['Generated At', now],
        ['Base Premium (INR)', '₹2,000'],
        ['Rule Version', 'v2.1-profitability'],
        ['Safety Score Threshold', '80 (10% Discount), 50 (Standard), <50 (20% Surcharge)'],
        [],
        ['Metric / Indicator', 'Observed Value', 'Unit', 'Status'],
        ['Fleet Active Trips', '50', 'Trips', 'Valid Telematics'],
        ['Portfolio Loss Ratio', '58.4%', 'Percentage', 'Underwriting Compliant (<65%)'],
        ['Combined Expense Ratio', '83.2%', 'Percentage', 'Profitable Underwriting'],
        ['Pending Officer Disputes', '2', 'Cases', 'Human Review Queue'],
        ['Defensive Validation Rules', '9 Active Rules', 'Ruleset', 'Zero Unfair Penalties'],
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess(`CSV report generated: ${filename}.csv`);
      setTimeout(() => {
        setIsExporting(false);
        setExportModalOpen(false);
        setExportSuccess(null);
      }, 1200);
      return;
    }

    if (reportFormat === 'json') {
      const jsonBundle = {
        platform: 'INSURE — InsurTech & IoT Telematics Pricing Platform',
        report_type: reportType,
        generated_at: now,
        generated_by: user?.email || role,
        system_parameters: {
          currency: 'INR',
          currency_symbol: '₹',
          base_premium: 2000,
          rule_version: 'v2.1-profitability',
        },
        portfolio_summary: {
          loss_ratio: '58.4%',
          combined_ratio: '83.2%',
          active_fleet_trips: 50,
          pending_disputes: 2,
        },
        actuarial_breakdown: {
          safe_driver_discount_pct: 10,
          risky_driver_surcharge_pct: 20,
          insufficient_data_protection: true,
          accident_claims_protection: 'Legitimate insurance claims are NEVER rejected based on telematics scores.',
        },
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonBundle, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${filename}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setExportSuccess(`JSON audit bundle exported: ${filename}.json`);
      setTimeout(() => {
        setIsExporting(false);
        setExportModalOpen(false);
        setExportSuccess(null);
      }, 1200);
      return;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-800'}`}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 flex-shrink-0 z-20 transition-colors">
          <div className="flex items-center gap-3.5">
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight leading-none">
                {meta.title}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-1">
                {meta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Export Custom Report Button */}
            <button
              id="btn-export-custom-report"
              onClick={() => setExportModalOpen(true)}
              className="inline-flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Custom Report</span>
              <span className="sm:hidden">Export</span>
            </button>

            {/* Sun / Theme Dark Mode Toggle */}
            <button
              id="btn-toggle-dark-mode"
              onClick={toggleTheme}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Notification Bell with interactive dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                id="btn-notifications-bell"
                onClick={() => setNotificationsOpen(prev => !prev)}
                title="Notifications & Alerts"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-slate-900 shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Real Notifications Dropdown Menu */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-800 dark:text-white">
                        System Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={clearNotifications}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No notifications to display.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                            n.unread ? 'bg-slate-50/60 dark:bg-slate-800/30' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                              {n.timestamp}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8fafc] dark:bg-slate-950 transition-colors">
          <Outlet />
        </main>
      </div>

      {/* ── EXPORT CUSTOM REPORT MODAL ── */}
      {exportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">
                    Export Custom Report
                  </h3>
                  <p className="text-xs text-slate-400">
                    Generate an audit-grade report of telematics, pricing, or portfolio metrics.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {exportSuccess && (
              <div className="my-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{exportSuccess}</span>
              </div>
            )}

            <div className="space-y-4 py-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Select Report Scope
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'executive', label: 'Executive Summary', desc: 'KPIs & active fleet overview' },
                    { id: 'telematics', label: 'Telematics Audits', desc: 'Factor deductions & risk tiers' },
                    { id: 'profitability', label: 'Underwriting Economics', desc: 'Loss ratios & scenario P&L' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setReportType(item.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        reportType === item.id
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-semibold shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <p className="font-bold text-xs">{item.label}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Export Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'csv', label: 'CSV Spreadsheet', icon: FileSpreadsheet },
                    { id: 'json', label: 'JSON Audit Bundle', icon: FileText },
                    { id: 'pdf', label: 'Print / PDF', icon: Printer },
                  ].map(f => {
                    const FormatIcon = f.icon;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setReportFormat(f.id as any)}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                          reportFormat === f.id
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <FormatIcon className="w-4 h-4" />
                        <span>{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportCustomReport}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating…</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
