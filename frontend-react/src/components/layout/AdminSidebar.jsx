import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ClipboardList,
  Users,
  CreditCard,
  BarChart3,
  Megaphone,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { setSidebarOpen, toggleAdminSidebarCollapsed } from '../../redux/slices/uiSlice';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/notification-center', label: 'Notify', icon: Megaphone },
  { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const open = useSelector((s) => s.ui.sidebarOpen);
  const collapsed = useSelector((s) => s.ui.adminSidebarCollapsed);
  const dispatch = useDispatch();

  const linkClass = ({ isActive }) => {
    const base =
      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap';
    if (isActive) return `${base} bg-brand-blue text-white shadow-lg shadow-brand-blue/25`;
    return `${base} text-slate-300 hover:bg-slate-800 hover:text-white`;
  };

  const width = collapsed ? 'lg:w-20' : 'lg:w-64';

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/50 lg:hidden"
            aria-label="Close menu"
            onClick={() => dispatch(setSidebarOpen(false))}
          />
        )}
      </AnimatePresence>
      <aside
        className={`
        fixed lg:sticky top-[4.25rem] z-[90] h-[calc(100vh-4.25rem)]
        ${width} shrink-0 border-r border-slate-800 bg-slate-950
        transition-all duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <div className="p-3 flex flex-col h-full overflow-y-auto">
          <div className="hidden lg:flex justify-end mb-2">
            <button
              type="button"
              onClick={() => dispatch(toggleAdminSidebarCollapsed())}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
          <nav className="space-y-1 flex-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={linkClass}
                onClick={() => dispatch(setSidebarOpen(false))}
                title={collapsed ? label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>
          <p className={`text-[10px] text-slate-500 mt-4 leading-relaxed ${collapsed ? 'text-center' : ''}`}>
            {!collapsed ? 'Nexus admin — analytics & orders' : 'Nexus'}
          </p>
        </div>
      </aside>
    </>
  );
}
