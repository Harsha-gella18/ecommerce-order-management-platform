import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { createOrder, fetchProfile } from '../api/gateway.js';
import { useToast } from '../hooks/useToast.js';
import { PageLoader } from '../components/ui/Spinner.jsx';

function formatAddressLine(a) {
  const parts = [a.line1, a.line2, a.city, a.state, a.postalCode, a.country].filter(Boolean);
  return parts.join(', ');
}

export function CheckoutPage() {
  const nav = useNavigate();
  const toast = useToast();
  const { loading: authLoading, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileErr, setProfileErr] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [shipMode, setShipMode] = useState('custom');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [simulateSuccess, setSimulateSuccess] = useState(true);
  const [loading, setLoading] = useState(false);

  const addresses = profile?.addresses || [];
  const hasSaved = addresses.length > 0;

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) setLoadingProfile(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setProfileErr('');
      setLoadingProfile(true);
      try {
        const data = await fetchProfile();
        if (cancelled) return;
        setProfile(data);
        const list = data.addresses || [];
        if (list.length > 0) {
          const def = list.find((a) => a.defaultAddress);
          setSelectedAddressId((def || list[0]).id);
          setShipMode('saved');
        } else {
          setShipMode('custom');
          setSelectedAddressId('');
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
          setProfileErr('Could not load your addresses.');
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const canSubmitSaved = useMemo(
    () => shipMode === 'saved' && hasSaved && selectedAddressId,
    [shipMode, hasSaved, selectedAddressId]
  );

  async function submit(e) {
    e.preventDefault();
    if (shipMode === 'saved' && !canSubmitSaved) {
      toast('Choose a saved address.', 'error');
      return;
    }
    if (shipMode === 'custom' && !customAddress.trim()) {
      toast('Enter a shipping address or pick a saved one.', 'error');
      return;
    }
    setLoading(true);
    try {
      const payload = { simulatePaymentSuccess: simulateSuccess };
      if (shipMode === 'saved' && selectedAddressId) {
        payload.shippingAddressId = selectedAddressId;
      } else {
        payload.shippingAddress = customAddress.trim();
      }
      const data = await createOrder(payload);
      toast('Order placed', 'success');
      nav(`/payment/${data.id}`);
    } catch (ex) {
      const d = ex.response?.data;
      const msg =
        (typeof d === 'string' && d) ||
        d?.error ||
        d?.message ||
        (ex.response?.status === 502 && 'We could not complete checkout right now. Please try again shortly.');
      toast(msg || ex.message || 'Checkout failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loadingProfile) return <PageLoader />;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Checkout</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Choose where we ship your order. Payment is simulated for this demo.</p>
      {profileErr && (
        <p className="text-sm text-red-600 mb-4">
          {profileErr}{' '}
          <Link to="/profile" className="underline">
            Open profile
          </Link>
        </p>
      )}

      <form onSubmit={submit} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-6 shadow-sm space-y-6">
        <h3 className="font-semibold text-navy dark:text-white">Shipping</h3>
        {hasSaved ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Choose a saved address or ship elsewhere.</p>
            {addresses.map((a) => (
              <label key={a.id} className="flex gap-3 items-start p-3 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <input
                  type="radio"
                  name="shipMode"
                  checked={shipMode === 'saved' && selectedAddressId === a.id}
                  onChange={() => {
                    setShipMode('saved');
                    setSelectedAddressId(a.id);
                  }}
                />
                <span className="text-sm">
                  {a.defaultAddress ? (
                    <span className="text-xs font-semibold text-emerald-600 mr-2">Default</span>
                  ) : null}
                  {formatAddressLine(a)}
                </span>
              </label>
            ))}
            <label className="flex gap-3 items-start p-3 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer">
              <input
                type="radio"
                name="shipMode"
                checked={shipMode === 'custom'}
                onChange={() => setShipMode('custom')}
              />
              <span className="text-sm">Different address (enter below)</span>
            </label>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No saved addresses. Add some on <Link to="/profile" className="text-brand-blue font-medium">Profile</Link>, or
            type an address below.
          </p>
        )}

        {(shipMode === 'custom' || !hasSaved) && (
          <div>
            <label htmlFor="addr" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Shipping address
            </label>
            <textarea
              id="addr"
              rows={4}
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              placeholder="Street, city, postal code, country"
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              required={shipMode === 'custom' || !hasSaved}
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <input type="checkbox" checked={simulateSuccess} onChange={(e) => setSimulateSuccess(e.target.checked)} />
          Simulate successful payment (demo)
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-blue to-cyan-500 text-white font-semibold disabled:opacity-50"
        >
          {loading ? 'Placing order…' : 'Place order'}
        </button>
      </form>
    </div>
  );
}
