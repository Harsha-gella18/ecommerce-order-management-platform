import { Link } from 'react-router-dom';
import { formatINR } from '../../utils/formatCurrency.js';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star } from 'lucide-react';

export function ProductCard({
  product,
  stockQty,
  onAddCart,
  onToggleWishlist,
  wishlisted,
  compact,
}) {
  const img = product.images?.[0];
  const price = product.price != null ? Number(product.price) : 0;
  const low = stockQty != null && stockQty < 5 && stockQty > 0;
  const out = stockQty === 0;

  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      className={`group rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900/90 shadow-soft overflow-hidden flex flex-col ${
        compact ? 'max-w-xs' : ''
      }`}
    >
      <Link to={`/products/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No image</div>
        )}
        {product.rating > 0 && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/90 dark:bg-navy/80 text-xs font-semibold text-amber-600 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" aria-hidden />
            {product.rating.toFixed(1)}
          </span>
        )}
        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleWishlist();
            }}
            className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 dark:bg-navy/80 shadow-md hover:scale-105 transition-transform"
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`w-5 h-5 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-slate-600 dark:text-slate-300'}`}
            />
          </button>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs font-medium text-brand-blue uppercase tracking-wide mb-1">{product.category || 'General'}</p>
        <Link to={`/products/${product.id}`} className="font-semibold text-navy dark:text-white line-clamp-2 hover:text-brand-blue">
          {product.name}
        </Link>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-xl font-bold text-navy dark:text-white tabular-nums">{formatINR(price)}</p>
            {stockQty != null && (
              <p className={`text-xs mt-1 font-medium ${out ? 'text-red-500' : low ? 'text-amber-600' : 'text-emerald-600'}`}>
                {out ? 'Out of stock' : low ? `Only ${stockQty} left` : 'In stock'}
              </p>
            )}
          </div>
        </div>
        {onAddCart && (
          <button
            type="button"
            disabled={out}
            onClick={() => onAddCart()}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-brand-blue to-cyan-500 text-white text-sm font-semibold shadow-md hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to cart
          </button>
        )}
      </div>
    </motion.article>
  );
}
