import React, { useState } from 'react';
import { Invoice } from '../types';
import { useApp } from '../context/AppContext';
import { Printer, MessageSquare, CheckCircle2, QrCode, Building2, Store, CreditCard, X } from 'lucide-react';
import { openWhatsAppChat, formatRetailerInvoiceBill } from '../utils/whatsapp';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const { recordInvoicePayment } = useApp();
  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  if (!invoice) return null;

  const isPaid = invoice.status === 'Paid' || (invoice.balanceDue ?? 0) <= 0;

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;
    recordInvoicePayment(invoice.id, Number(paymentAmount));
    setShowPaymentInput(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const message = formatRetailerInvoiceBill(invoice);
    openWhatsAppChat(invoice.retailerWhatsapp, message);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-[#121824] rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-[#1e2638] overflow-hidden my-auto">
        {/* Top Control Bar (Hidden on print) */}
        <div className="no-print bg-slate-900 text-white p-3.5 px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Invoice {invoice.invoiceNumber}</span>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                isPaid
                  ? 'bg-emerald-500 text-white'
                  : invoice.status === 'Partially Paid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {isPaid ? 'PAID' : invoice.status.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Share to WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              title="Share pre-formatted bill to Retailer's WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Bill</span>
            </button>

            {/* Print / Save PDF */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            {/* Record Payment Toggle */}
            {!isPaid && (
              <button
                onClick={() => {
                  setPaymentAmount(invoice.balanceDue || invoice.grandTotal);
                  setShowPaymentInput(!showPaymentInput);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                + Record Payment
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Payment Recording Dropdown Form (no-print) */}
        {showPaymentInput && !isPaid && (
          <div className="no-print bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/40 p-3 px-6 flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-900 dark:text-amber-200">
              Balance Due: ₹{(invoice.balanceDue ?? invoice.grandTotal).toLocaleString()}
            </span>
            <form onSubmit={handleRecordPayment} className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={invoice.balanceDue || invoice.grandTotal}
                value={paymentAmount}
                onChange={e => setPaymentAmount(Number(e.target.value))}
                className="w-32 p-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-bold focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Confirm Payment
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentInput(false)}
                className="px-2 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Printable GST Invoice Body - styled for high clarity on screen and paper */}
        <div id="printable-invoice" className="p-6 sm:p-8 space-y-6 bg-white text-slate-900">
          {/* Header with Supplier details */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-base">
                  AH
                </div>
                <div>
                  <h2 className="font-black text-lg text-slate-900 tracking-tight leading-tight">
                    Agency Central Distribution Hub
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Wholesale FMCG & Commodity Multi-Agency Distribution</p>
                </div>
              </div>
              <div className="text-xs text-slate-600 mt-3 space-y-0.5 leading-relaxed">
                <p>Wholesale Logistics Depot, Central Industrial Corridor, Phase 2</p>
                <p>GSTIN: <span className="font-mono font-semibold text-slate-800">07AAACH0000A1Z9</span> | State Code: 07 (Delhi)</p>
                <p>Phone: +91 98200 00000 • Email: billing@agencyhub.example.com</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                TAX INVOICE
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-1">{invoice.invoiceNumber}</h1>
              <div className="text-xs text-slate-600 mt-2 space-y-1">
                <div>
                  <span className="text-slate-400">Order Ref:</span>{' '}
                  <span className="font-bold text-slate-800">{invoice.orderNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400">Issue Date:</span>{' '}
                  <span className="font-semibold text-slate-800">{invoice.issueDate}</span>
                </div>
                {/* Note: If paid, do NOT print payment due date or payment due warning */}
                {!isPaid ? (
                  <div>
                    <span className="text-slate-400">Payment Due Date:</span>{' '}
                    <span className="font-bold text-rose-700">{invoice.dueDate}</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-slate-400">Payment Status:</span>{' '}
                    <span className="font-bold text-emerald-600">PAID IN FULL</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bill To & Status Summary */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Billed To (Retailer / Consignee)
              </span>
              <h3 className="text-sm font-bold text-slate-900">{invoice.retailerStore}</h3>
              <p className="font-medium text-slate-700 mt-0.5">{invoice.retailerName}</p>
              <p className="text-slate-600 mt-1">{invoice.retailerAddress}</p>
              <p className="text-slate-600 mt-0.5">WhatsApp / Phone: {invoice.retailerWhatsapp}</p>
              {invoice.retailerGstin && (
                <p className="text-indigo-700 font-semibold mt-0.5">GSTIN: {invoice.retailerGstin}</p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Settlement Status
              </span>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Total:</span>
                  <span className="font-bold text-slate-900">₹{(invoice.grandTotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Received:</span>
                  <span className="font-bold text-emerald-700">₹{(invoice.paidAmount || (isPaid ? invoice.grandTotal : 0)).toLocaleString()}</span>
                </div>
                {/* Only print Balance Due when not paid */}
                {!isPaid ? (
                  <div className="flex justify-between border-t border-slate-200 pt-1.5">
                    <span className="font-bold text-slate-900">Balance Due:</span>
                    <span className="font-black text-sm text-rose-700">
                      ₹{(invoice.balanceDue ?? invoice.grandTotal).toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between border-t border-emerald-200 pt-1.5">
                    <span className="font-bold text-emerald-800">Status:</span>
                    <span className="font-bold text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      ✓ FULLY SETTLED (PAID)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Description of Goods</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                  <th className="py-2.5 px-3 text-center">GST %</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{item.itemName}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{item.sku || '-'}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right">₹{(item.unitPrice || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-center text-slate-600">{item.taxPercent || 5}%</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      ₹{(item.total || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Totals & Payment Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            {/* Bank & UPI Info */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Bank & Payment Details</span>
              </div>
              <div className="space-y-1 text-slate-600">
                <p>
                  <span className="font-semibold text-slate-700">UPI ID:</span>{' '}
                  <span className="font-mono font-bold text-indigo-700">{invoice.upiId}</span>
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Bank Name:</span>{' '}
                  {invoice.bankDetails?.bankName || 'HDFC Bank Ltd'}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Account No:</span>{' '}
                  <span className="font-mono">{invoice.bankDetails?.accountNumber || '50200088991122'}</span>
                </p>
                <p>
                  <span className="font-semibold text-slate-700">IFSC Code:</span>{' '}
                  <span className="font-mono">{invoice.bankDetails?.ifsc || 'HDFC0001234'}</span>
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Beneficiary:</span>{' '}
                  {invoice.bankDetails?.accountName || 'Agency Central Distribution Hub'}
                </p>
              </div>

              {/* Only show payment remark when NOT paid */}
              {!isPaid ? (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 font-medium">
                  Note: Please mention Invoice #{invoice.invoiceNumber} in UPI / Bank payment narration.
                </p>
              ) : (
                <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Payment received in full. No balance pending on this invoice.</span>
                </p>
              )}
            </div>

            {/* Calculations Box */}
            <div className="space-y-2 text-xs text-right font-semibold">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Subtotal:</span>
                <span>₹{(invoice.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Output GST:</span>
                <span>₹{(invoice.taxAmount || 0).toLocaleString()}</span>
              </div>
              {(invoice.discount || 0) > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount:</span>
                  <span>-₹{(invoice.discount || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 text-base font-black border-t-2 border-slate-900 pt-2">
                <span>Grand Total:</span>
                <span>₹{(invoice.grandTotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Amount Paid:</span>
                <span>-₹{(invoice.paidAmount || (isPaid ? invoice.grandTotal : 0)).toLocaleString()}</span>
              </div>

              {/* Crucial requirement: If status is 'Paid', do NOT print 'Payment Due' note */}
              {!isPaid ? (
                <div className="flex justify-between text-rose-700 text-sm font-black border-t border-slate-200 pt-1.5">
                  <span>Payment Due:</span>
                  <span>₹{(invoice.balanceDue ?? invoice.grandTotal).toLocaleString()}</span>
                </div>
              ) : (
                <div className="flex justify-between text-emerald-700 text-xs font-bold border-t border-slate-200 pt-1.5">
                  <span>Payment Status:</span>
                  <span>Paid in Full — Thank you!</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Terms & Signatory */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-end justify-between text-[11px] text-slate-500 gap-4">
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-700">Terms & Conditions:</p>
              <p>1. Goods once sold are subject to standard agency replacement policies.</p>
              <p>2. Subject to Delhi jurisdiction.</p>
              <p>3. This is a computer authenticated Tax Invoice.</p>
            </div>
            <div className="text-center sm:text-right">
              <div className="font-semibold text-slate-800 mb-8">For Agency Central Distribution Hub</div>
              <div className="border-t border-slate-300 pt-1 text-slate-600">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
