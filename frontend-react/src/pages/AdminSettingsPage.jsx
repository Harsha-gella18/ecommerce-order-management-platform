import { Key, Palette, Shield, Webhook } from 'lucide-react';

export function AdminSettingsPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm">Read-only reference for how this demo is configured.</p>
      </div>

      {[
        {
          icon: Shield,
          title: 'Roles & permissions',
          body: 'Admins manage the catalog, orders, and customers. Shoppers see the storefront and their own orders. Blocking a customer stops them from signing in or ordering.',
        },
        {
          icon: Palette,
          title: 'Theme',
          body: 'Choose light or dark mode from the header; your preference is remembered on this device.',
        },
        {
          icon: Key,
          title: 'Account security',
          body: 'Use a strong password and sign out on shared computers. Contact support if you notice unusual activity.',
        },
        {
          icon: Webhook,
          title: 'Notifications',
          body: 'Order updates and alerts appear in your notifications area when available.',
        },
      ].map(({ icon: Icon, title, body }) => (
        <div key={title} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
