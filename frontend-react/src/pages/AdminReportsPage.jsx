import { useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { useToast } from '../hooks/useToast.js';
import {
  fetchAdminOrders,
  fetchProducts,
  fetchAdminProfiles,
  fetchAdminPayments,
} from '../api/gateway.js';

function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminReportsPage() {
  const toast = useToast();
  const [busy, setBusy] = useState('');

  async function exportSales() {
    setBusy('sales');
    try {
      const orders = await fetchAdminOrders();
      downloadCsv(
        'sales-orders.csv',
        orders.map((o) => ({
          id: o.id,
          customerId: o.customerId,
          status: o.status,
          total: o.totalAmount,
          paymentStatus: o.paymentStatus,
          createdAt: o.createdAt,
        }))
      );
      toast('CSV exported', 'success');
    } catch {
      toast('Export failed', 'error');
    } finally {
      setBusy('');
    }
  }

  async function exportInventory() {
    setBusy('inv');
    try {
      const products = await fetchProducts({ sort: 'name_asc' });
      downloadCsv(
        'inventory-products.csv',
        products.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price,
          rating: p.rating,
          active: p.active,
        }))
      );
      toast('CSV exported', 'success');
    } catch {
      toast('Export failed', 'error');
    } finally {
      setBusy('');
    }
  }

  async function exportCustomers() {
    setBusy('cust');
    try {
      const list = await fetchAdminProfiles();
      downloadCsv(
        'customers.csv',
        list.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          phone: u.phone,
          role: u.role,
          accountStatus: u.accountStatus,
        }))
      );
      toast('CSV exported', 'success');
    } catch {
      toast('Export failed', 'error');
    } finally {
      setBusy('');
    }
  }

  async function exportRefunds() {
    setBusy('pay');
    try {
      const list = await fetchAdminPayments();
      const refunds = list.filter((p) => p.status === 'REFUNDED');
      downloadCsv(
        'refunds.csv',
        refunds.map((p) => ({
          id: p.id,
          orderId: p.orderId,
          amount: p.amount,
          status: p.status,
          createdAt: p.createdAt,
        }))
      );
      toast('CSV exported', 'success');
    } catch {
      toast('Export failed', 'error');
    } finally {
      setBusy('');
    }
  }

  const cards = [
    { title: 'Sales report', desc: 'All orders with totals and status.', onCsv: exportSales, key: 'sales' },
    { title: 'Inventory report', desc: 'Active catalog snapshot.', onCsv: exportInventory, key: 'inv' },
    { title: 'Customer report', desc: 'Profiles + governance flags.', onCsv: exportCustomers, key: 'cust' },
    { title: 'Refund report', desc: 'Payments in REFUNDED state.', onCsv: exportRefunds, key: 'pay' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Reports</h1>
      <p className="text-slate-400 text-sm mb-8">Download spreadsheet-friendly CSV reports for your records.</p>
      <div className="grid sm:grid-cols-2 gap-6">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-white">{c.title}</h2>
            <p className="text-sm text-slate-400 flex-1 mt-2">{c.desc}</p>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                disabled={busy === c.key}
                onClick={c.onCsv}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" /> CSV
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-600 text-slate-300 text-sm font-semibold"
                onClick={() => window.print()}
              >
                <FileText className="w-4 h-4" /> Print / PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
