import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { parseWhatsAppOrderText, openWhatsAppChat, formatRetailerOrderMessage } from '../utils/whatsapp';
import { MessageSquare, Sparkles, CheckCircle2, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { OrderItem } from '../types';

interface WhatsAppOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (orderId: string) => void;
}

const SAMPLE_WHATSAPP_TEXTS = [
  'Namaste bhai, please send 10 cases Frooti and 5 boxes Maggi today to Shree Ganesh Traders.',
  'Bhai kal subah 12 pack fortune refined oil aur 8 box surf excel bhej dena - Gupta Super Market',
  'Send 15 boxes parle-g and 10 pouches aashirvaad atta urgently. Rajesh Store.',
];

export const WhatsAppOrderModal: React.FC<WhatsAppOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  const { retailers, items, addSalesOrder, generateInvoiceForOrder } = useApp();

  const [rawText, setRawText] = useState('');
  const [selectedRetailerId, setSelectedRetailerId] = useState<string>(retailers[0]?.id || '');
  const [parsedItems, setParsedItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [autoInvoice, setAutoInvoice] = useState(true);
  const [hasParsed, setHasParsed] = useState(false);

  if (!isOpen) return null;

  const currentRetailer = retailers.find(r => r.id === selectedRetailerId);

  // Trigger parsing
  const handleParse = (textToParse: string) => {
    const text = textToParse || rawText;
    if (!text.trim()) return;

    const result = parseWhatsAppOrderText(text, items, retailers);

    if (result.retailerId) {
      setSelectedRetailerId(result.retailerId);
    }

    // Convert parsed items to full OrderItem schema
    const structured: OrderItem[] = result.matchedItems.map(p => {
      const lineTotal = p.quantity * p.item.sellingPrice;
      return {
        itemId: p.item.id,
        itemName: p.item.name,
        sku: p.item.sku,
        agencyId: p.item.agencyId,
        quantity: p.quantity,
        unit: p.item.unit,
        unitPrice: p.item.sellingPrice,
        unitCost: p.item.costPrice,
        taxPercent: p.item.taxPercent,
        total: lineTotal,
      };
    });

    setParsedItems(structured);
    setNotes(result.notes || 'Parsed from WhatsApp message');
    setHasParsed(true);
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setParsedItems(parsedItems.filter((_, i) => i !== index));
    } else {
      const updated = [...parsedItems];
      updated[index].quantity = newQty;
      updated[index].total = newQty * updated[index].unitPrice;
      setParsedItems(updated);
    }
  };

  const subtotal = parsedItems.reduce((sum, it) => sum + it.total, 0);
  const taxAmount = Math.round(
    parsedItems.reduce((sum, it) => sum + (it.total * it.taxPercent) / 100, 0)
  );
  const grandTotal = Math.max(0, subtotal + taxAmount - discount);
  const totalCost = parsedItems.reduce((sum, it) => sum + it.quantity * it.unitCost, 0);
  const estimatedProfit = grandTotal - totalCost;

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRetailer || parsedItems.length === 0) {
      alert('Please parse or add items before confirming.');
      return;
    }

    const created = addSalesOrder({
      retailerId: currentRetailer.id,
      retailerName: currentRetailer.ownerName,
      retailerStore: currentRetailer.storeName,
      retailerWhatsapp: currentRetailer.whatsapp,
      items: parsedItems,
      subtotal,
      taxAmount,
      discount,
      grandTotal,
      totalCost,
      estimatedProfit,
      status: 'Confirmed',
      paymentStatus: 'Pending',
      paidAmount: 0,
      source: 'WhatsApp',
      notes,
      rawWhatsAppText: rawText,
    });

    if (autoInvoice) {
      generateInvoiceForOrder(created.id);
    }

    // Pre-open WhatsApp confirmation chat
    const confirmMsg = formatRetailerOrderMessage(created);
    openWhatsAppChat(created.retailerWhatsapp, confirmMsg);

    onClose();
    if (onOrderCreated) {
      onOrderCreated(created.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">WhatsApp Smart Order Ingestion</h3>
              <p className="text-xs text-slate-500">
                Paste raw chat text to auto-convert into sales orders, stock deductions, and bills
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
            ✕
          </button>
        </div>

        {/* Input Form */}
        <div className="space-y-3 text-xs">
          {/* Sample quick buttons */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500">Quick Test Samples:</span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_WHATSAPP_TEXTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setRawText(sample);
                    handleParse(sample);
                  }}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-left truncate max-w-xs"
                >
                  Sample #{idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-800 block mb-1">
              Paste WhatsApp Message Text from Retailer:
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Namaste sir, please dispatch 10 cases frooti, 5 boxes maggi to Gupta Store..."
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handleParse(rawText)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Parse Products & Quantities</span>
            </button>
          </div>

          {/* Parsed Result Display */}
          {hasParsed && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">
                  Detected Products ({parsedItems.length})
                </span>
                <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Matched with Multi-Agency Catalog
                </span>
              </div>

              {/* Retailer Selector */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <label className="font-bold text-slate-800 block">Matched Retailer:</label>
                <select
                  value={selectedRetailerId}
                  onChange={e => setSelectedRetailerId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900"
                >
                  {retailers.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.storeName} — {r.ownerName} ({r.whatsapp})
                    </option>
                  ))}
                </select>
              </div>

              {/* Products Table */}
              {parsedItems.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="py-2 px-3">Item Name</th>
                        <th className="py-2 px-3">Quantity</th>
                        <th className="py-2 px-3">Rate</th>
                        <th className="py-2 px-3">Total</th>
                        <th className="py-2 px-2 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-semibold text-slate-900">{item.itemName}</td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => handleUpdateQty(idx, Number(e.target.value))}
                              className="w-16 p-1 border border-slate-300 rounded-lg text-center font-bold"
                            />{' '}
                            <span className="text-slate-500 text-[11px]">{item.unit}</span>
                          </td>
                          <td className="py-2 px-3">₹{item.unitPrice}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">
                            ₹{item.total.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(idx, 0)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-center">
                  Could not find exact product names. Please check product catalog or enter manually.
                </div>
              )}

              {/* Financial Box */}
              {parsedItems.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-right font-semibold border border-slate-200">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (Tax):</span>
                    <span>₹{taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 text-sm font-black border-t border-slate-200 pt-1.5">
                    <span>Order Grand Total:</span>
                    <span>₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Auto Invoice Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modal-auto-invoice"
                  checked={autoInvoice}
                  onChange={e => setAutoInvoice(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-sm cursor-pointer"
                />
                <label
                  htmlFor="modal-auto-invoice"
                  className="text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Generate Tax Invoice & Bill and open WhatsApp confirmation immediately
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={parsedItems.length === 0}
                  onClick={handleConfirmOrder}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Confirm Order & Send Bill</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
