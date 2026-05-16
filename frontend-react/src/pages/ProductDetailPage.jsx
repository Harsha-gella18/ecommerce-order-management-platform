import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Heart, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../hooks/useToast.js';
import {
  fetchProduct,
  fetchProducts,
  fetchInventory,
  addCartItem,
  fetchWishlist,
  addWishlistItem,
  removeWishlistItem,
} from '../api/gateway.js';
import { ProductCard } from '../components/product/ProductCard.jsx';
import { formatINR } from '../utils/formatCurrency.js';
import { PageLoader } from '../components/ui/Spinner.jsx';

export function ProductDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [stock, setStock] = useState(null);
  const [related, setRelated] = useState([]);
  const [imgIx, setImgIx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [wish, setWish] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await fetchProduct(id);
        if (cancelled) return;
        setProduct(p);
        const inv = await fetchInventory(id).catch(() => null);
        if (!cancelled && inv) setStock(inv.quantity);
        const list = await fetchProducts({ category: p.category, sort: 'rating_desc' });
        if (!cancelled) setRelated(list.filter((x) => x.id !== p.id).slice(0, 4));
      } catch {
        if (!cancelled) setProduct(null);
        toast('Product not found', 'error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, toast]);

  useEffect(() => {
    if (!user || isAdmin) {
      setWish(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const w = await fetchWishlist();
        if (!cancelled) setWish((w.items || []).some((i) => String(i.productId) === String(id)));
      } catch {
        if (!cancelled) setWish(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, id]);

  async function addCart(qty) {
    if (!user || isAdmin) {
      toast('Log in as a customer to purchase', 'error');
      return;
    }
    try {
      await addCartItem({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: qty,
      });
      toast('Added to cart', 'success');
    } catch {
      toast('Could not add to cart', 'error');
    }
  }

  async function toggleWish() {
    if (!user || isAdmin) {
      toast('Log in to save items', 'error');
      return;
    }
    const pid = product?.id != null && product.id !== '' ? String(product.id) : '';
    if (!pid) {
      toast('Invalid product', 'error');
      return;
    }
    try {
      if (wish) {
        await removeWishlistItem(pid);
        setWish(false);
        toast('Removed from wishlist', 'success');
      } else {
        await addWishlistItem({
          productId: pid,
          name: product.name,
          price: product.price,
          image: product.images?.[0] || '',
        });
        setWish(true);
        toast('Saved to wishlist', 'success');
      }
    } catch (err) {
      const status = err?.response?.status;
      const apiErr = err?.response?.data?.error;
      toast(
        apiErr ||
          (status === 401 ? 'Sign in again — your session may have expired' : null) ||
          (status === 404 ? 'Wishlist unavailable — is cart-service running?' : null) ||
          'Wishlist failed',
        'error'
      );
    }
  }

  if (!product) return <PageLoader />;

  const images = product.images?.length ? product.images : [];
  const mainImg = images[imgIx];

  return (
    <div>
      <Link
        to="/products"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-blue hover:underline mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Back to catalog
      </Link>
      <div className="grid lg:grid-cols-2 gap-10">
        <div>
          <motion.div
            className="relative aspect-square rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-zoom-in"
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
          >
            {mainImg ? (
              <img
                src={mainImg}
                alt=""
                className={`w-full h-full object-cover transition-transform duration-500 ${zoom ? 'scale-110' : 'scale-100'}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">No image</div>
            )}
          </motion.div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setImgIx(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 ${
                    i === imgIx ? 'border-brand-blue' : 'border-transparent'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-blue uppercase tracking-wide">{product.category}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-navy dark:text-white mt-2">{product.name}</h1>
          <div className="flex items-center gap-2 mt-3">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            <span className="font-semibold">{product.rating?.toFixed(1) ?? '—'}</span>
            <span className="text-slate-400">·</span>
            <span className="text-sm text-slate-500">
              {stock != null ? (stock > 0 ? `${stock} in stock` : 'Out of stock') : 'Stock loading…'}
            </span>
          </div>
          <p className="text-4xl font-bold text-navy dark:text-white mt-6">{formatINR(product.price)}</p>
          <p className="mt-6 text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {product.description || 'Premium SKU with fulfillment-ready metadata.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={stock === 0}
              onClick={() => addCart(1)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-cyan-500 text-white font-semibold shadow-lg disabled:opacity-40"
            >
              <ShoppingCart className="w-5 h-5" /> Add to cart
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => addCart(1)}
              className="px-6 py-3 rounded-xl border-2 border-brand-blue text-brand-blue font-semibold hover:bg-brand-blue/5"
            >
              Buy now
            </motion.button>
            <button
              type="button"
              onClick={toggleWish}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="Wishlist"
            >
              <Heart className={`w-6 h-6 ${wish ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>
          <div className="mt-10 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-5 border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-navy dark:text-white mb-2">Specifications</h3>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li>Product ID: {product.id}</li>
              <li>Category: {product.category}</li>
              <li>Status: {product.active === false ? 'Archived' : 'Active'}</li>
            </ul>
          </div>
        </div>
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-bold text-navy dark:text-white mb-6">Ratings & reviews</h2>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-900/60">
          <p className="text-slate-500 text-sm">
            Average customer rating: {product.rating != null ? product.rating.toFixed(1) : '—'} out of 5.
          </p>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-navy dark:text-white mb-6">Related products</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
