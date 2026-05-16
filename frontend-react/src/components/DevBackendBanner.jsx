import { useEffect, useState } from 'react';

/** Shown in development when the app cannot reach the configured server. */
export function DevBackendBanner() {
  const [down, setDown] = useState(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    let cancelled = false;
    const id = window.setTimeout(() => {
      fetch('/api/auth/validate', { method: 'GET' })
        .then((res) => {
          if (!cancelled) setDown(!res.ok);
        })
        .catch(() => {
          if (!cancelled) setDown(true);
        });
    }, 800);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  if (!import.meta.env.DEV || !down) return null;

  return (
    <div
      className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
      role="alert"
    >
      <p>
        <strong>We can&apos;t reach the server from this page.</strong> Make sure your backend is running and your
        environment file is configured, then refresh. If you are only previewing the interface, some actions will not
        work until the server is available.
      </p>
      <p className="mt-2 text-amber-800 dark:text-amber-200/90">
        Store address for this app:{' '}
        <a className="underline font-medium" href="http://127.0.0.1:5173/">
          http://127.0.0.1:5173
        </a>
      </p>
    </div>
  );
}
