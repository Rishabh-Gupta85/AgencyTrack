import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OrderItem, OrderSource } from '../types';
import { ShoppingCart, Plus, Trash2, AlertCircle, Building2, Store } from 'lucide-react';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (orderId: string) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose, onOrderCreated }) => {
  const { retailers, items, addSalesOrder, generateInvoiceForOrder } = useApp();

  const [selectedRetailerId, setSelectedRetailerId] = useState<string>(retailers[0]?.id || '');
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');
  const [itemQty, setItemQty] = useState<number>(1);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [source, setSource] = useState<OrderSource>('WhatsApp');
  const [notes, setNotes] = useState<string>('');
  const [autoGenerateInvoice, setAutoGenerateInvoice] = useState<boolean>(true);

  if (!isOpen) return null;

  const currentRetailer = retailers.find(r => r.id === selectedRetailerId);
  const currentItem = items.find(i => i.id === selectedItemId);

  // Add line item
  const handleAddLineItem = () => {
    if (!currentItem || itemQty <= 0) return;

    const existingIndex = orderItems.findIndex(oi => oi.itemId === currentItem.id);
    const lineTotal = itemQty * currentItem.sellingPrice;

    if (existingIndex >= 0) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += itemQty;
      updated[existingIndex].total = updated[existingIndex].quantity * currentItem.sellingPrice;
      setOrderItems(updated);
    } else {
      const newLineItem: OrderItem = {
        itemId: currentItem.id,
        itemName: currentItem.name,
        sku: currentItem.sku,
        agencyId: currentItem.agencyId,
        quantity: itemQty,
        unit: currentItem.unit,
        unitPrice: currentItem.sellingPrice,
        unitCost: currentItem.costPrice,
        taxPercent: currentItem.taxPercent,
        total: lineTotal,
      };
      setOrderItems([...orderItems, newLineItem]);
    }

    setItemQty(1);
  };

  const handleRemoveLineItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = Math.round(
    orderItems.reduce((sum, item) => sum + (item.total * item.taxPercent) / 100, 0)
  );
  const grandTotal = Math.max(0, subtotal + taxAmount - discount);
  const totalCost = orderItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const estimatedProfit = grandTotal - totalCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRetailer || orderItems.length === 0) {
      alert('Please add at least one item to the order.');
      return;
    }

    const created = addSalesOrder({
      retailerId: currentRetailer.id,
      retailerName: currentRetailer.ownerName,
      retailerStore: currentRetailer.storeName,
      retailerWhatsapp: currentRetailer.whatsapp,
      items: orderItems,
      subtotal,
      taxAmount,
      discount,
      grandTotal,
      totalCost,
      estimatedProfit,
      status: 'Confirmed',
      paymentStatus: 'Pending',
      paidAmount: 0,
      source,
      notes,
    });

    if (autoGenerateInvoice) {
      generateInvoiceForOrder(created.id);
    }

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
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Create New Retailer Order</h3>
              <p className="text-xs text-slate-500">Add products from multiple agencies into one dispatch</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Retailer Select */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-indigo-600" />
                Select Ordering Retailer
              </label>
              {currentRetailer && (
                <span className="text-[11px] text-slate-500">
                  WA: <span className="font-semibold text-slate-700">{currentRetailer.whatsapp}</span>
                </span>
              )}
            </div>

            <select
              value={selectedRetailerId}
              onChange={e => setSelectedRetailerId(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
            >
              {retailers.map(r => (
                <option key={r.id} value={r.id}>
                  {r.storeName} — {r.ownerName} ({r.city})
                </option>
              ))}
            </select>

            {currentRetailer && (
              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600">
                <span>
                  Outstanding Balance:{' '}
                  <span className="font-bold text-amber-700">
                    ₹{currentRetailer.outstandingBalance.toLocaleString()}
                  </span>
                </span>
                <span>
                  Credit Limit: ₹{currentRetailer.creditLimit.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Add Line Items Section */}
          <div className="border border-slate-200 rounded-xl p-3.5 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs flex items-center justify-between">
              <span>Add Catalog Items to Order</span>
              <span className="text-[11px] font-normal text-slate-500">Stock on hand dynamically tracked</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              <div className="sm:col-span-8">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Select Product</label>
                <select
                  value={selectedItemId}
                  onChange={e => setSelectedItemId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                >
                  {items.map(it => (
                    <option key={it.id} value={it.id}>
                      {it.name} — ₹{it.sellingPrice}/{it.unit} [{it.agencyName.slice(0, 12)}...] (Stock: {it.stockOnHand})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Qty</label>
                <input
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={e => setItemQty(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-xl text-center font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Added Items Table */}
            {orderItems.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-3">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3">Price</th>
                      <th className="py-2 px-3">Tax</th>
                      <th className="py-2 px-3">Total</th>
                      <th className="py-2 px-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orderItems.map((oi, index) => (
                      <tr key={index}>
                        <td className="py-2 px-3 font-semibold text-slate-800">{oi.itemName}</td>
                        <td className="py-2 px-3 font-bold">
                          {oi.quantity} {oi.unit}
                        </td>
                        <td className="py-2 px-3">₹{oi.unitPrice}</td>
                        <td className="py-2 px-3 text-slate-500">{oi.taxPercent}%</td>
                        <td className="py-2 px-3 font-bold text-slate-900">₹{oi.total.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(index)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
              <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                No items added yet. Select a product above and click "Add".
              </div>
            )}
          </div>

          {/* Order Meta & Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Order Placement Source</label>
              <select
                value={source}
                onChange={e => setSource(e.target.value as OrderSource)}
                className="w-full p-2 border border-slate-300 rounded-xl font-semibold"
              >
                <option value="WhatsApp">WhatsApp Message</option>
                <option value="Phone Call">Phone Call</option>
                <option value="Chat">Chat / SMS</option>
                <option value="In-Person">In-Person Walk-in</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Special Discount (₹)</label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-xl font-bold"
              />
            </div>
          </div>

          {/* Financial Calculation Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-right font-semibold">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal:</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Estimated GST / Tax:</span>
              <span>₹{taxAmount.toLocaleString()}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount Applied:</span>
                <span>-₹{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-900 text-sm font-black border-t border-slate-200 pt-1.5">
              <span>Grand Total Payable:</span>
              <span>₹{grandTotal.toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-emerald-600 pt-0.5">
              Estimated Gross Margin: ₹{estimatedProfit.toLocaleString()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto-invoice-checkbox"
              checked={autoGenerateInvoice}
              onChange={e => setAutoGenerateInvoice(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="auto-invoice-checkbox" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Automatically generate GST Tax Invoice & Bill for this order
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={orderItems.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs cursor-pointer"
            >
              Confirm Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
