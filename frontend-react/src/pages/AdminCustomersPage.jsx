import { useEffect, useState } from 'react';
import { fetchAdminProfiles, setUserAccountStatus, setAuthAccountStatus } from '../api/gateway.js';
import { useToast } from '../hooks/useToast.js';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { DataTable } from '../components/ui/DataTable.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';

export function AdminCustomersPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  async function load() {
    const list = await fetchAdminProfiles();
    setRows(list);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch {
        toast('Could not load customers', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  async function toggleBlock(p) {
    const next = p.accountStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    const rollback = p.accountStatus === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE';
    try {
      await setAuthAccountStatus(p.id, next);
      try {
        await setUserAccountStatus(p.id, next);
      } catch (e) {
        await setAuthAccountStatus(p.id, rollback);
        throw e;
      }
      toast(next === 'BLOCKED' ? 'Customer blocked — sign-in disabled' : 'Customer unblocked', 'success');
      await load();
    } catch (ex) {
      const msg = ex.response?.data?.message || ex.response?.data?.error || 'Update failed';
      toast(msg, 'error');
    }
  }

  const filtered = rows.filter(
    (r) =>
      !q.trim() ||
      r.email?.toLowerCase().includes(q.toLowerCase()) ||
      r.name?.toLowerCase().includes(q.toLowerCase()) ||
      r.id?.toLowerCase().includes(q.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Customers</h1>
      <p className="text-slate-400 text-sm mb-6">
        Blocked customers cannot sign in or place orders until you unblock them.
      </p>
      <SearchInput value={q} onChange={setQ} placeholder="Search name, email, id…" className="max-w-md mb-6" />
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          {
            key: 'role',
            label: 'Role',
            render: (r) => <span className="text-slate-300">{r.role || '—'}</span>,
          },
          {
            key: 'accountStatus',
            label: 'Status',
            render: (r) => <StatusBadge status={r.accountStatus || 'ACTIVE'} />,
          },
          {
            key: 'actions',
            label: '',
            render: (r) => (
              <button type="button" className="text-xs font-semibold text-amber-400" onClick={() => toggleBlock(r)}>
                {r.accountStatus === 'BLOCKED' ? 'Unblock' : 'Block'}
              </button>
            ),
          },
        ]}
        rows={filtered}
      />
    </div>
  );
}
