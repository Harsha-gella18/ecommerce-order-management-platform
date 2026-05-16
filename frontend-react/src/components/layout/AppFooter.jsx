import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

export function AppFooter({ variant = 'customer' }) {
  const dark = variant === 'admin';
  return (
    <footer
      className={`mt-auto border-t ${
        dark
          ? 'border-slate-700 bg-slate-950 text-slate-400'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="flex items-center gap-2 font-bold text-navy dark:text-white mb-3">
            <Package className="w-5 h-5 text-brand-cyan" aria-hidden />
            Nexus
          </div>
          <p className="leading-relaxed">
            Online shopping and order management for customers and store teams. All prices are in Indian Rupees (INR).
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-navy dark:text-white mb-3">Shop</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/products" className="hover:text-brand-blue transition-colors">
                Catalog
              </Link>
            </li>
            <li>
              <Link to="/signup" className="hover:text-brand-blue transition-colors">
                Create account
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-navy dark:text-white mb-3">Operations</h4>
          <ul className="space-y-2">
            <li>
              <Link to="/admin" className="hover:text-brand-cyan transition-colors">
                Admin dashboard
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-brand-cyan transition-colors">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-navy dark:text-white mb-3">Payments</h4>
          <p className="text-xs leading-relaxed opacity-80">
            Checkout uses a demo payment flow for learning and testing — not real money movement.
          </p>
        </div>
      </div>
      <div
        className={`text-center text-xs py-4 border-t ${
          dark ? 'border-slate-800 text-slate-500' : 'border-slate-100 dark:border-slate-800'
        }`}
      >
        © {new Date().getFullYear()} Nexus — All rights reserved
      </div>
    </footer>
  );
}
