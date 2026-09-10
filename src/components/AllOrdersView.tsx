import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SalesOrder, PurchaseOrder, OrderStatus } from '../types';
import {
  ClipboardList,
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
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Users,
  Filter,
  Check,
  Send,
  Printer,
  Calendar,
  Layers,
  Download,
  Copy,
  Lock,
} from 'lucide-react';
import { openWhatsAppChat, formatRetailerOrderMessage, formatAgencyPOMessage } from '../utils/whatsapp';
import { DateFilterDropdown } from './DateFilterDropdown';
import { DateRangePreset, isDateInRange } from '../utils/dateFilter';
import { exportToCsv, copyForGoogleSheets } from '../utils/exportUtils';

interface AllOrdersViewProps {
  onOpenNewOrderModal: () => void;
  onOpenInvoice: (invoiceId: string) => void;
}

type OrderTypeFilter = 'all' | 'retailer' | 'agency';

export const AllOrdersView: React.FC<AllOrdersViewProps> = ({
  onOpenNewOrderModal,
  onOpenInvoice,
}) => {
  const {
    salesOrders,
    purchaseOrders,
    agencies,
    items,
    updateSalesOrderStatus,
    updatePurchaseOrderStatus,
    generateInvoiceForOrder,
    addPurchaseOrder,
    canCreateOrders,
    currentUser,
  } = useApp();

  const isStaff = currentUser?.role === 'staff';

  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderTypeFilter>(isStaff ? 'retailer' : 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [copiedCsv, setCopiedCsv] = useState(false);

  // Selected details modal state
  const [selectedRetailerOrder, setSelectedRetailerOrder] = useState<SalesOrder | null>(null);
  const [selectedAgencyPO, setSelectedAgencyPO] = useState<PurchaseOrder | null>(null);

  // Quick Inbound PO Modal
  const [showNewPOModal, setShowNewPOModal] = useState(false);
  const [newPoAgencyId, setNewPoAgencyId] = useState<string>(agencies[0]?.id || '');
  const [newPoItems, setNewPoItems] = useState<Array<{ itemId: string; quantity: number }>>([]);
  const [newPoNotes, setNewPoNotes] = useState('Stock replenishment for central depot.');

  // Unify and sort orders
  // Staff view: ONLY retailer orders (incoming), NEVER agency POs!
  type UnifiedOrder = {
    id: string;
    orderNumber: string;
    type: 'retailer' | 'agency';
    date: string;
    partyType: 'Retailer' | 'Agency';
    partyName: string;
    partyContact: string;
    partyStore?: string;
    itemsSummary: string;
    totalItems: number;
    amount: number;
    isReceivable: boolean;
    status: string;
    paymentStatus?: string;
    originalRetailerOrder?: SalesOrder;
    originalAgencyPO?: PurchaseOrder;
  };

  const unifiedList: UnifiedOrder[] = [];

  // Add Sales / Retailer Orders (Incoming)
  salesOrders.forEach(so => {
    unifiedList.push({
      id: so.id,
      orderNumber: so.orderNumber,
      type: 'retailer',
      date: so.createdAt,
      partyType: 'Retailer',
      partyName: so.retailerName,
      partyContact: so.retailerWhatsapp,
      partyStore: so.retailerStore,
      itemsSummary: (so.items || []).map(i => `${i.quantity} ${i.unit} ${i.itemName}`).join(', '),
      totalItems: (so.items || []).reduce((sum, i) => sum + i.quantity, 0),
      amount: so.grandTotal || 0,
      isReceivable: true,
      status: so.status,
      paymentStatus: so.paymentStatus,
      originalRetailerOrder: so,
    });
  });

  // Add Agency Purchase Orders ONLY if NOT staff
  if (!isStaff && (orderTypeFilter === 'all' || orderTypeFilter === 'agency')) {
    purchaseOrders.forEach(po => {
      const calcPoTotal = (po.items || []).reduce((sum, i) => sum + (i.total || 0), 0);
      const poAmount = po.totalAmount ?? po.totalCost ?? calcPoTotal;
      unifiedList.push({
        id: po.id,
        orderNumber: po.poNumber,
        type: 'agency',
        date: po.createdAt,
        partyType: 'Agency',
        partyName: po.agencyName,
        partyContact: po.agencyWhatsapp,
        itemsSummary: (po.items || []).map(i => `${i.quantity} ${i.unit} ${i.itemName}`).join(', '),
        totalItems: (po.items || []).reduce((sum, i) => sum + i.quantity, 0),
        amount: poAmount,
        isReceivable: false,
        status: po.status,
        originalAgencyPO: po,
      });
    });
  }

  // Filter list by tab selection if not staff
  const displayList = isStaff
    ? unifiedList.filter(o => o.type === 'retailer')
    : orderTypeFilter === 'retailer'
    ? unifiedList.filter(o => o.type === 'retailer')
    : orderTypeFilter === 'agency'
    ? unifiedList.filter(o => o.type === 'agency')
    : unifiedList;

  // Sort by date descending
  displayList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter by query, status, and date range
  const filteredOrders = displayList.filter(o => {
    if (statusFilter !== 'all') {
      if (o.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    }
    if (!isDateInRange(o.date, datePreset, customStart, customEnd)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = o.orderNumber.toLowerCase().includes(q);
      const matchParty =
        o.partyName.toLowerCase().includes(q) ||
        (o.partyStore && o.partyStore.toLowerCase().includes(q));
      const matchItems = o.itemsSummary.toLowerCase().includes(q);
      if (!matchNumber && !matchParty && !matchItems) return false;
    }
    return true;
  });

  // Export handlers
  const handleExportCsv = () => {
    if (isStaff) return;
    const headers = ['Order Number', 'Type', 'Date', 'Party Name', 'Contact', 'Items', 'Total Qty', 'Status', 'Payment Status', 'Amount (INR)'];
    const rows = filteredOrders.map(o => [
      o.orderNumber,
      o.type === 'retailer' ? 'Retailer Order' : 'Agency PO',
      o.date ? o.date.split('T')[0] : '',
      o.partyStore ? `${o.partyStore} (${o.partyName})` : o.partyName,
      o.partyContact,
      o.itemsSummary,
      o.totalItems,
      o.status,
      o.paymentStatus || 'N/A',
      o.amount,
    ]);
    exportToCsv(`orders_export_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  const handleCopyForSheets = async () => {
    if (isStaff) return;
    const headers = ['Order Number', 'Type', 'Date', 'Party Name', 'Contact', 'Items', 'Total Qty', 'Status', 'Payment Status', 'Amount (INR)'];
    const rows = filteredOrders.map(o => [
      o.orderNumber,
      o.type === 'retailer' ? 'Retailer Order' : 'Agency PO',
      o.date ? o.date.split('T')[0] : '',
      o.partyStore ? `${o.partyStore} (${o.partyName})` : o.partyName,
      o.partyContact,
      o.itemsSummary,
      o.totalItems,
      o.status,
      o.paymentStatus || 'N/A',
      o.amount,
    ]);
    const success = await copyForGoogleSheets(headers, rows);
    if (success) {
      setCopiedCsv(true);
      setTimeout(() => setCopiedCsv(false), 2000);
    }
  };

  // Aggregate Metrics
  const totalOrdersCount = isStaff ? salesOrders.length : salesOrders.length + purchaseOrders.length;
  const totalReceivableFromRetailers = salesOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalPayableToAgencies = purchaseOrders.reduce((sum, o) => sum + (o.totalAmount ?? o.totalCost ?? 0), 0);
  const pendingRetailerOrders = salesOrders.filter(
    o => o.status !== 'Delivered' && o.status !== 'Cancelled'
  ).length;
  const pendingAgencyPOs = purchaseOrders.filter(
    po => po.status !== 'Received' && po.status !== 'Cancelled'
  ).length;

  // Handler to advance Retailer Order Status
  const handleAdvanceRetailerOrder = (order: SalesOrder) => {
    const sequence: OrderStatus[] = ['Draft', 'Confirmed', 'Packed', 'Dispatched', 'Delivered'];
    const currentIndex = sequence.indexOf(order.status);
    if (currentIndex >= 0 && currentIndex < sequence.length - 1) {
      const nextStatus = sequence[currentIndex + 1];
      updateSalesOrderStatus(order.id, nextStatus);
    }
  };

  // Handler to advance Agency PO Status
  const handleAdvanceAgencyPO = (po: PurchaseOrder) => {
    const sequence: PurchaseOrder['status'][] = ['Draft', 'Sent via WhatsApp', 'Confirmed', 'Received'];
    const currentIndex = sequence.indexOf(po.status);
    if (currentIndex >= 0 && currentIndex < sequence.length - 1) {
      const nextStatus = sequence[currentIndex + 1];
      updatePurchaseOrderStatus(po.id, nextStatus);
    }
  };

  // Handle Create Agency PO
  const handleCreateNewPO = () => {
    if (newPoItems.length === 0) return;
    const targetAgency = agencies.find(a => a.id === newPoAgencyId) || agencies[0];
    const itemsFormatted = newPoItems.map(pi => {
      const item = items.find(i => i.id === pi.itemId);
      return {
        itemId: pi.itemId,
        itemName: item ? item.name : 'Item',
        sku: item ? item.sku : 'SKU',
        quantity: pi.quantity,
        unit: item ? item.unit : 'Box',
        unitCost: item ? item.costPrice : 100,
        total: (item ? item.costPrice : 100) * pi.quantity,
      };
    });

    const totalAmt = itemsFormatted.reduce((sum, i) => sum + i.total, 0);

    addPurchaseOrder({
      agencyId: targetAgency.id,
      agencyName: targetAgency.name,
      agencyWhatsapp: targetAgency.whatsapp,
      items: itemsFormatted,
      totalAmount: totalAmt,
      status: 'Draft',
      expectedDeliveryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      notes: newPoNotes,
    });

    setNewPoItems([]);
    setShowNewPOModal(false);
  };

  const agencyCatalog = items.filter(i => i.agencyId === newPoAgencyId);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                All Orders
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Central order flow: Retailer orders placed with you (Outbound) & Purchase orders placed by you with agencies (Inbound).
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isStaff && (
            <>
              <button
                id="btn-export-orders-csv"
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title="Export filtered orders as CSV file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                id="btn-copy-orders-sheets"
                onClick={handleCopyForSheets}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title="Copy formatted TSV data to clipboard for Google Sheets"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCsv ? 'Copied!' : 'Copy for Sheets'}</span>
              </button>
            </>
          )}

          {canCreateOrders ? (
            <>
              <button
                id="btn-create-retailer-order"
                onClick={onOpenNewOrderModal}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Retailer Order (Outbound)</span>
              </button>

              <button
                id="btn-create-agency-po"
                onClick={() => setShowNewPOModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Place Agency PO (Inbound)</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 text-xs font-medium rounded-xl border border-amber-500/20">
              <Lock className="w-3.5 h-3.5" />
              <span>Staff View (Incoming Orders Only • Financials Hidden)</span>
            </div>
          )}
        </div>
      </div>

      {/* Mental Model Banner for Agency-Retailer Distinction (Only for non-staff) */}
      {!isStaff && (
        <div className="bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Retailer Orders (For Them)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Retailers order from ME. You invoice them, collect revenue, and dispatch goods.
              </p>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden md:block" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Agency Purchase Orders (For Me)
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                I place orders with Agencies for ME. Wholesale purchases that deposit stock into inventory.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {isStaff ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Total Incoming Orders
              </span>
              <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                <ClipboardList className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {salesOrders.length}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Active retailer orders
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Package className="w-3.5 h-3.5" /> Pending Packing
              </span>
              <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {salesOrders.filter(o => o.status === 'Confirmed' || o.status === 'Draft').length}
            </div>
            <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 font-medium">
              Awaiting packaging
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> Packed & In Transit
              </span>
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Truck className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {salesOrders.filter(o => o.status === 'Packed' || o.status === 'Dispatched').length}
            </div>
            <div className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-1 font-medium">
              Ready for handover / out for delivery
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
              </span>
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {salesOrders.filter(o => o.status === 'Delivered').length}
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
              Fulfilled successfully
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Orders */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Total Order Volume
              </span>
              <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                <ClipboardList className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {totalOrdersCount}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {salesOrders.length} Retailer Orders • {purchaseOrders.length} Agency POs
            </div>
          </div>

          {/* Outbound Retailer Orders (Revenue) */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5" /> Retailer Receivables
              </span>
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              ₹{(totalReceivableFromRetailers || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
              {pendingRetailerOrders} active / pending dispatch
            </div>
          </div>

          {/* Inbound Agency POs (Cost/Payables) */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> Agency Payables (For Me)
              </span>
              <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                <Building2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              ₹{(totalPayableToAgencies || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-purple-700 dark:text-purple-400 mt-1 font-medium">
              {pendingAgencyPOs} pending supplier arrival
            </div>
          </div>

          {/* Fulfillment Status */}
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Fulfillment Pipeline
              </span>
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <Truck className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {pendingRetailerOrders + pendingAgencyPOs}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Orders actively in packing or transit
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Order Type Tabs: All, Retailer Orders, Agency Orders */}
          {!isStaff && (
            <div className="inline-flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setOrderTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  orderTypeFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Orders ({totalOrdersCount})
              </button>

              <button
                onClick={() => setOrderTypeFilter('retailer')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  orderTypeFilter === 'retailer'
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                <span>Retailer Orders ({salesOrders.length})</span>
              </button>

              <button
                onClick={() => setOrderTypeFilter('agency')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  orderTypeFilter === 'agency'
                    ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-purple-600" />
                <span>Agency POs ({purchaseOrders.length})</span>
              </button>
            </div>
          )}

          {/* Search, Date Filter & Status Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
            <DateFilterDropdown
              preset={datePreset}
              customStart={customStart}
              customEnd={customEnd}
              onSelectPreset={setDatePreset}
              onCustomChange={(start, end) => {
                setCustomStart(start);
                setCustomEnd(end);
              }}
            />

            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isStaff ? "Search retailer, item..." : "Search order #, retailer, agency, item..."}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Packed">Packed</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Delivered">Delivered</option>
              {!isStaff && <option value="Received">Received (Agency)</option>}
              <option value="Sent via WhatsApp">Sent via WhatsApp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-2xs">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            <ClipboardList className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No matching orders found</p>
            <p className="text-[11px] mt-0.5">Try clearing the search query or changing filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Order ID & Type</th>
                  {/* Notice: EITHER Retailer OR Agency is displayed. Never both! */}
                  <th className="py-3 px-4">Party / Partner (Retailer OR Agency)</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredOrders.map(order => {
                  const isRetailer = order.type === 'retailer';
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      {/* Order Number & Type Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {order.orderNumber}
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          {isRetailer ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <ArrowDownLeft className="w-3 h-3" />
                              Retailer Order (Outbound)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                              <ArrowUpRight className="w-3 h-3" />
                              Agency PO (Inbound)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(order.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                      </td>

                      {/* Party Cell: ONLY Retailer OR ONLY Agency! */}
                      <td className="py-3 px-4">
                        {isRetailer ? (
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{order.partyStore || order.partyName}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <span>Contact: {order.partyName}</span>
                              <span>•</span>
                              <span className="font-mono text-[10px]">{order.partyContact}</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-purple-500" />
                              <span>{order.partyName}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <span>Supplier WhatsApp:</span>
                              <span className="font-mono text-[10px]">{order.partyContact}</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {order.itemsSummary}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {order.totalItems} total quantity units
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isStaff ? (
                          <div>
                            <span className="text-slate-400 font-mono text-xs">••••••</span>
                            <span className="block text-[10px] text-slate-400">Restricted</span>
                          </div>
                        ) : (
                          <>
                            <div className="font-black text-slate-900 dark:text-white text-sm">
                              ₹{(order.amount || 0).toLocaleString()}
                            </div>
                            {isRetailer ? (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  Receivable
                                </span>
                                {order.paymentStatus && (
                                  <span
                                    className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                      order.paymentStatus === 'Paid'
                                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                                        : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                                    }`}
                                  >
                                    {order.paymentStatus}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                Payable to Supplier
                              </span>
                            )}
                          </>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            order.status === 'Delivered' || order.status === 'Received'
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                              : order.status === 'Dispatched' || order.status === 'Confirmed'
                              ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300'
                              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Detail Button */}
                          {isRetailer && order.originalRetailerOrder ? (
                            <button
                              onClick={() => setSelectedRetailerOrder(order.originalRetailerOrder!)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                              title="View Retailer Order Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedAgencyPO(order.originalAgencyPO!)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                              title="View Agency PO Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          {/* WhatsApp Action */}
                          {isRetailer && order.originalRetailerOrder ? (
                            <button
                              onClick={() => {
                                const msg = formatRetailerOrderMessage(
                                  order.originalRetailerOrder!
                                );
                                openWhatsAppChat(order.partyContact, msg);
                              }}
                              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                              title="Send WhatsApp Update to Retailer"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const msg = formatAgencyPOMessage(
                                  order.originalAgencyPO!
                                );
                                openWhatsAppChat(order.partyContact, msg);
                              }}
                              className="p-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-600 rounded-lg transition-colors cursor-pointer"
                              title="Send WhatsApp PO to Agency Supplier"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}

                          {/* Invoice view for Retailer Order */}
                          {isRetailer && order.originalRetailerOrder && (
                            <button
                              onClick={() => {
                                const inv = generateInvoiceForOrder(order.originalRetailerOrder!.id);
                                onOpenInvoice(inv.id);
                              }}
                              className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                              title="Open GST Invoice"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}

                          {/* Quick Status Advance (for Admin/Manager) */}
                          {canCreateOrders && (
                            <>
                              {isRetailer && order.originalRetailerOrder && order.status !== 'Delivered' && (
                                <button
                                  onClick={() => handleAdvanceRetailerOrder(order.originalRetailerOrder!)}
                                  className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                  title="Advance to next fulfillment step"
                                >
                                  Next Step ➔
                                </button>
                              )}

                              {!isRetailer && order.originalAgencyPO && order.status !== 'Received' && (
                                <button
                                  onClick={() => handleAdvanceAgencyPO(order.originalAgencyPO!)}
                                  className="px-2 py-1 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                  title={
                                    order.status === 'Confirmed'
                                      ? 'Mark Stock Received into Inventory'
                                      : 'Advance PO Status'
                                  }
                                >
                                  {order.status === 'Confirmed' ? 'Mark Received' : 'Advance ➔'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal for Retailer Order */}
      {selectedRetailerOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                  Retailer Order (Outbound)
                </span>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-1">
                  Order #{selectedRetailerOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Retailer: <strong className="text-slate-800 dark:text-slate-200">{selectedRetailerOrder.retailerStore}</strong> ({selectedRetailerOrder.retailerName})
                </p>
              </div>
              <button
                onClick={() => setSelectedRetailerOrder(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Items Ordered</h4>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3">Quantity</th>
                      {!isStaff && <th className="py-2 px-3">Unit Price</th>}
                      {!isStaff && <th className="py-2 px-3 text-right">Total</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {(selectedRetailerOrder.items || []).map((it, idx) => {
                      const itemTotal = it.total ?? (it.unitPrice || 0) * (it.quantity || 0);
                      return (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                            {it.itemName}
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                            {it.quantity} {it.unit}
                          </td>
                          {!isStaff && (
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                              ₹{(it.unitPrice || 0).toLocaleString()}
                            </td>
                          )}
                          {!isStaff && (
                            <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                              ₹{(itemTotal || 0).toLocaleString()}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {isStaff ? (
              <div className="flex justify-between items-center pt-2 text-xs border-t border-slate-100 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300">Total Items to Pack:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {(selectedRetailerOrder.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0)} units
                </span>
              </div>
            ) : (
              <div className="flex justify-between items-center pt-2 text-xs border-t border-slate-100 dark:border-slate-700">
                <span className="font-bold text-slate-700 dark:text-slate-300">Grand Total:</span>
                <span className="font-black text-base text-slate-900 dark:text-white">
                  ₹{(selectedRetailerOrder.grandTotal || 0).toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              {!isStaff && (
                <button
                  onClick={() => {
                    const inv = generateInvoiceForOrder(selectedRetailerOrder.id);
                    setSelectedRetailerOrder(null);
                    onOpenInvoice(inv.id);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Open Tax Invoice
                </button>
              )}
              <button
                onClick={() => setSelectedRetailerOrder(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal for Agency PO */}
      {selectedAgencyPO && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                  Agency Purchase Order (Inbound)
                </span>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-1">
                  PO #{selectedAgencyPO.poNumber}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Supplier / Agency: <strong className="text-slate-800 dark:text-slate-200">{selectedAgencyPO.agencyName}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedAgencyPO(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Ordered from Supplier</h4>
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-3">Quantity</th>
                      <th className="py-2 px-3">Purchase Cost</th>
                      <th className="py-2 px-3 text-right">Total Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {(selectedAgencyPO.items || []).map((it, idx) => {
                      const itemTotal = it.total ?? (it.unitCost || 0) * (it.quantity || 0);
                      return (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                            {it.itemName}
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                            {it.quantity} {it.unit}
                          </td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">₹{(it.unitCost || 0).toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                            ₹{(itemTotal || 0).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 text-xs border-t border-slate-100 dark:border-slate-700">
              <span className="font-bold text-slate-700 dark:text-slate-300">Total Purchase Amount:</span>
              <span className="font-black text-base text-slate-900 dark:text-white">
                ₹{(selectedAgencyPO.totalAmount ?? selectedAgencyPO.totalCost ?? 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {canCreateOrders && selectedAgencyPO.status !== 'Received' && (
                <button
                  onClick={() => {
                    handleAdvanceAgencyPO(selectedAgencyPO);
                    setSelectedAgencyPO(null);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {selectedAgencyPO.status === 'Confirmed' ? 'Confirm & Receive Stock' : 'Mark Sent via WhatsApp'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Agency Purchase Order */}
      {showNewPOModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
                  Inbound Supplier Order
                </span>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-1">
                  Place Purchase Order with Agency (For ME)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select which manufacturer or agency to replenish stock from.
                </p>
              </div>
              <button
                onClick={() => setShowNewPOModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {/* Select Target Agency */}
            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Select Agency / Supplier:
              </label>
              <select
                value={newPoAgencyId}
                onChange={e => {
                  setNewPoAgencyId(e.target.value);
                  setNewPoItems([]);
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
              >
                {agencies.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.category}) • Terms: {a.paymentTerms}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Items from this agency */}
            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Add Items from {agencies.find(a => a.id === newPoAgencyId)?.name}:
              </label>
              <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700">
                {agencyCatalog.map(item => {
                  const existing = newPoItems.find(i => i.itemId === item.id);
                  const qty = existing ? existing.quantity : 0;
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Cost: ₹{item.costPrice} • On Hand: {item.stockOnHand} {item.unit}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={qty}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            setNewPoItems(prev => {
                              const filtered = prev.filter(p => p.itemId !== item.id);
                              if (val > 0) {
                                return [...filtered, { itemId: item.id, quantity: val }];
                              }
                              return filtered;
                            });
                          }}
                          className="w-20 p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold text-slate-900 dark:text-white"
                          placeholder="Qty"
                        />
                        <span className="text-[11px] text-slate-500">{item.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                PO Instructions / Delivery Notes:
              </label>
              <input
                type="text"
                value={newPoNotes}
                onChange={e => setNewPoNotes(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {newPoItems.length} items selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewPOModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={newPoItems.length === 0}
                  onClick={handleCreateNewPO}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Create Agency PO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
