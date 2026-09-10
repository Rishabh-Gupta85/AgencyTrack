import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Item, Warehouse } from '../types';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Truck,
  Search,
  Sliders,
  History,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
  Building2,
  Trash2,
} from 'lucide-react';
import { DateFilterDropdown, DatePreset } from './DateFilterDropdown';
import { isWithinRange } from '../utils/dateFilter';
import { exportToCsv } from '../utils/exportUtils';

interface InventoryViewProps {
  onOpenNewPOWithItem?: (item: Item) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = () => {
  const {
    items,
    agencies,
    adjustStock,
    addItem,
    canAdjustStock,
    currentUser,
    warehouses,
    addWarehouse,
    deleteWarehouse,
    addStockToWarehouse,
    deleteStockFromWarehouse,
  } = useApp();
  const isStaff = currentUser?.role === 'staff';

  const [activeTab, setActiveTab] = useState<'levels' | 'history' | 'warehouses'>('levels');
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustItem, setAdjustItem] = useState<Item | null>(null);
  const [adjustQtyChange, setAdjustQtyChange] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<Item | null>(null);

  // Warehouse Management State
  const [showAddWarehouseModal, setShowAddWarehouseModal] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const [newWarehouseAddress, setNewWarehouseAddress] = useState('');
  const [newWarehouseDate, setNewWarehouseDate] = useState('');

  const [activeWarehouseForStock, setActiveWarehouseForStock] = useState<Warehouse | null>(null);
  const [selectedStockCatalogItemId, setSelectedStockCatalogItemId] = useState<string>('');
  const [customStockItemName, setCustomStockItemName] = useState<string>('');
  const [stockQuantity, setStockQuantity] = useState<string>('50');
  const [stockAddedDate, setStockAddedDate] = useState<string>('');

  const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null);

  // Add Item Modal state
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAgencyId, setNewItemAgencyId] = useState(agencies[0]?.id || '');
  const [newItemCategory, setNewItemCategory] = useState('Grains & Cereals');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('Bag');
  const [newItemStock, setNewItemStock] = useState('50');
  const [newItemReorder, setNewItemReorder] = useState('15');
  const [newItemCost, setNewItemCost] = useState('1200');
  const [newItemSelling, setNewItemSelling] = useState('1400');

  // Date filter for movement history
  const [historyDatePreset, setHistoryDatePreset] = useState<DatePreset>('all');
  const [customStart, setCustomStart] = useState<string | null>(null);
  const [customEnd, setCustomEnd] = useState<string | null>(null);

  // Filtered items
  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.agencyName.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q)
    );
  });

  // Filtered warehouses
  const filteredWarehouses = warehouses.filter(wh => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      wh.name.toLowerCase().includes(q) ||
      wh.address.toLowerCase().includes(q) ||
      wh.items.some(i => i.itemName.toLowerCase().includes(q))
    );
  });

  // Calculate stats
  const totalItemsCount = items.length;
  const lowStockItems = items.filter(i => i.stockOnHand <= i.reorderLevel);
  const lowStockCount = lowStockItems.length;
  const receivedToday = 15;
  const dispatchedToday = 5;

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem || isStaff) return;
    const delta = parseInt(adjustQtyChange, 10);
    if (isNaN(delta) || delta === 0) return;

    adjustStock(
      adjustItem.id,
      Math.abs(delta),
      delta > 0 ? 'in' : 'out',
      adjustReason || 'Manual stock adjustment'
    );

    setAdjustItem(null);
    setAdjustQtyChange('');
    setAdjustReason('');
  };

  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const selectedAgency = agencies.find(a => a.id === newItemAgencyId) || agencies[0];
    const cost = parseFloat(newItemCost) || 0;
    const selling = parseFloat(newItemSelling) || cost * 1.15;
    const stock = parseInt(newItemStock, 10) || 0;
    const reorder = parseInt(newItemReorder, 10) || 10;
    const sku = newItemSku.trim() || `SKU-${Date.now().toString().slice(-4)}`;

    addItem({
      name: newItemName.trim(),
      agencyId: selectedAgency?.id || 'agy-1',
      agencyName: selectedAgency?.name || 'StarTex Supplies',
      category: newItemCategory,
      costPrice: cost,
      sellingPrice: selling,
      stockOnHand: stock,
      committedStock: 0,
      reorderLevel: reorder,
      unit: newItemUnit,
      sku,
    });

    // Reset and close
    setShowAddItemModal(false);
    setNewItemName('');
    setNewItemSku('');
    setNewItemCost('1200');
    setNewItemSelling('1400');
    setNewItemStock('50');
  };

  const handleExportInventory = () => {
    if (isStaff) return;
    const exportData = filteredItems.map(item => ({
      'Item Name': item.name,
      'Agency': item.agencyName,
      'SKU': item.sku,
      'Category': item.category,
      'Unit': item.unit,
      'Current Stock': item.stockOnHand,
      'Reorder Level': item.reorderLevel,
      'Cost Price (₹)': item.costPrice,
      'Selling Price (₹)': item.sellingPrice,
      'Stock Value (₹)': item.stockOnHand * item.costPrice,
      'Status': item.stockOnHand <= item.reorderLevel ? 'Low Stock' : 'Optimal',
    }));
    exportToCsv(exportData, `inventory_report_${new Date().toISOString().slice(0, 10)}`);
  };

  const getStatusBadge = (item: Item) => {
    if (item.stockOnHand <= Math.floor(item.reorderLevel / 2)) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
          Critical
        </span>
      );
    }
    if (item.stockOnHand <= item.reorderLevel) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
          Low Stock
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
        In Stock
      </span>
    );
  };

  // Movement logs
  const movementHistory = [
    {
      id: 'mov-1',
      date: '2026-06-14',
      item: 'Basmati Rice (25kg)',
      agency: 'StarTex Supplies',
      type: 'in',
      qty: '+20 Bag',
      source: 'PO-001 Received',
    },
    {
      id: 'mov-2',
      date: '2026-06-14',
      item: 'Wheat Flour (50kg)',
      agency: 'StarTex Supplies',
      type: 'in',
      qty: '+15 Bag',
      source: 'PO-001 Received',
    },
    {
      id: 'mov-3',
      date: '2026-06-13',
      item: 'Mustard Oil (15L)',
      agency: 'Apex Distributors',
      type: 'in',
      qty: '+15 Can',
      source: 'PO-004 Received',
    },
    {
      id: 'mov-4',
      date: '2026-06-13',
      item: 'Sunflower Oil (15L)',
      agency: 'PrimeMart Wholesale',
      type: 'out',
      qty: '-5 Can',
      source: 'SO-006 Dispatched',
    },
  ];

  const filteredMovementHistory = movementHistory.filter(m => {
    return isWithinRange(m.date, historyDatePreset, customStart, customEnd);
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Inventory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track stock levels, low-stock alerts, and warehouse movements
            {isStaff && <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400">(Staff View Access)</span>}
          </p>
        </div>

        {/* Actions for Admin / Owner */}
        {!isStaff && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportInventory}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setShowAddItemModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Product</span>
            </button>
          </div>
        )}
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Products</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{totalItemsCount}</div>
        </div>

        {/* Low Stock */}
        <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Low Stock Alert</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">{lowStockCount}</div>
        </div>

        {/* Received Today */}
        <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Received Inbound</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{receivedToday}</div>
        </div>

        {/* Dispatched */}
        <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Dispatched Out</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{dispatchedToday}</div>
        </div>
      </div>

      {/* Red Low Stock Banner */}
      {lowStockCount > 0 && (
        <div className="bg-rose-50 dark:bg-[#1e131d] border border-rose-200 dark:border-rose-900/60 rounded-xl p-3.5 flex items-center gap-3 text-rose-800 dark:text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
          <span>
            <strong>{lowStockCount} items are below reorder level:</strong> {lowStockItems.map(i => i.name).slice(0, 3).join(', ')}
          </span>
        </div>
      )}

      {/* Controls Bar: Search, Date Filter & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products by name, category, SKU, agency..."
            className="w-full bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'history' && (
            <DateFilterDropdown
              selectedPreset={historyDatePreset}
              onSelectPreset={(preset, start, end) => {
                setHistoryDatePreset(preset);
                setCustomStart(start);
                setCustomEnd(end);
              }}
            />
          )}

          {/* Tabs: Stock Tracker & Movement History & Warehouses */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#121824] p-1 rounded-xl border border-slate-200 dark:border-[#1e2638] text-xs">
            <button
              onClick={() => setActiveTab('levels')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'levels'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Stock Tracker</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Movement History</span>
              <span className="bg-slate-200 dark:bg-[#1e2638] text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded-md text-[10px]">
                {filteredMovementHistory.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('warehouses')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'warehouses'
                  ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Warehouses</span>
              <span className="bg-slate-200 dark:bg-[#1e2638] text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded-md text-[10px]">
                {warehouses.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'levels' && (
        <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1e2638] bg-slate-50 dark:bg-[#0f1522]">
                  <th className="py-3 px-4 font-semibold">Item</th>
                  <th className="py-3 px-4 font-semibold">Source Agency</th>
                  <th className="py-3 px-4 font-semibold">Unit</th>
                  <th className="py-3 px-4 font-semibold">Current Stock</th>
                  <th className="py-3 px-4 font-semibold">Reorder At</th>
                  {!isStaff && <th className="py-3 px-4 font-semibold">Ref. Cost Price</th>}
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1e2638]/60">
                {filteredItems.map(item => {
                  const isLow = item.stockOnHand <= item.reorderLevel;
                  const isCritical = item.stockOnHand <= Math.floor(item.reorderLevel / 2);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#161d2c]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                        <div className="text-[10px] text-slate-400">{item.sku} • {item.category}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{item.agencyName}</td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{item.unit}</td>
                      <td className="py-3.5 px-4 font-bold">
                        <span
                          className={
                            isCritical
                              ? 'text-rose-600 dark:text-rose-400'
                              : isLow
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-900 dark:text-white'
                          }
                        >
                          {item.stockOnHand}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{item.reorderLevel}</td>
                      {!isStaff && (
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          ₹{(item.costPrice || 0).toLocaleString()}
                        </td>
                      )}
                      <td className="py-3.5 px-4">{getStatusBadge(item)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isStaff && canAdjustStock && (
                            <button
                              onClick={() => setAdjustItem(item)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-[#1a2336] hover:bg-slate-200 dark:hover:bg-[#222e47] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#2b3752] rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              <Sliders className="w-3 h-3 text-slate-400" />
                              <span>Adjust</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedHistoryItem(item)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-[#1a2336] hover:bg-slate-200 dark:hover:bg-[#222e47] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#2b3752] rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            <History className="w-3 h-3 text-slate-400" />
                            <span>History</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movement History Table */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1e2638] bg-slate-50 dark:bg-[#0f1522]">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Item</th>
                  <th className="py-3 px-4 font-semibold">Source Agency</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Quantity</th>
                  <th className="py-3 px-4 font-semibold">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1e2638]/60">
                {filteredMovementHistory.map(mov => (
                  <tr key={mov.id} className="hover:bg-slate-50 dark:hover:bg-[#161d2c]/60 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{mov.date}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{mov.item}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{mov.agency}</td>
                    <td className="py-3.5 px-4">
                      {mov.type === 'in' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <ArrowUpRight className="w-3.5 h-3.5" /> Stock In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                          <ArrowDownRight className="w-3.5 h-3.5" /> Stock Out
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{mov.qty}</td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{mov.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Warehouses Section */}
      {activeTab === 'warehouses' && (
        <div className="space-y-4">
          {/* Top Bar matching user screenshot */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {filteredWarehouses.length} {filteredWarehouses.length === 1 ? 'warehouse' : 'warehouses'}
            </span>
            <button
              onClick={() => {
                setNewWarehouseName('');
                setNewWarehouseAddress('');
                const now = new Date();
                const day = String(now.getDate()).padStart(2, '0');
                const month = now.toLocaleString('en-GB', { month: 'short' });
                const year = now.getFullYear();
                setNewWarehouseDate(`${day} ${month} ${year}`);
                setShowAddWarehouseModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Warehouse</span>
            </button>
          </div>

          {/* Warehouse Cards List */}
          {filteredWarehouses.length === 0 ? (
            <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-12 text-center shadow-2xs">
              <Building2 className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200">No Warehouses Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? 'No warehouse matched your search query. Try clearing the search.'
                  : 'Add your storage warehouses and godowns to manage inventory items and track stocking dates.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => {
                    setNewWarehouseName('');
                    setNewWarehouseAddress('');
                    const now = new Date();
                    const day = String(now.getDate()).padStart(2, '0');
                    const month = now.toLocaleString('en-GB', { month: 'short' });
                    const year = now.getFullYear();
                    setNewWarehouseDate(`${day} ${month} ${year}`);
                    setShowAddWarehouseModal(true);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Warehouse</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {filteredWarehouses.map(wh => {
                const totalItems = wh.items.length;
                const totalUnits = wh.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

                return (
                  <div
                    key={wh.id}
                    className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-5 shadow-2xs space-y-4"
                  >
                    {/* Warehouse Header matching user screenshot */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1e2638]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                            {wh.name}
                          </h3>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{wh.address}</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Created: {wh.createdAt}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-[#1a2336] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2b3752] rounded-lg text-xs font-semibold">
                          {totalItems} {totalItems === 1 ? 'item' : 'items'} · {totalUnits} units
                        </span>
                        <button
                          onClick={() => {
                            setActiveWarehouseForStock(wh);
                            setSelectedStockCatalogItemId(items[0]?.id || '');
                            setCustomStockItemName('');
                            setStockQuantity('50');
                            const now = new Date();
                            const day = String(now.getDate()).padStart(2, '0');
                            const month = now.toLocaleString('en-GB', { month: 'short' });
                            const year = now.getFullYear();
                            const hours = String(now.getHours()).padStart(2, '0');
                            const mins = String(now.getMinutes()).padStart(2, '0');
                            setStockAddedDate(`${day} ${month} ${year}, ${hours}:${mins}`);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-[#2b3752] hover:bg-slate-100 dark:hover:bg-[#1e2638] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Stock</span>
                        </button>
                        <button
                          onClick={() => setWarehouseToDelete(wh)}
                          className="p-1.5 text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Delete warehouse"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Items Table inside Warehouse matching user screenshot */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-[#1e2638]">
                            <th className="py-2.5 px-3 font-semibold">Item</th>
                            <th className="py-2.5 px-3 font-semibold">Qty</th>
                            <th className="py-2.5 px-3 font-semibold">Added On</th>
                            <th className="py-2.5 px-3 text-right font-semibold"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#1e2638]/60">
                          {wh.items.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-slate-400 text-xs italic">
                                No items in this warehouse yet. Click "+ Add Stock" to store inventory here.
                              </td>
                            </tr>
                          ) : (
                            wh.items.map(item => (
                              <tr
                                key={item.id}
                                className="hover:bg-slate-50/70 dark:hover:bg-[#161d2c]/60 transition-colors"
                              >
                                <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                                  {item.itemName}
                                </td>
                                <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                                  {item.quantity}
                                </td>
                                <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                  {item.addedOn}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    onClick={() => deleteStockFromWarehouse(wh.id, item.id)}
                                    className="p-1.5 text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                                    title="Delete item from warehouse"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e2638]">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Adjust Stock</h2>
              <button
                onClick={() => setAdjustItem(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Item Summary Card */}
            <div className="bg-slate-50 dark:bg-[#0f1522] border border-slate-200 dark:border-[#1e2638] rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">{adjustItem.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{adjustItem.agencyName}</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400">Current stock: </span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  {adjustItem.stockOnHand} {adjustItem.unit}
                </span>
              </div>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Quantity Change
                </label>
                <input
                  type="text"
                  value={adjustQtyChange}
                  onChange={e => setAdjustQtyChange(e.target.value)}
                  placeholder="e.g. +10 or -5"
                  required
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Use positive numbers to add stock (+10), negative numbers to remove (-5)
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reason / Reference Note
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="e.g. Physical inventory audit, damaged goods"
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#1e2638]">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2336] dark:hover:bg-[#222e47] text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-800 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e2638]">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Add New Product to Inventory</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Register a new catalog item with default agency and pricing</p>
              </div>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder="e.g. Organic Sunflower Oil (15L)"
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Source Agency / Supplier *
                  </label>
                  <select
                    value={newItemAgencyId}
                    onChange={e => setNewItemAgencyId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {agencies.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newItemCategory}
                    onChange={e => setNewItemCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Grains & Cereals">Grains & Cereals</option>
                    <option value="Edible Oils">Edible Oils</option>
                    <option value="Sweeteners & Sugar">Sweeteners & Sugar</option>
                    <option value="Spices & Condiments">Spices & Condiments</option>
                    <option value="Pulses & Legumes">Pulses & Legumes</option>
                    <option value="General FMCG">General FMCG</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={newItemSku}
                    onChange={e => setNewItemSku(e.target.value)}
                    placeholder="e.g. OIL-SUN-15"
                    className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Unit
                  </label>
                  <select
                    value={newItemUnit}
                    onChange={e => setNewItemUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="Bag">Bag</option>
                    <option value="Can">Can</option>
                    <option value="Kg">Kg</option>
                    <option value="Box">Box</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Litre">Litre</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItemStock}
                    onChange={e => setNewItemStock(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItemReorder}
                    onChange={e => setNewItemReorder(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Purchase Cost (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newItemCost}
                    onChange={e => setNewItemCost(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newItemSelling}
                    onChange={e => setNewItemSelling(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#1e2638]">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2336] dark:hover:bg-[#222e47] text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item History Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e2638]">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Stock Movement Log: {selectedHistoryItem.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Current Balance: {selectedHistoryItem.stockOnHand} {selectedHistoryItem.unit}</p>
              </div>
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <div className="p-3 bg-slate-50 dark:bg-[#0f1522] border border-slate-200 dark:border-[#1e2638] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Purchase Order Received (PO-001)</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">2026-06-14</div>
                </div>
                <div className="text-right">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">+20 {selectedHistoryItem.unit}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-[#0f1522] border border-slate-200 dark:border-[#1e2638] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Retailer Order Dispatched (SO-001)</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">2026-06-09</div>
                </div>
                <div className="text-right">
                  <span className="text-rose-600 dark:text-rose-400 font-bold">-5 {selectedHistoryItem.unit}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2336] dark:hover:bg-[#222e47] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Stock to Warehouse Modal */}
      {activeWarehouseForStock && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e2638]">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Add Stock to Warehouse</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activeWarehouseForStock.name}</p>
              </div>
              <button
                onClick={() => setActiveWarehouseForStock(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                let itemName = '';
                if (selectedStockCatalogItemId === '__custom__') {
                  itemName = customStockItemName.trim();
                } else {
                  const found = items.find(i => i.id === selectedStockCatalogItemId);
                  itemName = found ? found.name : customStockItemName.trim();
                }

                if (!itemName) return;

                addStockToWarehouse(activeWarehouseForStock.id, {
                  itemId: selectedStockCatalogItemId !== '__custom__' ? selectedStockCatalogItemId : undefined,
                  itemName,
                  quantity: Math.max(1, Number(stockQuantity) || 1),
                  addedOn: stockAddedDate || undefined,
                });

                setActiveWarehouseForStock(null);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Product
                </label>
                <select
                  value={selectedStockCatalogItemId}
                  onChange={e => setSelectedStockCatalogItemId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku}) - {item.agencyName}
                    </option>
                  ))}
                  <option value="__custom__">+ Enter Custom Product Name...</option>
                </select>
              </div>

              {selectedStockCatalogItemId === '__custom__' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Custom Product Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customStockItemName}
                    onChange={e => setCustomStockItemName(e.target.value)}
                    placeholder="e.g. Basmati Rice (25kg)"
                    className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Quantity (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={stockQuantity}
                  onChange={e => setStockQuantity(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Date & Time Added
                </label>
                <input
                  type="text"
                  required
                  value={stockAddedDate}
                  onChange={e => setStockAddedDate(e.target.value)}
                  placeholder="e.g. 04 Sep 2026, 10:00"
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Recorded in the warehouse registry and logged in the system activity log.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#1e2638]">
                <button
                  type="button"
                  onClick={() => setActiveWarehouseForStock(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2336] dark:hover:bg-[#222e47] text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Add Stock Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Warehouse Modal */}
      {showAddWarehouseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e2638]">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Add New Warehouse</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Register a storage godown or logistics depot</p>
              </div>
              <button
                onClick={() => setShowAddWarehouseModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!newWarehouseName.trim() || !newWarehouseAddress.trim()) return;

                addWarehouse({
                  name: newWarehouseName.trim(),
                  address: newWarehouseAddress.trim(),
                  createdAt: newWarehouseDate.trim() || undefined,
                });

                setShowAddWarehouseModal(false);
                setNewWarehouseName('');
                setNewWarehouseAddress('');
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Warehouse Name
                </label>
                <input
                  type="text"
                  required
                  value={newWarehouseName}
                  onChange={e => setNewWarehouseName(e.target.value)}
                  placeholder="e.g. North Terminal Depot"
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Address / Location
                </label>
                <input
                  type="text"
                  required
                  value={newWarehouseAddress}
                  onChange={e => setNewWarehouseAddress(e.target.value)}
                  placeholder="e.g. Plot 18, Transport Nagar, Phase 2"
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Creation Date
                </label>
                <input
                  type="text"
                  required
                  value={newWarehouseDate}
                  onChange={e => setNewWarehouseDate(e.target.value)}
                  placeholder="e.g. 10 Aug 2026"
                  className="w-full bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#1e2638]">
                <button
                  type="button"
                  onClick={() => setShowAddWarehouseModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2336] dark:hover:bg-[#222e47] text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Create Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Warehouse Confirmation Modal */}
      {warehouseToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e2638]">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Delete Warehouse</h2>
              <button
                onClick={() => setWarehouseToDelete(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete warehouse <strong className="text-slate-900 dark:text-white font-bold">{warehouseToDelete.name}</strong>?
              This will remove all <strong className="text-slate-900 dark:text-white font-bold">{warehouseToDelete.items.length} inventory records</strong> stored in this warehouse.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-[#1e2638]">
              <button
                type="button"
                onClick={() => setWarehouseToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2336] dark:hover:bg-[#222e47] text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteWarehouse(warehouseToDelete.id);
                  setWarehouseToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
              >
                Delete Warehouse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
