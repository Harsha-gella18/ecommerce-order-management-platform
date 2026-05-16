import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Zap, Shield, Truck, Quote } from 'lucide-react';
import { HERO_SLIDES } from '../constants/index.js';
import { fetchProducts, fetchCategories } from '../api/gateway.js';
import { ProductCard } from '../components/product/ProductCard.jsx';

export function HomePage() {
  const [slide, setSlide] = useState(0);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const id = window.setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 6500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [prods, cats] = await Promise.all([
          fetchProducts({ sort: 'rating_desc' }),
          fetchCategories(),
        ]);
        setFeatured(prods.slice(0, 8));
        setCategories(cats.slice(0, 8));
      } catch {
        setFeatured([]);
        setCategories([]);
      }
    })();
  }, []);

  const s = HERO_SLIDES[slide];

  return (
    <div className="overflow-hidden">
      <section className="relative min-h-[480px] flex items-center">
        <div className="absolute inset-0 bg-gradient-customer opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 w-full grid lg:grid-cols-2 gap-12 items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.45 }}
            >
              <p className="text-cyan-100 text-sm font-semibold uppercase tracking-widest mb-3">Nexus storefront</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">{s.title}</h1>
              <p className="text-lg text-white/85 mb-8 max-w-lg">{s.subtitle}</p>
              <Link
                to={s.href}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-brand-blue font-semibold shadow-lg hover:bg-slate-50 transition-colors"
              >
                {s.cta}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div className="flex gap-2 mt-10">
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    onClick={() => setSlide(i)}
                    className={`h-1.5 rounded-full transition-all ${i === slide ? 'w-10 bg-white' : 'w-3 bg-white/40'}`}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            {[
              { icon: Zap, t: 'Quick shopping', d: 'Find products fast and check availability before you buy.' },
              { icon: Shield, t: 'Secure sign-in', d: 'Your account protects orders, addresses, and payment choices.' },
              { icon: Truck, t: 'Order tracking', d: 'Follow each step from placed to delivered.' },
              { icon: Quote, t: 'Clear pricing', d: 'All prices in Indian Rupees — no surprises at checkout.' },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="glass-panel rounded-2xl p-5 text-white">
                <Icon className="w-8 h-8 text-cyan-200 mb-3" />
                <h3 className="font-semibold mb-1">{t}</h3>
                <p className="text-sm text-white/75 leading-relaxed">{d}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-navy dark:text-white">Featured products</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Top-rated picks from our catalog.</p>
          </div>
          <Link to="/products" className="text-brand-blue font-semibold hover:underline inline-flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-navy dark:text-white mb-8">Shop by category</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((c) => (
              <Link
                key={c}
                to={`/products?category=${encodeURIComponent(c)}`}
                className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-600 text-sm font-medium hover:border-brand-blue hover:text-brand-blue transition-colors bg-slate-50 dark:bg-slate-800/80"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-navy to-brand-blue p-8 md:p-12 text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-cyan-200 text-sm font-semibold mb-2">Flash deals</p>
            <h3 className="text-3xl font-bold mb-4">Great value across the catalog</h3>
            <p className="text-white/80 max-w-xl mb-6">
              Compare prices, sort by cost, and fill your cart with products priced in Indian Rupees.
            </p>
            <Link to="/products?sort=price_asc" className="inline-flex px-5 py-2.5 rounded-xl bg-white text-navy font-semibold">
              Explore value picks
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 p-8 bg-slate-50 dark:bg-slate-900/60">
          <Quote className="w-10 h-10 text-brand-cyan mb-4" />
          <p className="text-navy dark:text-white font-medium leading-relaxed mb-4">
            “Clean layout, easy checkout, and I can see my orders without digging through emails.”
          </p>
          <p className="text-sm text-slate-500">— Nexus shopper</p>
        </div>
      </section>
    </div>
  );
}
