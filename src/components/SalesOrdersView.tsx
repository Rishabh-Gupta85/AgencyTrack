import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SalesOrder, OrderItem, OrderStatus, OrderSource } from '../types';
import {
  ShoppingCart,
  Search,
  Plus,
  MessageSquare,
  Receipt,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  AlertCircle,
  Eye,
  Trash2,
} from 'lucide-react';
import { openWhatsAppChat, formatRetailerOrderMessage } from '../utils/whatsapp';

interface SalesOrdersViewProps {
  onOpenNewOrderModal: () => void;
  onOpenInvoice: (invoiceId: string) => void;
}

export const SalesOrdersView: React.FC<SalesOrdersViewProps> = ({
  onOpenNewOrderModal,
  onOpenInvoice,
}) => {
  const {
    salesOrders,
    retailers,
    items,
    updateSalesOrderStatus,
    generateInvoiceForOrder,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRetailerFilter, setSelectedRetailerFilter] = useState<string>('all');
  const [activeOrderDetail, setActiveOrderDetail] = useState<SalesOrder | null>(null);

  // Filter orders
  const filteredOrders = salesOrders.filter(order => {
    if (selectedStatus !== 'all' && order.status !== selectedStatus) {
      return false;
    }
    if (selectedRetailerFilter !== 'all' && order.retailerId !== selectedRetailerFilter) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.retailerStore.toLowerCase().includes(q) ||
        order.retailerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Packed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Dispatched':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'Draft':
        return 'Confirmed';
      case 'Confirmed':
        return 'Packed';
      case 'Packed':
        return 'Dispatched';
      case 'Dispatched':
        return 'Delivered';
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-indigo-600" />
            Retailer Sales Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage incoming orders from WhatsApp, phone, and store walk-ins. Auto-deduct stock upon dispatch.
          </p>
        </div>

        <button
          onClick={onOpenNewOrderModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Sales Order</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order # or store..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Retailer Filter */}
            <select
              value={selectedRetailerFilter}
              onChange={e => setSelectedRetailerFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="all">🏪 All Retail Stores</option>
              {retailers.map(r => (
                <option key={r.id} value={r.id}>
                  {r.storeName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto w-full md:w-auto">
            {['all', 'Confirmed', 'Packed', 'Dispatched', 'Delivered'].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer capitalize whitespace-nowrap ${
                  selectedStatus === st ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                {st === 'all' ? 'All Orders' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/60">
                <th className="py-3 px-3">Order Number</th>
                <th className="py-3 px-3">Retailer Store</th>
                <th className="py-3 px-3">Items & Qty</th>
                <th className="py-3 px-3">Order Total</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Status Pipeline</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No orders found matching filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const nextStatus = getNextStatus(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Order Number */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{order.orderNumber}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString()} at{' '}
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Store */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{order.retailerStore}</div>
                        <div className="text-[11px] text-slate-500">{order.retailerName}</div>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">
                          {order.items.map(i => `${i.quantity}x ${i.itemName.split(' ')[0]}`).join(', ')}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3">
                        <div className="font-black text-slate-900">₹{(order.grandTotal || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          Profit: ~₹{(order.estimatedProfit || 0).toLocaleString()}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                          {nextStatus && (
                            <button
                              onClick={() => updateSalesOrderStatus(order.id, nextStatus)}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                              title={`Advance to ${nextStatus}`}
                            >
                              ➔ Mark {nextStatus}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-3">
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                          {order.source}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send WhatsApp Order update */}
                          <button
                            onClick={() => {
                              const msg = formatRetailerOrderMessage(order);
                              openWhatsAppChat(order.retailerWhatsapp, msg);
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                            title="Send order update to Retailer on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          </button>

                          {/* Invoice / Bill */}
                          <button
                            onClick={() => {
                              const inv = generateInvoiceForOrder(order.id);
                              onOpenInvoice(inv.id);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
                            title="Generate or view bill"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>{order.invoiceId ? 'View Bill' : 'Create Bill'}</span>
                          </button>

                          {/* View Order Details */}
                          <button
                            onClick={() => setActiveOrderDetail(order)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Inspect Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {activeOrderDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Order Details: {activeOrderDetail.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Store: {activeOrderDetail.retailerStore} ({activeOrderDetail.retailerName})
                </p>
              </div>
              <button
                onClick={() => setActiveOrderDetail(null)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Order Meta */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <div>
                  <span className="text-slate-500">Created:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {new Date(activeOrderDetail.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Status:</span>{' '}
                  <span className="font-bold text-indigo-700">{activeOrderDetail.status}</span>
                </div>
                <div>
                  <span className="text-slate-500">Payment:</span>{' '}
                  <span className="font-bold text-emerald-700">{activeOrderDetail.paymentStatus}</span>
                </div>
                <div>
                  <span className="text-slate-500">Source:</span>{' '}
                  <span className="font-semibold text-slate-800">{activeOrderDetail.source}</span>
                </div>
              </div>

              {/* Raw WhatsApp text if parsed */}
              {activeOrderDetail.rawWhatsAppText && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                  <div className="font-semibold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                    Original WhatsApp Text from Retailer:
                  </div>
                  <p className="font-mono text-[11px] text-emerald-800 italic">
                    "{activeOrderDetail.rawWhatsAppText}"
                  </p>
                </div>
              )}

              {/* Items Breakdown */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Itemized Products</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <th className="py-2 px-3">Item</th>
                        <th className="py-2 px-3">Quantity</th>
                        <th className="py-2 px-3">Unit Price</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeOrderDetail.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-semibold text-slate-900">{it.itemName}</td>
                          <td className="py-2 px-3">
                            {it.quantity} {it.unit}
                          </td>
                          <td className="py-2 px-3">₹{it.unitPrice}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            ₹{(it.total || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-right font-semibold">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{(activeOrderDetail.subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax:</span>
                  <span>₹{(activeOrderDetail.taxAmount || 0).toLocaleString()}</span>
                </div>
                {(activeOrderDetail.discount || 0) > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-₹{(activeOrderDetail.discount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 text-sm font-black border-t border-slate-200 pt-1.5">
                  <span>Grand Total:</span>
                  <span>₹{(activeOrderDetail.grandTotal || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    const msg = formatRetailerOrderMessage(activeOrderDetail);
                    openWhatsAppChat(activeOrderDetail.retailerWhatsapp, msg);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send WhatsApp Update</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const inv = generateInvoiceForOrder(activeOrderDetail.id);
                      setActiveOrderDetail(null);
                      onOpenInvoice(inv.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>View Bill</span>
                  </button>
                  <button
                    onClick={() => setActiveOrderDetail(null)}
                    className="px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
