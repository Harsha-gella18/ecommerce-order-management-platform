/** Display amounts as Indian Rupees (stored values are treated as INR). */
export function formatINR(amount) {
  const n = Number(amount);
  const value = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
