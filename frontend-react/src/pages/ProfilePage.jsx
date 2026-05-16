import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { CreditCard, MapPin, User } from 'lucide-react';
import { fetchProfile, updateProfile, addAddress, deleteAddress } from '../api/gateway.js';
import { useToast } from '../hooks/useToast.js';
import { setTheme } from '../redux/slices/uiSlice.js';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { Modal } from '../components/ui/Modal.jsx';

const emptyAddr = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  defaultAddress: false,
};

export function ProfilePage() {
  const dispatch = useDispatch();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [emailEdit, setEmailEdit] = useState('');
  const [addrOpen, setAddrOpen] = useState(false);
  const [addrForm, setAddrForm] = useState(emptyAddr);
  const [prefs, setPrefs] = useState({ notifications: 'on', theme: 'system' });

  async function load() {
    const p = await fetchProfile();
    setProfile(p);
    setName(p.name || '');
    setPhone(p.phone || '');
    setEmailEdit(p.email || '');
    const nextPrefs = {
      notifications: p.preferences?.notifications || 'on',
      theme: p.preferences?.theme || 'system',
    };
    setPrefs(nextPrefs);
    if (nextPrefs.theme === 'light' || nextPrefs.theme === 'dark') {
      dispatch(setTheme(nextPrefs.theme));
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch {
        toast('Could not load profile', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  async function saveProfile(e) {
    e.preventDefault();
    try {
      const p = await updateProfile({
        name,
        phone,
        email: emailEdit,
        preferences: prefs,
      });
      setProfile(p);
      if (prefs.theme === 'light' || prefs.theme === 'dark') {
        dispatch(setTheme(prefs.theme));
      }
      toast('Profile saved', 'success');
    } catch {
      toast('Save failed', 'error');
    }
  }

  async function saveAddress(e) {
    e.preventDefault();
    try {
      await addAddress(addrForm);
      setAddrOpen(false);
      setAddrForm(emptyAddr);
      await load();
      toast('Address added', 'success');
    } catch {
      toast('Could not add address', 'error');
    }
  }

  async function delAddr(id) {
    try {
      await deleteAddress(id);
      await load();
      toast('Address removed', 'success');
    } catch {
      toast('Remove failed', 'error');
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-navy dark:text-white flex items-center gap-2">
          <User className="w-8 h-8 text-brand-blue" /> Profile
        </h1>
        <p className="text-slate-500 text-sm mt-1">Update your details and saved addresses for faster checkout.</p>
      </div>

      <form onSubmit={saveProfile} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-6 space-y-4 shadow-sm">
        <h2 className="font-semibold text-navy dark:text-white">Details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Email (profile copy)</label>
            <input
              type="email"
              value={emailEdit}
              onChange={(e) => setEmailEdit(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Notifications preference</label>
            <select
              value={prefs.notifications}
              onChange={(e) => setPrefs({ ...prefs, notifications: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="on">In-app + email (simulated)</option>
              <option value="off">Muted</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Theme preference</label>
            <select
              value={prefs.theme}
              onChange={(e) => setPrefs({ ...prefs, theme: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
        <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-blue text-white font-semibold text-sm">
          Save changes
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-cyan" /> Addresses
          </h2>
          <button
            type="button"
            onClick={() => setAddrOpen(true)}
            className="text-sm font-semibold text-brand-blue"
          >
            + Add
          </button>
        </div>
        <ul className="space-y-3">
          {(profile?.addresses || []).map((a) => (
            <li key={a.id} className="flex justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-sm">
              <span>
                {a.defaultAddress && <span className="text-xs font-bold text-emerald-600 mr-2">DEFAULT</span>}
                {[a.line1, a.line2, a.city, a.state, a.postalCode, a.country].filter(Boolean).join(', ')}
              </span>
              <button type="button" className="text-red-500 text-xs font-semibold shrink-0" onClick={() => delAddr(a.id)}>
                Remove
              </button>
            </li>
          ))}
          {!profile?.addresses?.length && <p className="text-slate-500 text-sm">No saved addresses.</p>}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-6 shadow-sm">
        <h2 className="font-semibold text-navy dark:text-white flex items-center gap-2 mb-2">
          <CreditCard className="w-5 h-5 text-brand-blue" /> Saved payments
        </h2>
        <p className="text-sm text-slate-500">No vaulted instruments in this demo — payments are mock-only per order.</p>
      </div>

      <Modal open={addrOpen} onClose={() => setAddrOpen(false)} title="New address">
        <form onSubmit={saveAddress} className="space-y-3">
          {['line1', 'line2', 'city', 'state', 'postalCode', 'country'].map((f) => (
            <div key={f}>
              <label className="text-xs font-medium capitalize">{f}</label>
              <input
                required={['line1', 'city', 'postalCode', 'country'].includes(f)}
                value={addrForm[f]}
                onChange={(e) => setAddrForm({ ...addrForm, [f]: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={addrForm.defaultAddress}
              onChange={(e) => setAddrForm({ ...addrForm, defaultAddress: e.target.checked })}
            />
            Set as default
          </label>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-brand-blue text-white font-semibold">
            Save address
          </button>
        </form>
      </Modal>
    </div>
  );
}
