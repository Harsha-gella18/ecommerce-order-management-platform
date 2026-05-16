import { api } from './client';

/** @param {Record<string, string|number|undefined>} params */
export async function fetchProducts(params) {
  const { data } = await api.get('/products', { params });
  return data;
}

export async function fetchCategories() {
  const { data } = await api.get('/products/meta/categories');
  return data;
}

export async function fetchProduct(id) {
  const { data } = await api.get(`/products/${id}`);
  return data;
}

export async function createProduct(body) {
  const { data } = await api.post('/products', body);
  return data;
}

export async function updateProduct(id, body) {
  const { data } = await api.put(`/products/${id}`, body);
  return data;
}

export async function deleteProduct(id) {
  await api.delete(`/products/${id}`);
}

export async function fetchCart() {
  const { data } = await api.get('/cart');
  return data;
}

export async function addCartItem(body) {
  const { data } = await api.post('/cart/items', body);
  return data;
}

export async function updateCartItem(productId, body) {
  const { data } = await api.put(`/cart/items/${productId}`, body);
  return data;
}

export async function removeCartItem(productId) {
  const { data } = await api.delete(`/cart/items/${productId}`);
  return data;
}

export async function clearCart() {
  await api.delete('/cart/clear');
}

export async function fetchWishlist() {
  const { data } = await api.get('/cart/wishlist');
  return data;
}

export async function addWishlistItem(body) {
  const { data } = await api.post('/cart/wishlist/items', body);
  return data;
}

export async function removeWishlistItem(productId) {
  const { data } = await api.delete(`/cart/wishlist/items/${productId}`);
  return data;
}

export async function createOrder(body) {
  const { data } = await api.post('/orders', body);
  return data;
}

export async function fetchMyOrders() {
  const { data } = await api.get('/orders/my');
  return data;
}

export async function fetchAdminOrders() {
  const { data } = await api.get('/orders/admin/all');
  return data;
}

export async function fetchOrder(id) {
  const { data } = await api.get(`/orders/${id}`);
  return data;
}

export async function updateOrderStatus(id, status) {
  const { data } = await api.put(`/orders/${id}/status`, { status });
  return data;
}

export async function cancelOrder(id) {
  const { data } = await api.put(`/orders/${id}/cancel`);
  return data;
}

/** Plain-text invoice (attachment) — same auth as GET order. */
export async function fetchOrderInvoiceText(orderId) {
  const { data } = await api.get(`/orders/${orderId}/invoice`, { responseType: 'text' });
  return data;
}

export async function setAuthAccountStatus(userId, status) {
  await api.put(`/auth/admin/users/${userId}/account-status`, { status });
}

export async function fetchProfile() {
  const { data } = await api.get('/users/me');
  return data;
}

export async function updateProfile(body) {
  const { data } = await api.put('/users/me', body);
  return data;
}

export async function addAddress(body) {
  const { data } = await api.post('/users/me/addresses', body);
  return data;
}

export async function deleteAddress(id) {
  const { data } = await api.delete(`/users/me/addresses/${id}`);
  return data;
}

export async function fetchAdminProfiles() {
  const { data } = await api.get('/users/admin/profiles');
  return data;
}

export async function setUserAccountStatus(userId, status) {
  const { data } = await api.put(`/users/admin/profiles/${userId}/status`, { status });
  return data;
}

export async function fetchPaymentByOrder(orderId) {
  const { data } = await api.get(`/payments/${orderId}`);
  return data;
}

export async function fetchAdminPayments() {
  const { data } = await api.get('/payments/admin/all');
  return data;
}

export async function refundPayment(paymentId) {
  const { data } = await api.post(`/payments/${paymentId}/refund`);
  return data;
}

export async function fetchNotifications() {
  const { data } = await api.get('/notifications');
  return data;
}

export async function markNotificationRead(id) {
  const { data } = await api.put(`/notifications/${id}/read`);
  return data;
}

export async function adminSendNotification(body) {
  const { data } = await api.post('/notifications/admin/send', body);
  return data;
}

export async function adminBroadcastNotifications(body) {
  const { data } = await api.post('/notifications/admin/broadcast', body);
  return data;
}

export async function adminNotificationRecent(limit = 100) {
  const { data } = await api.get('/notifications/admin/recent', { params: { limit } });
  return data;
}

export async function fetchInventory(productId) {
  const { data } = await api.get(`/inventory/${productId}`);
  return data;
}

export async function restockInventory(productId, body) {
  const { data } = await api.put(`/inventory/restock/${productId}`, body);
  return data;
}

export async function inventoryCheck(items) {
  const { data } = await api.post('/inventory/check', { items });
  return data;
}

export async function fetchAnalyticsSummary() {
  const { data } = await api.get('/analytics/summary');
  return data;
}

/** @returns {Promise<Array<{date?: string, period?: string, revenue: number, orders: number}>>} */
export async function fetchAnalyticsSales(period = 'daily') {
  const { data } = await api.get('/analytics/sales', { params: { period } });
  if (data && Array.isArray(data.series)) return data.series;
  return Array.isArray(data) ? data : [];
}

/** @returns {Promise<Array<Record<string, unknown>>>} */
export async function fetchTopProducts() {
  const { data } = await api.get('/analytics/top-products');
  if (data && Array.isArray(data.series)) return data.series;
  return Array.isArray(data) ? data : [];
}

/** Status key → count (for Recharts pie via Object.entries). */
export async function fetchOrderStatusAnalytics() {
  const { data } = await api.get('/analytics/orders-status');
  if (data && data.counts && typeof data.counts === 'object') return data.counts;
  return data && typeof data === 'object' ? data : {};
}

/** @returns {Promise<Array<{date: string, activeUsers: number, newSignups: number}>>} */
export async function fetchUserActivity() {
  const { data } = await api.get('/analytics/user-activity');
  if (data && Array.isArray(data.series)) return data.series;
  return Array.isArray(data) ? data : [];
}
