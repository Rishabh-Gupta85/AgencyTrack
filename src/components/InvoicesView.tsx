import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice } from '../types';
import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Eye,
  Printer,
  X,
  Download,
} from 'lucide-react';
import { DateFilterDropdown, DatePreset } from './DateFilterDropdown';
import { isWithinRange } from '../utils/dateFilter';
import { exportToCsv } from '../utils/exportUtils';
import { InvoiceModal } from './InvoiceModal';

interface InvoicesViewProps {
  onOpenInvoiceDetail?: (invoice: Invoice) => void;
  onOpenNewOrder?: () => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = () => {
  const {
    invoices,
    retailers,
    recordInvoicePayment,
    currentUser,
  } = useApp();

  const isStaff = currentUser?.role === 'staff';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Date Filter State
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStart, setCustomStart] = useState<string | null>(null);
  const [customEnd, setCustomEnd] = useState<string | null>(null);

  // Modal states
  const [activeInvoiceForModal, setActiveInvoiceForModal] = useState<Invoice | null>(null);
  const [activeInvoiceForPayment, setActiveInvoiceForPayment] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque'>('upi');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Stats calculation
  const totalInvoiced = invoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + (i.paidAmount || (i.status === 'Paid' ? i.grandTotal : 0)), 0);
  const totalPending = Math.max(0, totalInvoiced - totalPaid);
  const totalOverdue = invoices
    .filter(i => i.status === 'Overdue')
    .reduce((sum, i) => sum + (i.balanceDue ?? i.grandTotal ?? 0), 0);

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.orderNumber.toLowerCase().includes(q) ||
        inv.retailerName.toLowerCase().includes(q) ||
        inv.retailerStore.toLowerCase().includes(q);
      if (!match) return false;
    }
    // Retailer filter
    if (selectedRetailer !== 'all' && inv.retailerId !== selectedRetailer) {
      return false;
    }
    // Status filter
    if (selectedStatus !== 'all' && inv.status.toLowerCase() !== selectedStatus.toLowerCase()) {
      return false;
    }
    // Date filter
    if (inv.issueDate && !isWithinRange(inv.issueDate, datePreset, customStart, customEnd)) {
      return false;
    }
    return true;
  });

  const handleOpenPayment = (inv: Invoice) => {
    setActiveInvoiceForPayment(inv);
    setPaymentAmount(inv.balanceDue ?? inv.grandTotal);
    setPaymentRef('');
    setPaymentNotes('');
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoiceForPayment || isStaff) return;

    recordInvoicePayment(
      activeInvoiceForPayment.id,
      paymentAmount
    );

    setActiveInvoiceForPayment(null);
  };

  const handleExportInvoices = () => {
    if (isStaff) return;
    const exportData = filteredInvoices.map(inv => ({
      'Invoice Number': inv.invoiceNumber,
      'Order Number': inv.orderNumber,
      'Retailer Store': inv.retailerStore,
      'Retailer Name': inv.retailerName,
      'Issue Date': inv.issueDate,
      'Due Date': inv.dueDate,
      'Status': inv.status,
      'Subtotal (₹)': inv.subtotal,
      'GST Tax (₹)': inv.taxAmount,
      'Discount (₹)': inv.discount || 0,
      'Grand Total (₹)': inv.grandTotal,
      'Paid Amount (₹)': inv.paidAmount || (inv.status === 'Paid' ? inv.grandTotal : 0),
      'Balance Due (₹)': inv.balanceDue ?? (inv.status === 'Paid' ? 0 : inv.grandTotal),
    }));
    exportToCsv(exportData, `invoices_export_${new Date().toISOString().slice(0, 10)}`);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
            Paid
          </span>
        );
      case 'Overdue':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
            Overdue
          </span>
        );
      case 'Unpaid':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
            Unpaid
          </span>
        );
      case 'Partially Paid':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
            Partially Paid
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Invoices</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage retailer invoices and track GST payment collections
            {isStaff && <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400">(Restricted Staff View)</span>}
          </p>
        </div>

        {!isStaff && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportInvoices}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Invoiced</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {isStaff ? '••••••' : `₹${(totalInvoiced || 0).toLocaleString()}`}
          </div>
        </div>

        {/* Paid */}
        <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Paid Amount</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {isStaff ? '••••••' : `₹${(totalPaid || 0).toLocaleString()}`}
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Collection</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {isStaff ? '••••••' : `₹${(totalPending || 0).toLocaleString()}`}
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Overdue Invoices</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {isStaff ? '••••••' : `₹${(totalOverdue || 0).toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* Controls Bar: Search, Date Filter & Retailer/Status filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search invoices by number, store, order ref..."
            className="w-full bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors shadow-2xs"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <DateFilterDropdown
            selectedPreset={datePreset}
            onSelectPreset={(preset, start, end) => {
              setDatePreset(preset);
              setCustomStart(start);
              setCustomEnd(end);
            }}
          />

          <select
            value={selectedRetailer}
            onChange={e => setSelectedRetailer(e.target.value)}
            className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-indigo-500 cursor-pointer shadow-2xs"
          >
            <option value="all">All Retailers</option>
            {retailers.map(r => (
              <option key={r.id} value={r.id}>
                {r.storeName}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-indigo-500 cursor-pointer shadow-2xs"
          >
            <option value="all">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1e2638] bg-slate-50 dark:bg-[#0f1522]">
                <th className="py-3 px-4 font-semibold">Invoice No</th>
                <th className="py-3 px-4 font-semibold">Order Ref</th>
                <th className="py-3 px-4 font-semibold">Retailer Store</th>
                <th className="py-3 px-4 font-semibold">Issue Date</th>
                <th className="py-3 px-4 font-semibold">Due Date</th>
                {!isStaff && <th className="py-3 px-4 font-semibold">Grand Total</th>}
                {!isStaff && <th className="py-3 px-4 font-semibold">Balance Due</th>}
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e2638]/60">
              {filteredInvoices.map(inv => {
                const balance = inv.balanceDue ?? (inv.status === 'Paid' ? 0 : inv.grandTotal);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-[#161d2c]/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 text-indigo-600 dark:text-indigo-400 font-medium">{inv.orderNumber}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{inv.retailerStore}</div>
                      <div className="text-[10px] text-slate-400">{inv.retailerName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{inv.issueDate}</td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{inv.dueDate}</td>
                    {!isStaff && (
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        ₹{(inv.grandTotal || 0).toLocaleString()}
                      </td>
                    )}
                    {!isStaff && (
                      <td className="py-3.5 px-4 font-bold">
                        <span className={balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          ₹{(balance || 0).toLocaleString()}
                        </span>
                      </td>
                    )}
                    <td className="py-3.5 px-4">{getStatusBadge(inv.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveInvoiceForModal(inv)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-[#1a2336] hover:bg-slate-200 dark:hover:bg-[#222e47] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#2b3752] rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-slate-400" />
                          <span>View & Print</span>
                        </button>
                        {!isStaff && inv.status !== 'Paid' && balance > 0 && (
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            <span>Pay</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {activeInvoiceForPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e2638]">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Record Invoice Payment</h2>
              <button
                onClick={() => setActiveInvoiceForPayment(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-[#0f1522] border border-slate-200 dark:border-[#1e2638] rounded-xl p-3.5 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeInvoiceForPayment.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Retailer:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{activeInvoiceForPayment.retailerStore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Bill:</span>
                <span className="font-bold text-slate-900 dark:text-white">₹{(activeInvoiceForPayment.grandTotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-[#1e2638] pt-1">
                <span className="text-rose-600 font-semibold">Balance Due:</span>
                <span className="font-bold text-rose-600">
                  ₹{((activeInvoiceForPayment.balanceDue ?? activeInvoiceForPayment.grandTotal) || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={activeInvoiceForPayment.balanceDue ?? activeInvoiceForPayment.grandTotal}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="upi">UPI / QR Code</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer (NEFT / IMPS)</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reference / Transaction ID
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                  placeholder="e.g. UPI-9876543210 or Cheque #12345"
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#1e2638]">
                <button
                  type="button"
                  onClick={() => setActiveInvoiceForPayment(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2336] dark:hover:bg-[#222e47] text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Render Full InvoiceModal for View & Print */}
      {activeInvoiceForModal && (
        <InvoiceModal
          invoice={activeInvoiceForModal}
          onClose={() => setActiveInvoiceForModal(null)}
        />
      )}
    </div>
  );
};
