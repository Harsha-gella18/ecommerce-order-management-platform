import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * Avoid AnimatePresence + mode="wait" around <Outlet /> — it often leaves the next
 * screen invisible after client-side navigations (full refresh still works).
 * A keyed motion.div only animates the incoming page.
 */
export function AnimatedOutlet() {
  const location = useLocation();
  const outletKey = `${location.pathname}${location.search}`;
  return (
    <motion.div
      key={outletKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-[50vh]"
    >
      <Outlet />
    </motion.div>
  );
}
