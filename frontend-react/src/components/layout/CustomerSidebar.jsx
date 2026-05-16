import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  ClipboardList,
  Heart,
  User,
  Bell,
  X,
} from 'lucide-react';
import { setSidebarOpen } from '../../redux/slices/uiSlice';

const links = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/products', label: 'Browse', icon: ShoppingBag },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/orders', label: 'My orders', icon: ClipboardList },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/notifications', label: 'Alerts', icon: Bell },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
    isActive
      ? 'bg-gradient-to-r from-brand-blue to-cyan-500 text-white shadow-md'
      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
  }`;

export function CustomerSidebar() {
  const open = useSelector((s) => s.ui.sidebarOpen);
  const dispatch = useDispatch();

  const aside = (
    <aside
      className={`
      fixed lg:sticky top-[4.25rem] z-[90] h-[calc(100vh-4.25rem)]
      w-64 shrink-0 border-r border-slate-200 dark:border-slate-800
      bg-white/95 dark:bg-slate-900/95 backdrop-blur-md
      lg:translate-x-0 transition-transform duration-300
      ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}
    >
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between lg:hidden mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Menu</span>
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => dispatch(setSidebarOpen(false))}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="space-y-1 flex-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass} onClick={() => dispatch(setSidebarOpen(false))}>
              <Icon className="w-5 h-5 shrink-0 opacity-90" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="text-xs text-slate-400 mt-4 leading-relaxed">Nexus — prices in Indian Rupees (INR).</p>
      </div>
    </aside>
  );

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-navy/40 lg:hidden"
            aria-label="Close menu"
            onClick={() => dispatch(setSidebarOpen(false))}
          />
        )}
      </AnimatePresence>
      {aside}
    </>
  );
}
