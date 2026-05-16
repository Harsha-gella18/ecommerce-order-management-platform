import { fetchOrderInvoiceText } from '../api/gateway.js';

export async function downloadOrderInvoice(orderId) {
  const text = await fetchOrderInvoiceText(orderId);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${orderId}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
