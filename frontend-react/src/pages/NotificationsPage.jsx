import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { fetchNotifications, markNotificationRead } from '../api/gateway.js';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export function NotificationsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await fetchNotifications();
    setList(data);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function markRead(n) {
    if (n.read) return;
    try {
      await markNotificationRead(n._id);
      setList((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
    } catch {
      /* ignore */
    }
  }

  if (loading) return <PageLoader />;
  if (!list.length) {
    return (
      <EmptyState
        title="No notifications"
        description="Order and payment events will appear here when RabbitMQ consumers are running."
      />
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-navy dark:text-white flex items-center gap-2 mb-8">
        <Bell className="w-8 h-8 text-brand-blue" /> Notifications
      </h1>
      <ul className="space-y-3">
        {list.map((n) => (
          <motion.li
            layout
            key={n._id}
            className={`rounded-2xl border p-4 cursor-pointer transition-colors ${
              n.read
                ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50'
                : 'border-brand-blue/40 bg-brand-blue/5 dark:bg-brand-blue/10'
            }`}
            onClick={() => markRead(n)}
          >
            <p className="font-semibold text-navy dark:text-white">{n.title}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{n.body}</p>
            <p className="text-xs text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
