import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useToast } from '../hooks/useToast.js';
import {
  fetchProducts,
  fetchCategories,
  fetchWishlist,
  addWishlistItem,
  removeWishlistItem,
  addCartItem,
  fetchInventory,
} from '../api/gateway.js';
import { ProductCard } from '../components/product/ProductCard.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { formatINR } from '../utils/formatCurrency.js';

const PAGE_SIZE = 8;

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating_desc', label: 'Rating' },
  { value: 'name_asc', label: 'Name A–Z' },
];

export function ProductListPage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [qInput, setQInput] = useState(params.get('q') || '');
  const qDebounced = useDebouncedValue(qInput, 300);
  const [category, setCategory] = useState(params.get('category') || '');
  const [sort, setSort] = useState(params.get('sort') || 'newest');
  const [minPrice, setMinPrice] = useState(params.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') || '');
  const [minRating, setMinRating] = useState(params.get('minRating') || '');
  const [availability, setAvailability] = useState(params.get('availability') || '');
  const [categories, setCategories] = useState([]);
  const [rawProducts, setRawProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);
  const [wishIds, setWishIds] = useState(new Set());
  const [stockMap, setStockMap] = useState({});

  const syncParams = useCallback(() => {
    const next = new URLSearchParams();
    if (qDebounced) next.set('q', qDebounced);
    if (category) next.set('category', category);
    if (sort && sort !== 'newest') next.set('sort', sort);
    if (minPrice) next.set('minPrice', minPrice);
    if (maxPrice) next.set('maxPrice', maxPrice);
    if (minRating) next.set('minRating', minRating);
    if (availability) next.set('availability', availability);
    setParams(next, { replace: true });
  }, [qDebounced, category, sort, minPrice, maxPrice, minRating, availability, setParams]);

  useEffect(() => {
    syncParams();
  }, [syncParams]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [list, cats] = await Promise.all([
          fetchProducts({
            q: qDebounced || undefined,
            category: category || undefined,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            sort,
          }),
          fetchCategories().catch(() => []),
        ]);
        let filtered = list;
        if (minRating) {
          const m = Number(minRating);
          filtered = filtered.filter((p) => p.rating >= m);
        }
        setRawProducts(filtered);
        setCategories(cats);
        setStockMap({});
      } catch {
        setRawProducts([]);
        toast('Could not load catalog', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [qDebounced, category, sort, minPrice, maxPrice, minRating, toast]);

  useEffect(() => {
    if (!rawProducts.length || !availability) {
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const map = {};
      const slice = rawProducts.slice(0, 48);
      await Promise.all(
        slice.map(async (p) => {
          try {
            const row = await fetchInventory(p.id);
            map[p.id] = row.quantity;
          } catch {
            map[p.id] = 0;
          }
        })
      );
      if (!cancelled) setStockMap((prev) => ({ ...prev, ...map }));
    })();
    return () => {
      cancelled = true;
    };
  }, [rawProducts, availability]);

  const products = useMemo(() => {
    if (!availability) return rawProducts;
    return rawProducts.filter((p) => {
      const q = stockMap[p.id];
      if (q == null) return true;
      if (availability === 'in_stock') return q > 0;
      if (availability === 'out_of_stock') return q <= 0;
      return true;
    });
  }, [rawProducts, availability, stockMap]);

  useEffect(() => {
    if (!user || isAdmin) {
      setWishIds(new Set());
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const w = await fetchWishlist();
        if (!cancelled) setWishIds(new Set((w.items || []).map((i) => String(i.productId))));
      } catch {
        if (!cancelled) setWishIds(new Set());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  useEffect(() => {
    setPage(1);
  }, [qDebounced, category, sort, minPrice, maxPrice, minRating, availability]);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return products.slice(start, start + PAGE_SIZE);
  }, [products, page]);

  useEffect(() => {
    if (!pageItems.length) return undefined;
    let cancelled = false;
    (async () => {
      const updates = {};
      await Promise.all(
        pageItems.map(async (p) => {
          if (stockMap[p.id] != null) return;
          try {
            const row = await fetchInventory(p.id);
            updates[p.id] = row.quantity;
          } catch {
            updates[p.id] = 0;
          }
        })
      );
      if (!cancelled && Object.keys(updates).length) {
        setStockMap((prev) => ({ ...prev, ...updates }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageItems]);

  async function toggleWishlist(p) {
    if (!user || isAdmin) {
      toast('Log in as a customer to use wishlist', 'error');
      return;
    }
    const pid = p?.id != null && p.id !== '' ? String(p.id) : '';
    if (!pid) {
      toast('Invalid product — refresh the page', 'error');
      return;
    }
    try {
      if (wishIds.has(pid)) {
        await removeWishlistItem(pid);
        setWishIds((prev) => {
          const n = new Set(prev);
          n.delete(pid);
          return n;
        });
        toast('Removed from wishlist', 'success');
      } else {
        await addWishlistItem({
          productId: pid,
          name: p.name,
          price: p.price,
          image: p.images?.[0] || '',
        });
        setWishIds((prev) => new Set(prev).add(pid));
        toast('Saved to wishlist', 'success');
      }
    } catch (err) {
      const status = err?.response?.status;
      const apiErr = err?.response?.data?.error;
      const msg =
        apiErr ||
        (status === 401 ? 'Sign in again — your session may have expired' : null) ||
        (status === 404 ? 'Wishlist service unavailable — is cart-service running?' : null) ||
        'Wishlist update failed';
      toast(msg, 'error');
    }
  }

  async function addToCart(p) {
    if (!user || isAdmin) {
      toast('Log in as a customer to add to cart', 'error');
      return;
    }
    try {
      await addCartItem({
        productId: p.id,
        name: p.name,
        price: Number(p.price),
        quantity: 1,
      });
      toast('Added to cart', 'success');
    } catch {
      toast('Could not add to cart', 'error');
    }
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-navy dark:text-white">Product catalog</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Browse the catalog with filters and sorting. Prices are in Indian Rupees (INR).</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-600 p-1 bg-white dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg ${view === 'grid' ? 'bg-brand-blue text-white' : 'text-slate-500'}`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`p-2 rounded-lg ${view === 'list' ? 'bg-brand-blue text-white' : 'text-slate-500'}`}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-4 shadow-sm">
            <div className="flex items-center gap-2 font-semibold text-navy dark:text-white mb-3">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </div>
            <SearchInput value={qInput} onChange={setQInput} placeholder="Search…" className="mb-4" />
            <label className="text-xs font-medium text-slate-500 uppercase">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 py-2 px-3 text-sm"
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <label className="text-xs font-medium text-slate-500 uppercase mt-4 block">Price min</label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 py-2 px-3 text-sm"
            />
            <label className="text-xs font-medium text-slate-500 uppercase mt-4 block">Price max</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 py-2 px-3 text-sm"
            />
            <label className="text-xs font-medium text-slate-500 uppercase mt-4 block">Min rating</label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 py-2 px-3 text-sm"
            >
              <option value="">Any</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="4.5">4.5+</option>
            </select>
            <label className="text-xs font-medium text-slate-500 uppercase mt-4 block">Availability</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 py-2 px-3 text-sm"
            >
              <option value="">Any</option>
              <option value="in_stock">In stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </div>
        </aside>

        <div className="lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <p className="text-sm text-slate-500">{products.length} products</p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 py-2 px-3 text-sm"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : !products.length ? (
            <EmptyState
              title="No products match"
              description="Adjust filters or clear search to see more SKUs."
              action={
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-brand-blue text-white text-sm font-semibold"
                  onClick={() => {
                    setQInput('');
                    setCategory('');
                    setMinPrice('');
                    setMaxPrice('');
                    setMinRating('');
                    setAvailability('');
                  }}
                >
                  Reset filters
                </button>
              }
            />
          ) : view === 'grid' ? (
            <motion.div layout className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {pageItems.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  stockQty={stockMap[p.id]}
                  wishlisted={wishIds.has(String(p.id))}
                  onToggleWishlist={() => toggleWishlist(p)}
                  onAddCart={() => addToCart(p)}
                />
              ))}
            </motion.div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {pageItems.map((p) => (
                <div key={p.id} className="flex flex-col sm:flex-row gap-4 p-4">
                  <div className="w-full sm:w-32 h-24 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                    {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-brand-blue font-semibold">{p.category}</p>
                    <h3 className="font-semibold text-navy dark:text-white">{p.name}</h3>
                    <p className="text-lg font-bold mt-2">{formatINR(p.price)}</p>
                  </div>
                  <div className="flex sm:flex-col gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => addToCart(p)}
                      className="px-4 py-2 rounded-xl bg-brand-blue text-white text-sm font-semibold"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(p)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm"
                    >
                      Wishlist
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
