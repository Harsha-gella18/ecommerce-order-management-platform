import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { dashboardPathForRole } from '../utils/dashboardPath.js';
import { useToast } from '../hooks/useToast.js';

function strengthScore(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  return Math.min(s, 4);
}

export function SignupPage() {
  const { signup } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const score = useMemo(() => strengthScore(password), [password]);
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  async function onSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      toast('Passwords do not match', 'error');
      return;
    }
    if (!terms) {
      toast('Accept the terms to continue', 'error');
      return;
    }
    setLoading(true);
    try {
      const data = await signup({ name, email, password, phone }, remember);
      toast('Account created', 'success');
      nav(dashboardPathForRole(data.role), { replace: true });
    } catch (ex) {
      const msg = ex.response?.data?.message || ex.response?.data?.error || 'Signup failed';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy dark:text-white mb-1">Create your shopper account</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        New sign-ups get a shopper account so you can save addresses, track orders, and pay at checkout. Store staff use
        separate admin access.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-blue/30 outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-blue/30 outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-blue/30 outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-blue/30 outline-none"
          />
          <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-blue to-emerald-400"
              initial={false}
              animate={{ width: `${(score / 4) * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">{password ? labels[Math.max(0, score - 1)] : 'Enter a password'}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-brand-blue/30 outline-none"
          />
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1" />I agree to
          the Terms of Service and Privacy Policy (demo copy).
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Keep me signed in after account creation
        </label>
        <motion.button
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-blue to-cyan-500 text-white font-semibold shadow-md disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Sign up'}
        </motion.button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-blue font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
