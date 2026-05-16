import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { dashboardPathForRole } from '../utils/dashboardPath.js';
import { useToast } from '../hooks/useToast.js';

export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password, remember);
      toast('Signed in successfully', 'success');
      const from = loc.state?.from;
      nav(from === 'admin' ? '/admin' : dashboardPathForRole(data.role), { replace: true });
    } catch (ex) {
      const msg = ex.response?.data?.message || ex.response?.data?.error || 'Invalid credentials';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy dark:text-white mb-1">Welcome back</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
        Sign in with your email and password.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-navy dark:text-slate-100 focus:ring-2 focus:ring-brand-blue/30 outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-blue/30 outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Keep me signed in on this device (uses browser storage until you sign out)
        </label>
        <motion.button
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-blue to-cyan-500 text-white font-semibold shadow-md disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </motion.button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8">
        New here?{' '}
        <Link to="/signup" className="text-brand-blue font-semibold hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
