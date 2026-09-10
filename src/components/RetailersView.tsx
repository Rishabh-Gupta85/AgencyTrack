import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Retailer, Item, SalesOrder, Invoice } from '../types';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  Phone,
  MapPin,
  FileText,
  MessageCircle,
  X,
  Trash2,
  Edit2,
  Package,
  ShoppingCart,
  Receipt,
  ChevronRight,
  Eye,
  Calendar,
  Layers,
} from 'lucide-react';
import { InvoiceModal } from './InvoiceModal';

interface RetailersViewProps {
  onOpenInvoiceModal?: (invoice: Invoice) => void;
  onOpenCreateOrder?: (retailer?: Retailer) => void;
  onOpenLedgerModal?: (retailer: Retailer) => void;
  onOpenNewOrderModal?: (retailer?: Retailer) => void;
}

export const RetailersView: React.FC<RetailersViewProps> = ({ onOpenInvoiceModal }) => {
  const {
    retailers,
    items,
    salesOrders,
    invoices,
    addRetailer,
    updateRetailer,
    deleteRetailer,
    addSalesOrder,
    canCreateOrders,
    currentUser,
  } = useApp();

  const isStaff = currentUser?.role === 'staff';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'nil' | 'balance' | 'overdue'>('all');

  // Profile Modal (Inside of Retailer card)
  const [selectedRetailerProfile, setSelectedRetailerProfile] = useState<Retailer | null>(null);

  // Modals
  const [showAddRetailerModal, setShowAddRetailerModal] = useState(false);
  const [editingRetailer, setEditingRetailer] = useState<Retailer | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [orderRetailerId, setOrderRetailerId] = useState<string>('');
  const [activeInvoiceForModal, setActiveInvoiceForModal] = useState<Invoice | null>(null);

  // Form states
  const [retailerFormData, setRetailerFormData] = useState({
    storeName: '',
    ownerName: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: 'Delhi NCR',
    creditLimit: 50000,
    gstin: '',
  });

  // New order form state
  const [orderItems, setOrderItems] = useState<
    { itemId: string; quantity: number }[]
  >([{ itemId: items[0]?.id || '', quantity: 1 }]);

  // Stats calculation
  const totalRetailersCount = retailers.length;
  const totalReceivables = retailers.reduce((sum, r) => sum + (r.outstandingBalance || 0), 0);
  const totalCollectedThisMonth = invoices
    .filter(i => i.status === 'Paid')
    .reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  const overdueCount = retailers.filter(
    r => (r.outstandingBalance || 0) > 0 && r.paymentRating === 'Needs Follow-up'
  ).length;

  // Filtered Retailers
  const filteredRetailers = retailers.filter(ret => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches =
        (ret.storeName || '').toLowerCase().includes(q) ||
        (ret.ownerName || '').toLowerCase().includes(q) ||
        (ret.phone || '').toLowerCase().includes(q) ||
        (ret.address && ret.address.toLowerCase().includes(q));
      if (!matches) return false;
    }

    if (statusFilter === 'nil') return (ret.outstandingBalance || 0) === 0;
    if (statusFilter === 'balance') return (ret.outstandingBalance || 0) > 0;
    if (statusFilter === 'overdue')
      return (ret.outstandingBalance || 0) > 0 && ret.paymentRating === 'Needs Follow-up';

    return true;
  });

  const handleOpenAddModal = () => {
    setRetailerFormData({
      storeName: '',
      ownerName: '',
      phone: '',
      whatsapp: '',
      address: '',
      city: 'Delhi NCR',
      creditLimit: 50000,
      gstin: '',
    });
    setShowAddRetailerModal(true);
  };

  const handleOpenEditModal = (ret: Retailer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingRetailer(ret);
    setRetailerFormData({
      storeName: ret.storeName || ret.name,
      ownerName: ret.ownerName || '',
      phone: ret.phone || '',
      whatsapp: ret.whatsapp || ret.phone || '',
      address: ret.address || '',
      city: ret.city || 'Delhi NCR',
      creditLimit: ret.creditLimit || 50000,
      gstin: ret.gstin || '',
    });
  };

  const handleDeleteRetailer = (ret: Retailer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete retailer "${ret.storeName}"? This action cannot be undone.`)) {
      deleteRetailer(ret.id);
      if (selectedRetailerProfile?.id === ret.id) {
        setSelectedRetailerProfile(null);
      }
    }
  };

  const handleSaveRetailer = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRetailer) {
      const updated: Retailer = {
        ...editingRetailer,
        name: retailerFormData.storeName,
        storeName: retailerFormData.storeName,
        ownerName: retailerFormData.ownerName,
        phone: retailerFormData.phone,
        whatsapp: retailerFormData.whatsapp || retailerFormData.phone,
        address: retailerFormData.address,
        city: retailerFormData.city,
        creditLimit: retailerFormData.creditLimit,
        gstin: retailerFormData.gstin || undefined,
      };
      updateRetailer(updated);
      setEditingRetailer(null);
      if (selectedRetailerProfile?.id === editingRetailer.id) {
        setSelectedRetailerProfile(updated);
      }
    } else {
      addRetailer({
        name: retailerFormData.storeName,
        storeName: retailerFormData.storeName,
        ownerName: retailerFormData.ownerName,
        phone: retailerFormData.phone,
        whatsapp: retailerFormData.whatsapp || retailerFormData.phone,
        address: retailerFormData.address,
        city: retailerFormData.city,
        creditLimit: retailerFormData.creditLimit,
        outstandingBalance: 0,
        paymentRating: 'Good',
        gstin: retailerFormData.gstin || undefined,
      });
      setShowAddRetailerModal(false);
    }
  };

  const handleOpenOrderModal = (ret?: Retailer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (ret) {
      setOrderRetailerId(ret.id);
    } else {
      setOrderRetailerId(retailers[0]?.id || '');
    }
    setOrderItems([{ itemId: items[0]?.id || '', quantity: 1 }]);
    setShowNewOrderModal(true);
  };

  const handleAddOrderItem = () => {
    setOrderItems(prev => [...prev, { itemId: items[0]?.id || '', quantity: 1 }]);
  };

  const handleRemoveOrderItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateOrderItem = (index: number, field: 'itemId' | 'quantity', val: any) => {
    setOrderItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const ret = retailers.find(r => r.id === orderRetailerId);
    if (!ret) return;

    const validatedItems = orderItems
      .map(row => {
        const itm = items.find(i => i.id === row.itemId);
        if (!itm || row.quantity <= 0) return null;
        return {
          itemId: itm.id,
          itemName: itm.name,
          sku: itm.sku,
          quantity: row.quantity,
          unit: itm.unit,
          unitPrice: itm.sellingPrice,
          total: itm.sellingPrice * row.quantity,
        };
      })
      .filter(Boolean) as any[];

    if (validatedItems.length === 0) return;

    const subtotal = validatedItems.reduce((sum, it) => sum + it.total, 0);
    const taxAmount = Math.round(subtotal * 0.05);
    const grandTotal = subtotal + taxAmount;

    addSalesOrder({
      retailerId: ret.id,
      retailerName: ret.ownerName || ret.name,
      retailerStore: ret.storeName,
      retailerWhatsapp: ret.whatsapp || ret.phone,
      items: validatedItems,
      subtotal,
      taxAmount,
      discount: 0,
      grandTotal,
      paidAmount: 0,
      paymentStatus: 'Unpaid',
      status: 'Confirmed',
      source: 'manual',
    });

    setShowNewOrderModal(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Retailers & Kirana Stores
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Downstream retail customers who buy FMCG products from my agency.
              </p>
            </div>
          </div>
        </div>

        {!isStaff && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Retailer</span>
          </button>
        )}
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Retailers */}
        <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Retailers</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {totalRetailersCount}
          </div>
        </div>

        {/* Total Receivables */}
        <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Receivables</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {isStaff ? '••••••' : `₹${(totalReceivables || 0).toLocaleString()}`}
          </div>
        </div>

        {/* Collected (This Month) */}
        <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Collected Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {isStaff ? '••••••' : `₹${(totalCollectedThisMonth || 0).toLocaleString()}`}
          </div>
        </div>

        {/* Overdue Invoices */}
        <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Overdue Follow-ups</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {overdueCount}
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by store name, owner, or phone..."
            className="w-full bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors shadow-2xs"
          />
        </div>

        {/* Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-indigo-500 cursor-pointer shadow-2xs"
        >
          <option value="all">All Payment Status</option>
          <option value="nil">Nil Balance (Clear)</option>
          <option value="balance">Has Balance Due</option>
          <option value="overdue">Overdue Follow-up</option>
        </select>
      </div>

      {/* Retailers Grid - Styled identically to Agency Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRetailers.map(ret => {
          const initials = (ret.storeName || 'R')
            .split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
          const hasBalance = (ret.outstandingBalance || 0) > 0;
          const isOverdue = hasBalance && ret.paymentRating === 'Needs Follow-up';
          const retailerOrders = salesOrders.filter(o => o.retailerId === ret.id);
          const totalOrders = retailerOrders.length > 0 ? retailerOrders.length : ret.totalOrdersPlaced;

          return (
            <div
              key={ret.id}
              onClick={() => setSelectedRetailerProfile(ret)}
              className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500/60 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Top Row: Icon, Title, Contact, and Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-200 dark:border-indigo-800/80 shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {ret.storeName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {ret.ownerName || ret.name}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete buttons right on card */}
                  {!isStaff && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleOpenEditModal(ret, e)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Retailer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteRetailer(ret, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Retailer"
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
                    <span className="font-mono text-slate-700 dark:text-slate-300">{ret.phone || ret.whatsapp}</span>
                  </div>
                  {ret.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-700 dark:text-slate-300">{ret.address}</span>
                    </div>
                  )}
                </div>

                {/* Financial overview */}
                <div className="pt-3 border-t border-slate-100 dark:border-[#1e2638] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Outstanding</span>
                    <p
                      className={`font-bold text-sm ${
                        hasBalance ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isStaff ? '••••••' : `₹${(ret.outstandingBalance || 0).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px]">Credit Limit</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                      {isStaff ? '••••••' : `₹${(ret.creditLimit || 0).toLocaleString()}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Footer Row */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#1e2638] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {totalOrders} Orders
                  </span>
                  {isOverdue ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                      Overdue
                    </span>
                  ) : hasBalance ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      Balance Due
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Clear
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${(ret.whatsapp || ret.phone).replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                  <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    <span>View Profile</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* DEDICATED RETAILER PROFILE MODAL (INSIDE OF RETAILER CARD)                */}
      {/* Shows: 1) Products ordered by this retailer                               */}
      {/*        2) Sales order & invoice history with this retailer               */}
      {/*        3) Edit & Delete action buttons                                    */}
      {/* ========================================================================= */}
      {selectedRetailerProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#121824] rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 dark:border-[#1e2638] space-y-6 max-h-[92vh] overflow-y-auto text-slate-800 dark:text-slate-100">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#1e2638] pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/20">
                  {(selectedRetailerProfile.storeName || 'R').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-xl text-slate-900 dark:text-white">
                      {selectedRetailerProfile.storeName}
                    </h2>
                    <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                      {selectedRetailerProfile.city || 'Delhi NCR'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Owner: <strong className="text-slate-800 dark:text-slate-200">{selectedRetailerProfile.ownerName}</strong> • Phone: {selectedRetailerProfile.phone} • Address: {selectedRetailerProfile.address}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isStaff && (
                  <>
                    <button
                      onClick={() => handleOpenEditModal(selectedRetailerProfile)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      title="Edit Retailer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteRetailer(selectedRetailerProfile)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      title="Delete Retailer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </>
                )}

                {canCreateOrders && (
                  <button
                    onClick={() => {
                      handleOpenOrderModal(selectedRetailerProfile);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Create Order</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedRetailerProfile(null)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-[#0f1522] border border-slate-200 dark:border-[#1e2638] rounded-xl">
                <span className="text-[11px] text-slate-400">Outstanding Balance</span>
                <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {isStaff ? '••••••' : `₹${(selectedRetailerProfile.outstandingBalance || 0).toLocaleString()}`}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#0f1522] border border-slate-200 dark:border-[#1e2638] rounded-xl">
                <span className="text-[11px] text-slate-400">Credit Limit</span>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {isStaff ? '••••••' : `₹${(selectedRetailerProfile.creditLimit || 0).toLocaleString()}`}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#0f1522] border border-slate-200 dark:border-[#1e2638] rounded-xl">
                <span className="text-[11px] text-slate-400">Total Orders Placed</span>
                <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {salesOrders.filter(o => o.retailerId === selectedRetailerProfile.id).length}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#0f1522] border border-slate-200 dark:border-[#1e2638] rounded-xl">
                <span className="text-[11px] text-slate-400">Payment Status</span>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedRetailerProfile.paymentRating || 'Good Standing'}
                </p>
              </div>
            </div>

            {/* SECTION 1: ORDER HISTORY & INVOICES WITH THIS RETAILER */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Sales Orders & Invoices for {selectedRetailerProfile.storeName}</span>
                </h3>
              </div>

              {salesOrders.filter(o => o.retailerId === selectedRetailerProfile.id).length === 0 ? (
                <div className="p-6 bg-slate-50 dark:bg-[#0f1522] rounded-2xl text-center text-xs text-slate-400 border border-slate-200 dark:border-[#1e2638]">
                  No sales orders recorded yet for this retailer.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-[#1e2638] rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-[#0f1522] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-[#1e2638]">
                      <tr>
                        <th className="py-2.5 px-3.5">Order No</th>
                        <th className="py-2.5 px-3.5">Date</th>
                        <th className="py-2.5 px-3.5">Items Ordered</th>
                        {!isStaff && <th className="py-2.5 px-3.5">Grand Total</th>}
                        <th className="py-2.5 px-3.5">Order Status</th>
                        <th className="py-2.5 px-3.5">Payment</th>
                        <th className="py-2.5 px-3.5 text-right">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1e2638]/60">
                      {salesOrders
                        .filter(o => o.retailerId === selectedRetailerProfile.id)
                        .map(order => {
                          const inv = invoices.find(i => i.salesOrderId === order.id || i.orderNumber === order.orderNumber);

                          return (
                            <tr key={order.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                              <td className="py-2.5 px-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                                {order.orderNumber}
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-500 dark:text-slate-400">
                                {order.orderDate}
                              </td>
                              <td className="py-2.5 px-3.5">
                                <span className="text-slate-700 dark:text-slate-300">
                                  {order.items.map(i => `${i.itemName} (${i.quantity})`).join(', ')}
                                </span>
                              </td>
                              {!isStaff && (
                                <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white">
                                  ₹{(order.grandTotal || 0).toLocaleString()}
                                </td>
                              )}
                              <td className="py-2.5 px-3.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {order.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    order.paymentStatus === 'Paid'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                                  }`}
                                >
                                  {order.paymentStatus}
                                </span>
                              </td>
                              <td className="py-2.5 px-3.5 text-right">
                                {inv ? (
                                  <button
                                    onClick={() => {
                                      if (onOpenInvoiceModal) {
                                        onOpenInvoiceModal(inv);
                                      } else {
                                        setActiveInvoiceForModal(inv);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>{inv.invoiceNumber}</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Retailer Modal */}
      {editingRetailer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e2638]">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit Retailer</h2>
              <button
                onClick={() => setEditingRetailer(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRetailer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  value={retailerFormData.storeName}
                  onChange={e => setRetailerFormData({ ...retailerFormData, storeName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Owner / Contact Person *</label>
                <input
                  type="text"
                  required
                  value={retailerFormData.ownerName}
                  onChange={e => setRetailerFormData({ ...retailerFormData, ownerName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={retailerFormData.phone}
                    onChange={e => setRetailerFormData({ ...retailerFormData, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={retailerFormData.whatsapp}
                    onChange={e => setRetailerFormData({ ...retailerFormData, whatsapp: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={retailerFormData.address}
                  onChange={e => setRetailerFormData({ ...retailerFormData, address: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={retailerFormData.creditLimit}
                    onChange={e => setRetailerFormData({ ...retailerFormData, creditLimit: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    value={retailerFormData.gstin}
                    onChange={e => setRetailerFormData({ ...retailerFormData, gstin: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#1e2638]">
                <button
                  type="button"
                  onClick={() => setEditingRetailer(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2336] dark:hover:bg-[#222e47] text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Retailer Modal */}
      {showAddRetailerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e2638]">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Add New Retailer</h2>
              <button
                onClick={() => setShowAddRetailerModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRetailer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Provision Store"
                  value={retailerFormData.storeName}
                  onChange={e => setRetailerFormData({ ...retailerFormData, storeName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Owner / Contact Person *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={retailerFormData.ownerName}
                  onChange={e => setRetailerFormData({ ...retailerFormData, ownerName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91-98765-43210"
                    value={retailerFormData.phone}
                    onChange={e => setRetailerFormData({ ...retailerFormData, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+91-98765-43210"
                    value={retailerFormData.whatsapp}
                    onChange={e => setRetailerFormData({ ...retailerFormData, whatsapp: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Address</label>
                <input
                  type="text"
                  placeholder="Shop number, market, road..."
                  value={retailerFormData.address}
                  onChange={e => setRetailerFormData({ ...retailerFormData, address: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={retailerFormData.creditLimit}
                    onChange={e => setRetailerFormData({ ...retailerFormData, creditLimit: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    value={retailerFormData.gstin}
                    onChange={e => setRetailerFormData({ ...retailerFormData, gstin: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#1e2638]">
                <button
                  type="button"
                  onClick={() => setShowAddRetailerModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2336] dark:hover:bg-[#222e47] text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Add Retailer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e2638]">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Create Sales Order</h2>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmOrder} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Retailer
                </label>
                <select
                  value={orderRetailerId}
                  onChange={e => setOrderRetailerId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {retailers.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.storeName} ({r.ownerName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white">Order Items</span>
                  <button
                    type="button"
                    onClick={handleAddOrderItem}
                    className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-[#1e2638] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-[#0f1522] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1e2638]">
                      <tr>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5">Source Agency</th>
                        <th className="p-2.5">Qty</th>
                        {!isStaff && <th className="p-2.5">Price (₹)</th>}
                        {!isStaff && <th className="p-2.5 text-right">Total (₹)</th>}
                        <th className="p-2.5 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1e2638]/60">
                      {orderItems.map((row, idx) => {
                        const itm = items.find(i => i.id === row.itemId);
                        const rowTotal = itm ? itm.sellingPrice * row.quantity : 0;

                        return (
                          <tr key={idx} className="bg-white dark:bg-[#121824]">
                            <td className="p-2.5">
                              <select
                                value={row.itemId}
                                onChange={e =>
                                  handleUpdateOrderItem(idx, 'itemId', e.target.value)
                                }
                                className="bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white text-xs cursor-pointer max-w-[180px]"
                              >
                                {items.map(it => (
                                  <option key={it.id} value={it.id}>
                                    {it.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2.5 text-slate-500 dark:text-slate-400 text-[11px]">
                              {itm?.agencyName || 'N/A'}
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                min={1}
                                value={row.quantity}
                                onChange={e =>
                                  handleUpdateOrderItem(
                                    idx,
                                    'quantity',
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-16 bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-lg px-2 py-1 text-slate-900 dark:text-white text-xs font-mono"
                              />
                            </td>
                            {!isStaff && (
                              <td className="p-2.5 text-slate-700 dark:text-slate-300 font-medium">
                                ₹{itm?.sellingPrice || 0}
                              </td>
                            )}
                            {!isStaff && (
                              <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                                ₹{(rowTotal || 0).toLocaleString()}
                              </td>
                            )}
                            <td className="p-2.5 text-center">
                              {orderItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOrderItem(idx)}
                                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#1e2638]">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2336] dark:hover:bg-[#222e47] text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Confirm Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal for View & Print */}
      {activeInvoiceForModal && (
        <InvoiceModal
          invoice={activeInvoiceForModal}
          onClose={() => setActiveInvoiceForModal(null)}
        />
      )}
    </div>
  );
};
