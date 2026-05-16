import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Sun, Moon } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../redux/slices/uiSlice';
import { AnimatedOutlet } from '../components/layout/AnimatedOutlet.jsx';
import { AppFooter } from '../components/layout/AppFooter.jsx';

export function MarketingLayout() {
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy">
      <motion.header
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-[100] border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg"
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-navy dark:text-white">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-cyan flex items-center justify-center text-white">
              <Package className="w-5 h-5" />
            </span>
            Nexus
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-sm font-medium">
            <Link to="/products" className="text-slate-600 dark:text-slate-300 hover:text-brand-blue">
              Shop
            </Link>
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/login" className="text-slate-600 dark:text-slate-300 hover:text-brand-blue hidden sm:inline">
              Log in
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-xl bg-brand-blue text-white hover:bg-blue-600 shadow-sm"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </motion.header>
      <AnimatedOutlet />
      <AppFooter variant="customer" />
    </div>
  );
}
