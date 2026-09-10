import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Agency, Item, PriceChange, PurchaseOrder } from '../types';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ExternalLink,
  ChevronRight,
  Edit2,
  Trash2,
  History,
  ShoppingCart,
  Send,
  Calendar,
  Layers,
} from 'lucide-react';
import { openWhatsAppChat, formatAgencyPOMessage } from '../utils/whatsapp';

export const AgenciesView: React.FC = () => {
  const {
    agencies,
    items,
    priceChanges,
    purchaseOrders,
    addAgency,
    updateAgency,
    deleteAgency,
    addPurchaseOrder,
    canManageAgencies,
    canCreateOrders,
    setSelectedAgencyFilter,
  } = useApp();

  const [selectedAgencyProfile, setSelectedAgencyProfile] = useState<Agency | null>(null);
  const [showAddAgencyModal, setShowAddAgencyModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);

  // Quick Order Modal from Agency Profile
  const [orderAgencyModal, setOrderAgencyModal] = useState<Agency | null>(null);
  const [orderItemsMap, setOrderItemsMap] = useState<{ [itemId: string]: number }>({});
  const [orderNotes, setOrderNotes] = useState('Stock replenishment ordered through WhatsApp.');

  // Form states for Add / Edit Agency
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    whatsapp: '+91 ',
    phone: '+91 ',
    email: '',
    contactPerson: '',
    address: '',
    paymentTerms: 'Net 15 Days',
    leadTimeDays: 2,
    rating: 4.8,
    notes: '',
  });

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      code: '',
      category: 'FMCG',
      whatsapp: '+91 ',
      phone: '+91 ',
      email: '',
      contactPerson: '',
      address: '',
      paymentTerms: 'Net 15 Days',
      leadTimeDays: 2,
      rating: 4.8,
      notes: '',
    });
    setShowAddAgencyModal(true);
  };

  const handleOpenEditModal = (agency: Agency, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAgency(agency);
    setFormData({
      name: agency.name,
      code: agency.code,
      category: agency.category,
      whatsapp: agency.whatsapp,
      phone: agency.phone,
      email: agency.email,
      contactPerson: agency.contactPerson,
      address: agency.address,
      paymentTerms: agency.paymentTerms,
      leadTimeDays: agency.leadTimeDays,
      rating: agency.rating,
      notes: agency.notes,
    });
  };

  const handleDeleteAgency = (agency: Agency, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete agency "${agency.name}"?`)) {
      deleteAgency(agency.id);
      if (selectedAgencyProfile?.id === agency.id) {
        setSelectedAgencyProfile(null);
      }
    }
  };

  const handleSaveAgency = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAgency) {
      updateAgency({
        ...editingAgency,
        ...formData,
      });
      setEditingAgency(null);
      if (selectedAgencyProfile?.id === editingAgency.id) {
        setSelectedAgencyProfile(prev => prev ? { ...prev, ...formData } : null);
      }
    } else {
      addAgency({
        ...formData,
        code: formData.code.toUpperCase() || formData.name.slice(0, 4).toUpperCase(),
        badgeColor: 'blue',
        rating: 4.8,
      });
      setShowAddAgencyModal(false);
    }
  };

  // Handle placing a direct PO with this agency
  const handlePlaceOrderWithAgency = (agency: Agency) => {
    const itemsToOrder = Object.entries(orderItemsMap)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([itemId, qty]) => {
        const item = items.find(i => i.id === itemId);
        const numericQty = Number(qty);
        return {
          itemId,
          itemName: item ? item.name : 'Item',
          sku: item ? item.sku : 'SKU',
          quantity: numericQty,
          unit: item ? item.unit : 'Carton',
          unitCost: item ? item.costPrice : 100,
          total: (item ? item.costPrice : 100) * numericQty,
        };
      });

    if (itemsToOrder.length === 0) return;

    const totalAmt = itemsToOrder.reduce((sum, i) => sum + i.total, 0);

    const createdPO = addPurchaseOrder({
      agencyId: agency.id,
      agencyName: agency.name,
      agencyWhatsapp: agency.whatsapp,
      items: itemsToOrder,
      totalAmount: totalAmt,
      status: 'Sent via WhatsApp',
      expectedDeliveryDate: new Date(Date.now() + 86400000 * agency.leadTimeDays).toISOString().split('T')[0],
      notes: orderNotes,
    });

    // Auto open WhatsApp with the drafted PO
    const msg = formatAgencyPOMessage(createdPO);
    openWhatsAppChat(agency.whatsapp, msg);

    setOrderAgencyModal(null);
    setOrderItemsMap({});
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Agencies & Suppliers
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Upstream FMCG suppliers and manufacturers I purchase wholesale stock from.
              </p>
            </div>
          </div>
        </div>

        {canManageAgencies && (
          <button
            id="btn-add-agency"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Agency</span>
          </button>
        )}
      </div>

      {/* Agency Cards Grid - Styled like user uploaded screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agencies.map(agency => {
          const agencyProducts = items.filter(i => i.agencyId === agency.id);
          const agencyPOs = purchaseOrders.filter(po => po.agencyId === agency.id);
          const pendingPOs = agencyPOs.filter(po => po.status !== 'Received' && po.status !== 'Cancelled');
          const totalOrders = agencyPOs.length > 0 ? agencyPOs.length : agency.totalOrdersCount;

          return (
            <div
              key={agency.id}
              onClick={() => setSelectedAgencyProfile(agency)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-purple-400 dark:hover:border-purple-500/60 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Top Row: Icon, Title, Contact, and Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold border border-purple-200 dark:border-purple-800/80">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {agency.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {agency.contactPerson}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  {canManageAgencies && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleOpenEditModal(agency, e)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Agency"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteAgency(agency, e)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Delete Agency"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Contact details */}
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-slate-700 dark:text-slate-300">{agency.phone || agency.whatsapp}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-700 dark:text-slate-300">{agency.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-700 dark:text-slate-300">{agency.address}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Footer Row matching screenshot */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {totalOrders} Orders
                  </span>
                  {pendingPOs.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      {pendingPOs.length} pending
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  <span>{agency.paymentTerms}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* DEDICATED AGENCY PROFILE MODAL                                            */}
      {/* Shows: 1) What product the agency sells to ME                             */}
      {/*        2) Purchase history with the particular agency                     */}
      {/* ========================================================================= */}
      {selectedAgencyProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-purple-600/20">
                  {selectedAgencyProfile.code}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-xl text-slate-900 dark:text-white">
                      {selectedAgencyProfile.name}
                    </h2>
                    <span className="text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                      {selectedAgencyProfile.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Contact: <strong className="text-slate-800 dark:text-slate-200">{selectedAgencyProfile.contactPerson}</strong> • Phone: {selectedAgencyProfile.phone} • Terms: {selectedAgencyProfile.paymentTerms}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canManageAgencies && (
                  <>
                    <button
                      onClick={(e) => handleOpenEditModal(selectedAgencyProfile, e)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      title="Edit Agency"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteAgency(selectedAgencyProfile, e)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      title="Delete Agency"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </>
                )}

                {canCreateOrders && (
                  <button
                    onClick={() => {
                      setOrderAgencyModal(selectedAgencyProfile);
                      // Pre-populate 0 qty
                      const initialMap: { [id: string]: number } = {};
                      items
                        .filter(i => i.agencyId === selectedAgencyProfile.id)
                        .forEach(i => {
                          initialMap[i.id] = i.stockOnHand <= i.reorderLevel ? 10 : 0;
                        });
                      setOrderItemsMap(initialMap);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Order Stock for ME</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedAgencyProfile(null)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* SECTION 1: WHAT PRODUCT THE AGENCY SELLS TO ME */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Products Sold to ME by {selectedAgencyProfile.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Items supplied to my distribution warehouse, wholesale cost price (what I pay), and selling price to retailers.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {items.filter(i => i.agencyId === selectedAgencyProfile.id).length} Products in Catalog
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3.5">Product & SKU</th>
                      <th className="py-2.5 px-3.5">Agency Cost (I Pay)</th>
                      <th className="py-2.5 px-3.5">Selling Price (To Retailers)</th>
                      <th className="py-2.5 px-3.5">My Margin (₹ & %)</th>
                      <th className="py-2.5 px-3.5">Stock on Hand</th>
                      <th className="py-2.5 px-3.5 text-right">Reorder Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items
                      .filter(i => i.agencyId === selectedAgencyProfile.id)
                      .map(item => {
                        const marginAmt = item.sellingPrice - item.costPrice;
                        const marginPct = Number(((marginAmt / item.sellingPrice) * 100).toFixed(1));
                        const isLowStock = item.stockOnHand <= item.reorderLevel;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3.5">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {item.name}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                SKU: {item.sku} • {item.unit}
                              </div>
                            </td>

                            <td className="py-2.5 px-3.5 whitespace-nowrap">
                              <div className="font-black text-slate-900 dark:text-white">
                                ₹{item.costPrice}
                              </div>
                              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                                Wholesale Rate
                              </span>
                            </td>

                            <td className="py-2.5 px-3.5 whitespace-nowrap">
                              <div className="font-bold text-slate-900 dark:text-white">
                                ₹{item.sellingPrice}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Retailer invoice rate
                              </span>
                            </td>

                            <td className="py-2.5 px-3.5 whitespace-nowrap">
                              <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                +₹{marginAmt} ({marginPct}%)
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Gross profit
                              </span>
                            </td>

                            <td className="py-2.5 px-3.5 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 font-extrabold px-2 py-0.5 rounded-full text-xs ${
                                  isLowStock
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                                }`}
                              >
                                {item.stockOnHand} {item.unit}
                              </span>
                            </td>

                            <td className="py-2.5 px-3.5 text-right whitespace-nowrap text-slate-500 dark:text-slate-400">
                              {item.reorderLevel} {item.unit} min
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 2: PURCHASE HISTORY WITH THE PARTICULAR AGENCY */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Purchase History with {selectedAgencyProfile.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    All Purchase Orders (POs) placed by ME with this agency, along with WhatsApp status and receipt confirmation.
                  </p>
                </div>
              </div>

              {purchaseOrders.filter(po => po.agencyId === selectedAgencyProfile.id).length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <ShoppingCart className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                    No purchase orders recorded yet with this agency.
                  </p>
                  <p className="text-[11px] mt-0.5">Click "Order Stock for ME" above to place your first PO.</p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3.5">PO Number & Date</th>
                        <th className="py-2.5 px-3.5">Items Ordered</th>
                        <th className="py-2.5 px-3.5">Total Amount</th>
                        <th className="py-2.5 px-3.5">Status</th>
                        <th className="py-2.5 px-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {purchaseOrders
                        .filter(po => po.agencyId === selectedAgencyProfile.id)
                        .map(po => (
                          <tr key={po.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3.5 whitespace-nowrap">
                              <div className="font-mono font-bold text-slate-900 dark:text-white">
                                {po.poNumber}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {new Date(po.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </div>
                            </td>

                            <td className="py-2.5 px-3.5">
                              <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                                {po.items.map(i => `${i.quantity} ${i.unit} ${i.itemName}`).join(', ')}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {po.items.reduce((s, i) => s + i.quantity, 0)} units total
                              </div>
                            </td>

                            <td className="py-2.5 px-3.5 whitespace-nowrap font-black text-slate-900 dark:text-white">
                              ₹{(po.totalAmount ?? po.totalCost ?? 0).toLocaleString()}
                            </td>

                            <td className="py-2.5 px-3.5 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  po.status === 'Received'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                    : po.status === 'Sent via WhatsApp' || po.status === 'Confirmed'
                                    ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                }`}
                              >
                                {po.status}
                              </span>
                            </td>

                            <td className="py-2.5 px-3.5 whitespace-nowrap text-right">
                              <button
                                onClick={() => {
                                  const msg = formatAgencyPOMessage(po);
                                  openWhatsAppChat(selectedAgencyProfile.whatsapp, msg);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>WhatsApp PO</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setSelectedAgencyFilter(selectedAgencyProfile.id);
                  setSelectedAgencyProfile(null);
                }}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                Filter Entire App by {selectedAgencyProfile.name} ➔
              </button>

              <button
                onClick={() => setSelectedAgencyProfile(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Place Order with Agency (For ME) */}
      {orderAgencyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                  Wholesale Stock Replenishment
                </span>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-1">
                  Place Order with {orderAgencyModal.name} (For ME)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select items and quantities. Upon creating, this will generate a PO and open WhatsApp directly with {orderAgencyModal.contactPerson}.
                </p>
              </div>
              <button
                onClick={() => setOrderAgencyModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Catalog Items */}
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Select Items & Quantities to Order:
              </label>
              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
                {items
                  .filter(i => i.agencyId === orderAgencyModal.id)
                  .map(item => {
                    const currentQty = orderItemsMap[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Wholesale Cost: ₹{item.costPrice} • Current Stock: {item.stockOnHand} {item.unit}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={currentQty}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              setOrderItemsMap(prev => ({
                                ...prev,
                                [item.id]: val,
                              }));
                            }}
                            className="w-20 p-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold text-slate-900 dark:text-white"
                          />
                          <span className="text-[11px] text-slate-500">{item.unit}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                WhatsApp PO Notes:
              </label>
              <input
                type="text"
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setOrderAgencyModal(null)}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handlePlaceOrderWithAgency(orderAgencyModal)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send WhatsApp PO to Supplier</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Agency */}
      {(showAddAgencyModal || editingAgency) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {editingAgency ? 'Edit Agency Details' : 'Add New Agency Supplier'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure supplier contact, payment terms, and location.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddAgencyModal(false);
                  setEditingAgency(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAgency} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Agency Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sunrise Foods Distributors"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Short Code (e.g. SUN)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    placeholder="SUN"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. FMCG / Snacks"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactPerson}
                  onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="e.g. Vikram Sharma"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.whatsapp}
                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@sunrisefoods.com"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Address / Warehouse Location
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Plot 45, Sector 18, Industrial Area"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formData.paymentTerms}
                    onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                    placeholder="Net 30 Days"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Lead Time (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.leadTimeDays}
                    onChange={e => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 2 })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAgencyModal(false);
                    setEditingAgency(null);
                  }}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {editingAgency ? 'Save Changes' : 'Create Agency Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
