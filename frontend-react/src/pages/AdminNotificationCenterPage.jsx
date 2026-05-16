import { useEffect, useState } from 'react';
import { adminSendNotification, adminBroadcastNotifications, adminNotificationRecent } from '../api/gateway.js';
import { fetchAdminProfiles } from '../api/gateway.js';
import { useToast } from '../hooks/useToast.js';
import { PageLoader } from '../components/ui/Spinner.jsx';

export function AdminNotificationCenterPage() {
  const toast = useToast();
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Platform notice');
  const [body, setBody] = useState('Scheduled maintenance tonight 02:00 UTC.');
  const [userId, setUserId] = useState('');
  const [idsText, setIdsText] = useState('');
  const [profiles, setProfiles] = useState([]);

  async function load() {
    const [r, p] = await Promise.all([
      adminNotificationRecent(80).catch(() => []),
      fetchAdminProfiles().catch(() => []),
    ]);
    setRecent(r);
    setProfiles(p);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch {
        toast('Could not load notification center', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  async function sendOne(e) {
    e.preventDefault();
    if (!userId.trim()) {
      toast('Pick a user id', 'error');
      return;
    }
    try {
      await adminSendNotification({ userId: userId.trim(), title, body });
      toast('Notification sent', 'success');
      await load();
    } catch (ex) {
      toast(ex.response?.data?.error || 'Send failed', 'error');
    }
  }

  async function broadcast(e) {
    e.preventDefault();
    const userIds = idsText
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!userIds.length) {
      toast('Enter at least one user id', 'error');
      return;
    }
    try {
      await adminBroadcastNotifications({ userIds, title, body });
      toast(`Broadcast to ${userIds.length} users`, 'success');
      await load();
    } catch (ex) {
      toast(ex.response?.data?.error || 'Broadcast failed', 'error');
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white">Notification center</h1>
        <p className="text-slate-400 text-sm">Send in-app notifications via notification-service admin routes.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <form onSubmit={sendOne} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Direct send</h2>
          <div>
            <label className="text-xs text-slate-400">Target user id</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
            >
              <option value="">Select profile…</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.email || p.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400">Body</label>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
            />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-brand-blue text-white font-semibold">
            Send notification
          </button>
        </form>

        <form onSubmit={broadcast} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Broadcast</h2>
          <p className="text-xs text-slate-500">Comma or newline separated user ids (must exist in platform).</p>
          <textarea
            rows={4}
            value={idsText}
            onChange={(e) => setIdsText(e.target.value)}
            placeholder="userId1, userId2"
            className="w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white font-mono"
          />
          <button type="submit" className="w-full py-2.5 rounded-xl bg-cyan-600 text-white font-semibold">
            Broadcast
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">History (global)</h2>
        <ul className="space-y-2 max-h-80 overflow-y-auto text-sm">
          {recent.map((n) => (
            <li key={n._id} className="flex justify-between gap-4 border-b border-slate-800 pb-2">
              <span className="text-slate-300">{n.title}</span>
              <span className="text-slate-500 font-mono text-xs">{n.userId}</span>
            </li>
          ))}
          {!recent.length && <li className="text-slate-500">No rows yet.</li>}
        </ul>
      </div>
    </div>
  );
}
