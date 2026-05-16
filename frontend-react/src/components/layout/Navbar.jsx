import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Menu,
  Search,
  Bell,
  ShoppingCart,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Package,
  Heart,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { toggleTheme, toggleSidebar, toggleAdminSidebarCollapsed } from '../../redux/slices/uiSlice';
import { fetchCart, fetchWishlist } from '../../api/gateway.js';
import { SearchInput } from '../ui/SearchInput.jsx';

export function Navbar({ variant = 'customer' }) {
  const isLg = useMediaQuery('(min-width: 1024px)');
  const { user, logout, isAdmin } = useAuth();
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user || isAdmin) {
      setCartCount(0);
      setWishCount(0);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const [cart, wish] = await Promise.all([fetchCart(), fetchWishlist()]);
        if (!cancelled) {
          const n = (cart.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
          setCartCount(n);
          setWishCount((wish.items || []).length);
        }
      } catch {
        if (!cancelled) {
          setCartCount(0);
          setWishCount(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, location.pathname]);

  const onSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate(`/products?q=${encodeURIComponent(term)}`);
    else navigate('/products');
  };

  const shell =
    variant === 'admin'
      ? 'bg-navy/95 border-slate-800 text-slate-100 backdrop-blur-md'
      : 'bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-navy dark:text-slate-100 backdrop-blur-md';

  return (
    <header className={`fixed top-0 inset-x-0 z-[100] border-b shadow-sm ${shell}`}>
      <div className="max-w-[1600px] mx-auto px-3 md:px-6 h-[4.25rem] flex items-center gap-3 w-full min-w-0">
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          {variant === 'customer' && user && !isAdmin && (
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
              onClick={() => dispatch(toggleSidebar())}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          {variant === 'admin' && (
            <button
              type="button"
              className="p-2 rounded-xl hover:bg-slate-800 shrink-0"
              onClick={() => dispatch(isLg ? toggleAdminSidebarCollapsed() : toggleSidebar())}
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2 font-bold text-lg shrink-0 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue to-brand-cyan flex items-center justify-center text-white shadow-md shrink-0">
              <Package className="w-5 h-5" aria-hidden />
            </span>
            <span className="hidden sm:inline tracking-tight truncate">Nexus</span>
          </Link>
        </div>

        {variant === 'customer' && (
          <form onSubmit={onSearch} className="hidden md:flex flex-1 min-w-0 max-w-xl justify-center mx-2 lg:mx-6">
            <SearchInput value={q} onChange={setQ} placeholder="Search products and categories…" className="w-full" />
            <button type="submit" className="sr-only">
              Search
            </button>
          </form>
        )}

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0 ml-auto">
          {variant === 'customer' && (
            <Link
              to="/products"
              className="inline-flex md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Browse products"
            >
              <Search className="w-5 h-5" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => dispatch(toggleTheme())}
            className={`p-2 rounded-xl ${
              variant === 'admin' ? 'hover:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {user && !isAdmin && (
            <>
              <Link
                to="/wishlist"
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 relative text-slate-600 dark:text-slate-300"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] text-[10px] font-bold flex items-center justify-center rounded-full bg-rose-500 text-white">
                    {wishCount > 99 ? '99+' : wishCount}
                  </span>
                )}
              </Link>
              <Link
                to="/notifications"
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 relative text-slate-600 dark:text-slate-300"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
              </Link>
              <Link
                to="/cart"
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 relative text-slate-600 dark:text-slate-300"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] text-[10px] font-bold flex items-center justify-center rounded-full bg-brand-blue text-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {user ? (
            <div className="relative ml-1 sm:ml-2 flex justify-end">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl text-sm font-medium ${
                  variant === 'admin'
                    ? 'bg-slate-800 hover:bg-slate-700'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue/30 to-cyan-500/30 flex items-center justify-center text-xs font-bold">
                  {(user.email || '?').slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden sm:inline max-w-[120px] md:max-w-[180px] truncate">{user.email}</span>
                <ChevronDown className="w-4 h-4 opacity-60 shrink-0" />
              </button>
              {menuOpen && (
                <>
                  <button type="button" className="fixed inset-0 z-[105] cursor-default" aria-label="Close" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-glass z-[110] py-1 text-sm origin-top-right"
                  >
                    {!isAdmin && (
                      <>
                        <NavLink
                          to="/dashboard"
                          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                          onClick={() => setMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </NavLink>
                        <NavLink
                          to="/profile"
                          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                          onClick={() => setMenuOpen(false)}
                        >
                          Profile
                        </NavLink>
                        <NavLink
                          to="/wishlist"
                          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                          onClick={() => setMenuOpen(false)}
                        >
                          <Heart className="w-4 h-4" /> Wishlist
                        </NavLink>
                      </>
                    )}
                    {isAdmin && (
                      <NavLink
                        to="/admin"
                        className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                        onClick={() => setMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" /> Operations
                      </NavLink>
                    )}
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                        navigate('/');
                      }}
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-brand-blue text-white hover:bg-blue-600 shadow-sm"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
