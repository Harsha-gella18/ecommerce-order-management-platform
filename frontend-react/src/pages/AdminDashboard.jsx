import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  fetchAnalyticsSummary,
  fetchAnalyticsSales,
  fetchTopProducts,
  fetchAdminOrders,
} from '../api/gateway.js';
import { AnalyticsStatCard } from '../components/ui/AnalyticsStatCard.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { formatINR } from '../utils/formatCurrency.js';

export function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [top, setTop] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, sal, tp, ord] = await Promise.all([
          fetchAnalyticsSummary(),
          fetchAnalyticsSales('daily'),
          fetchTopProducts(),
          fetchAdminOrders(),
        ]);
        setSummary(s);
        setSales(sal);
        setTop(tp.slice(0, 5));
        setRecent(ord.slice(0, 8));
      } catch {
        /* analytics may 503 */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <PageLoader />;

  const chartData = sales.map((row) => ({
    name: row.date?.slice?.(5, 10) || row.period?.slice?.(5) || '—',
    revenue: row.revenue,
    orders: row.orders,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Operations dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Revenue, orders, and recent activity. Amounts are in Indian Rupees (INR).</p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AnalyticsStatCard
          title="Total revenue (window)"
          value={summary ? formatINR(summary.totalRevenue) : '—'}
          hint="Selected reporting window"
          accent="blue"
        />
        <AnalyticsStatCard
          title="Orders (window)"
          value={summary ? summary.totalOrders : '—'}
          hint="In the selected period"
          accent="emerald"
        />
        <AnalyticsStatCard
          title="Cancelled (snapshot)"
          value={summary ? summary.cancelledOrders : '—'}
          hint="Cancelled in this period"
          accent="amber"
        />
        <AnalyticsStatCard
          title="Top product revenue"
          value={top[0] ? formatINR(top[0].revenue) : '—'}
          hint={top[0]?.name || '—'}
          accent="rose"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Sales trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" fill="url(#fillRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top products</h2>
          <ul className="space-y-3">
            {top.map((p) => (
              <li key={p.productId || p.name} className="flex justify-between text-sm text-slate-300">
                <span className="truncate pr-2">{p.name}</span>
                <span className="text-emerald-400 font-mono tabular-nums">{formatINR(p.revenue)}</span>
              </li>
            ))}
            {!top.length && <li className="text-slate-500 text-sm">No analytics data</li>}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm text-cyan-400 font-semibold hover:underline">
            Manage
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr>
                <th className="pb-2">Order</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Total</th>
                <th className="pb-2">Customer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recent.map((o) => (
                <tr key={o.id} className="text-slate-300">
                  <td className="py-2 font-mono text-xs">{o.id}</td>
                  <td className="py-2">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="py-2 tabular-nums">{formatINR(o.totalAmount)}</td>
                  <td className="py-2 font-mono text-xs">{o.customerId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
