import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PurchaseOrder, Item } from '../types';
import {
  Truck,
  Plus,
  MessageSquare,
  CheckCircle2,
  Building2,
  Clock,
  PackageCheck,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { openWhatsAppChat, formatAgencyPOMessage } from '../utils/whatsapp';

export const PurchaseOrdersView: React.FC = () => {
  const {
    purchaseOrders,
    agencies,
    items,
    selectedAgencyFilter,
    setSelectedAgencyFilter,
    addPurchaseOrder,
    updatePurchaseOrderStatus,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New PO State
  const [poAgencyId, setPoAgencyId] = useState<string>(agencies[0]?.id || '');
  const [poItems, setPoItems] = useState<Array<{ itemId: string; quantity: number }>>([]);
  const [poNotes, setPoNotes] = useState<string>('Please dispatch with morning logistics tempo.');
  const [expectedDays, setExpectedDays] = useState<number>(2);

  const selectedAgency = agencies.find(a => a.id === poAgencyId);
  const agencyCatalog = items.filter(i => i.agencyId === poAgencyId);
  const lowStockInAgency = agencyCatalog.filter(i => i.stockOnHand <= i.reorderLevel);

  // Filter existing POs
  const filteredPOs = purchaseOrders.filter(po => {
    if (selectedAgencyFilter !== 'all' && po.agencyId !== selectedAgencyFilter) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        po.poNumber.toLowerCase().includes(q) ||
        po.agencyName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Add line item to draft PO
  const handleToggleOrUpdatePoItem = (itemId: string, qty: number) => {
    const existing = poItems.find(p => p.itemId === itemId);
    if (existing) {
      if (qty <= 0) {
        setPoItems(poItems.filter(p => p.itemId !== itemId));
      } else {
        setPoItems(poItems.map(p => (p.itemId === itemId ? { ...p, quantity: qty } : p)));
      }
    } else if (qty > 0) {
      setPoItems([...poItems, { itemId, quantity: qty }]);
    }
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgency || poItems.length === 0) {
      alert('Please select at least one item to order from the agency.');
      return;
    }

    const builtItems = poItems.map(pi => {
      const itemObj = items.find(i => i.id === pi.itemId)!;
      return {
        itemId: itemObj.id,
        itemName: itemObj.name,
        sku: itemObj.sku,
        quantity: pi.quantity,
        unit: itemObj.unit,
        unitCost: itemObj.costPrice,
        total: pi.quantity * itemObj.costPrice,
      };
    });

    const totalAmount = builtItems.reduce((sum, it) => sum + it.total, 0);
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + expectedDays);

    const createdPO = addPurchaseOrder({
      agencyId: selectedAgency.id,
      agencyName: selectedAgency.name,
      agencyWhatsapp: selectedAgency.whatsapp,
      items: builtItems,
      totalAmount,
      status: 'Sent via WhatsApp',
      expectedDeliveryDate: expDate.toISOString().split('T')[0],
      notes: poNotes,
    });

    // Automatically prompt or open WhatsApp for immediate supplier order dispatch
    const msg = formatAgencyPOMessage(createdPO);
    openWhatsAppChat(createdPO.agencyWhatsapp, msg);

    setShowCreateModal(false);
    setPoItems([]);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600" />
            Agency Purchase Orders (Stock Replenishment)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Order stock from the 5 wholesale agencies via WhatsApp. Received orders deposit stock directly into inventory.
          </p>
        </div>

        <button
          onClick={() => {
            setPoAgencyId(agencies[0]?.id || '');
            setPoItems([]);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Order Stock from Agency</span>
        </button>
      </div>

      {/* Agency PO Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search PO number or Agency..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <select
              value={selectedAgencyFilter}
              onChange={e => setSelectedAgencyFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="all">🏢 All 5 Agencies</option>
              {agencies.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredPOs.length} Purchase Orders
          </span>
        </div>

        {/* PO Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/60">
                <th className="py-3 px-3">PO Number</th>
                <th className="py-3 px-3">Supplying Agency</th>
                <th className="py-3 px-3">Items Ordered</th>
                <th className="py-3 px-3">Total Cost Value</th>
                <th className="py-3 px-3">Order Date</th>
                <th className="py-3 px-3">Expected Delivery</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                filteredPOs.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{po.poNumber}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-indigo-700">{po.agencyName}</div>
                      <div className="text-[10px] text-slate-500">WA: {po.agencyWhatsapp}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">
                        {po.items.reduce((s, i) => s + i.quantity, 0)} total units
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">
                        {po.items.map(i => `${i.quantity}x ${i.itemName.split(' ')[0]}`).join(', ')}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-900">
                      ₹{(po.totalAmount ?? po.totalCost ?? 0).toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-slate-600">{po.createdAt.split('T')[0]}</td>

                    <td className="py-3 px-3 text-slate-700 font-medium">{po.expectedDeliveryDate}</td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          po.status === 'Received'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : po.status === 'Confirmed'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Resend via WhatsApp */}
                        <button
                          onClick={() => {
                            const msg = formatAgencyPOMessage(po);
                            openWhatsAppChat(po.agencyWhatsapp, msg);
                          }}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                          title="Send PO to Agency via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        </button>

                        {/* Mark Stock Received (Increases Stock on Hand!) */}
                        {po.status !== 'Received' ? (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Confirm receipt of goods for ${po.poNumber}? This will automatically increase physical stock in inventory for all ${po.items.length} items.`
                                )
                              ) {
                                updatePurchaseOrderStatus(po.id, 'Received');
                              }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Stock In</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Deposited
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Purchase Order to Agency */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Order Stock from Agency</h3>
                  <p className="text-xs text-slate-500">Send wholesale replenishment PO via WhatsApp</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-4 text-xs">
              {/* Select Agency */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  Select Target Agency Supplier
                </label>
                <select
                  value={poAgencyId}
                  onChange={e => {
                    setPoAgencyId(e.target.value);
                    setPoItems([]);
                  }}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  {agencies.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {a.category} (Lead Time: {a.leadTimeDays}d)
                    </option>
                  ))}
                </select>

                {selectedAgency && (
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                    <span>
                      Contact: {selectedAgency.contactPerson} ({selectedAgency.whatsapp})
                    </span>
                    <span>Terms: {selectedAgency.paymentTerms}</span>
                  </div>
                )}
              </div>

              {/* Agency Catalog Items Picker */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    Products Supplied by {selectedAgency?.name}
                  </span>
                  {lowStockInAgency.length > 0 && (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      {lowStockInAgency.length} Low Stock Recommended
                    </span>
                  )}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {agencyCatalog.map(item => {
                    const currentEntry = poItems.find(p => p.itemId === item.id);
                    const qty = currentEntry?.quantity || 0;
                    const isLow = item.stockOnHand <= item.reorderLevel;

                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                          qty > 0
                            ? 'bg-indigo-50/50 border-indigo-300'
                            : isLow
                            ? 'bg-rose-50/40 border-rose-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span>Cost: ₹{item.costPrice}</span>
                            <span>•</span>
                            <span
                              className={isLow ? 'font-bold text-rose-600' : 'text-slate-600'}
                            >
                              Stock: {item.stockOnHand} {item.unit} (Reorder: {item.reorderLevel})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-semibold text-slate-500">Order Qty:</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={qty || ''}
                            onChange={e =>
                              handleToggleOrUpdatePoItem(item.id, Number(e.target.value))
                            }
                            className="w-20 p-1.5 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-[11px] font-medium text-slate-500">{item.unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between font-bold">
                <span className="text-slate-700">
                  Total Order Value ({poItems.reduce((s, i) => s + i.quantity, 0)} units):
                </span>
                <span className="text-base text-slate-900">
                  ₹
                  {poItems
                    .reduce((sum, pi) => {
                      const itm = items.find(i => i.id === pi.itemId);
                      return sum + (itm ? itm.costPrice * pi.quantity : 0);
                    }, 0)
                    .toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Expected Delivery (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={expectedDays}
                    onChange={e => setExpectedDays(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Instructions / Notes for Agency
                  </label>
                  <input
                    type="text"
                    value={poNotes}
                    onChange={e => setPoNotes(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={poItems.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send PO via WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
