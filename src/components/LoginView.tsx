import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  Shield,
  ShieldCheck,
  Building2,
  Users,
  LogIn,
  Key,
  Mail,
  Lock,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  Layers,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, theme, toggleTheme, users } = useApp();
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!emailInput.trim()) {
      setErrorMsg('Please enter your email or role name.');
      return;
    }
    const success = login(emailInput, passwordInput);
    if (!success) {
      setErrorMsg('Invalid login credentials.');
    }
  };

  const handleQuickRoleLogin = (role: UserRole) => {
    login(role);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 font-black">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            AgencyHub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Wholesale Agency & Retailer Distribution Management Portal
          </p>
        </div>

        {/* Quick Role Selection Cards */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Instant Demo Access
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Select Role to Sign In
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Experience the customized interface and permission boundaries for each tier.
            </p>
          </div>

          <div className="space-y-2.5">
            {/* Admin Option */}
            <button
              id="btn-login-admin"
              type="button"
              onClick={() => handleQuickRoleLogin('admin')}
              className="w-full p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 hover:border-purple-500 hover:bg-purple-100/70 dark:hover:bg-purple-900/50 flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Admin</span>
                    <span className="text-[10px] bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-1.5 py-0.2 rounded-sm">
                      Full Access
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    Rishabh (Owner) • Manage agencies, all orders, team & admin
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Manager Option */}
            <button
              id="btn-login-manager"
              type="button"
              onClick={() => handleQuickRoleLogin('manager')}
              className="w-full p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 hover:border-blue-500 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Manager</span>
                    <span className="text-[10px] bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-1.5 py-0.2 rounded-sm">
                      Operations
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    Sunil Mehta • Manage agencies, create orders & approve
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Staff Option */}
            <button
              id="btn-login-staff"
              type="button"
              onClick={() => handleQuickRoleLogin('staff')}
              className="w-full p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 hover:border-emerald-500 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50 flex items-center justify-between text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Staff</span>
                    <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.2 rounded-sm">
                      Restricted
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    Pooja Verma • View orders and inventory only
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="shrink mx-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Or Sign In with Email
            </span>
            <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Manual Input Form */}
          <form onSubmit={handleManualLogin} className="space-y-3 text-xs">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Email Address or Role
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="admin@agencyhub.in"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Dashboard</span>
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          WhatsApp Wholesale Distribution System • All session tokens encrypted locally
        </p>
      </div>
    </div>
  );
};
