import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-navy">
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-navy via-brand-blue to-brand-cyan text-white p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        <Link to="/" className="relative flex items-center gap-2 text-lg font-bold z-10">
          <Package className="w-7 h-7" /> Nexus
        </Link>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight mb-4">Shop smarter. Run your store with clarity.</h1>
          <p className="text-white/85 text-lg leading-relaxed">
            One place for browsing, checkout, order tracking, and admin tools — built for a smooth everyday experience.
          </p>
        </div>
        <p className="relative z-10 text-white/60 text-sm">Prices shown in Indian Rupees (INR).</p>
      </div>
      <div className="flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-navy dark:text-white">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-cyan-500 flex items-center justify-center text-white">
                <Package className="w-6 h-6" />
              </span>
              Nexus
            </Link>
          </div>
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
