import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  fetchAnalyticsSummary,
  fetchAnalyticsSales,
  fetchOrderStatusAnalytics,
  fetchUserActivity,
  fetchTopProducts,
} from '../api/gateway.js';
import { AnalyticsStatCard } from '../components/ui/AnalyticsStatCard.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { formatINR } from '../utils/formatCurrency.js';

const COLORS = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function AnalyticsPage() {
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [status, setStatus] = useState({});
  const [activity, setActivity] = useState([]);
  const [top, setTop] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, sal, st, act, tp] = await Promise.all([
          fetchAnalyticsSummary(),
          fetchAnalyticsSales('daily'),
          fetchOrderStatusAnalytics(),
          fetchUserActivity(),
          fetchTopProducts(),
        ]);
        setSummary(s);
        setSales(sal);
        setStatus(st || {});
        setActivity(act);
        setTop(tp);
      } catch {
        /* 503 */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <PageLoader />;

  const pieData = Object.entries(status)
    .filter(([k]) => k !== 'charts' && k !== 'source' && k !== 'counts')
    .map(([name, value]) => ({ name, value: Number(value) || 0 }));
  const lineUsers = activity.map((a) => ({
    name: a.date?.slice?.(5, 10) || '—',
    users: a.activeUsers,
    signups: a.newSignups,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 text-sm">Sales trends and product performance. Revenue is shown in Indian Rupees (INR).</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <AnalyticsStatCard title="Revenue (window)" value={summary ? formatINR(summary.totalRevenue) : '—'} accent="blue" />
        <AnalyticsStatCard title="Orders" value={summary?.totalOrders ?? '—'} accent="emerald" />
        <AnalyticsStatCard title="Products in chart" value={top.length} hint="Top sellers in this period" accent="amber" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 h-80">
          <h2 className="text-lg font-semibold text-white mb-2">Order status mix</h2>
          {pieData.length === 0 ? (
            <p className="text-slate-500 text-sm mt-8">No data available for this chart yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 h-80">
          <h2 className="text-lg font-semibold text-white mb-2">User activity</h2>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={lineUsers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#2563EB" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="signups" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 h-72">
        <h2 className="text-lg font-semibold text-white mb-2">Revenue trend</h2>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={sales.map((d) => ({ name: d.date?.slice?.(5, 10) || d.period, revenue: d.revenue }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} />
            <Line type="monotone" dataKey="revenue" stroke="#06B6D4" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
