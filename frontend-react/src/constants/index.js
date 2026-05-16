export const ORDER_STATUSES = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export const ORDER_STATUS_LABEL = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const ADMIN_ORDER_STATUS_OPTIONS = ORDER_STATUSES;

export const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: 'smartphone' },
  { id: 'card', label: 'Card', icon: 'credit-card' },
  { id: 'wallet', label: 'Wallet', icon: 'wallet' },
  { id: 'cod', label: 'Cash on delivery', icon: 'banknote' },
];

export const HERO_SLIDES = [
  {
    title: 'New season arrivals',
    subtitle: 'Hand-picked products with reliable delivery across India.',
    cta: 'Shop deals',
    href: '/products',
    gradient: 'from-brand-blue to-cyan-500',
  },
  {
    title: 'Fast dispatch',
    subtitle: 'Track your order from checkout to your doorstep.',
    cta: 'Browse catalog',
    href: '/products',
    gradient: 'from-indigo-600 to-brand-cyan',
  },
  {
    title: 'Secure checkout',
    subtitle: 'Sign in to save addresses, pay safely, and manage orders in one place.',
    cta: 'Create account',
    href: '/signup',
    gradient: 'from-blue-700 to-sky-400',
  },
];
