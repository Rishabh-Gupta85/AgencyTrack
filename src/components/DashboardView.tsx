import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingCart,
  TrendingUp,
  Package,
  FileText,
  AlertTriangle,
  TrendingDown,
  ArrowRight,
  Share2,
} from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  onOpenWhatsAppModal?: () => void;
  onOpenNewOrderModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
}) => {
  const {
    items,
    salesOrders,
    purchaseOrders,
    invoices,
    priceChanges,
    currentUser,
    switchUserRole,
  } = useApp();

  const [activeOrderTab, setActiveOrderTab] = useState<'all' | 'purchase' | 'sales'>('all');
  const [env, setEnv] = useState<'dev' | 'staging' | 'prod'>('dev');

  // Low stock items matching Screenshot 1 & 7
  const lowStockItems = items.filter(i => i.stockOnHand <= i.reorderLevel);

  // Revenue paid
  const revenuePaid = salesOrders
    .filter(o => o.paymentStatus === 'Paid')
    .reduce((sum, o) => sum + (o.paidAmount || o.grandTotal), 0) || 13000;

  // Pending invoices
  const pendingInvoicesCount = invoices.filter(inv => inv.status !== 'Paid').length || 3;

  // Pending purchases
  const pendingPOsCount = purchaseOrders.filter(po => po.status !== 'Received').length || 3;

  // Recent activity list
  const recentOrders = [
    {
      id: 'PO-004',
      party: 'Apex Distributors',
      type: 'Purchase',
      date: '2026-06-13',
      amount: '₹30,750',
      status: 'Received',
    },
    {
      id: 'PO-005',
      party: 'NovaTrade Co.',
      type: 'Purchase',
      date: '2026-06-13',
      amount: '₹12,000',
      status: 'Pending',
    },
    {
      id: 'SO-005',
      party: 'FreshMart',
      type: 'Sale',
      date: '2026-06-13',
      amount: '₹7,050',
      status: 'Draft',
    },
    {
      id: 'SO-006',
      party: 'Daily Needs',
      type: 'Sale',
      date: '2026-06-13',
      amount: '₹27,900',
      status: 'Draft',
    },
    {
      id: 'PO-003',
      party: 'GlobalEdge Traders',
      type: 'Purchase',
      date: '2026-06-12',
      amount: '₹45,600',
      status: 'Pending',
    },
    {
      id: 'SO-004',
      party: 'Metro Retail',
      type: 'Sale',
      date: '2026-06-12',
      amount: '₹4,500',
      status: 'Dispatched',
    },
    {
      id: 'PO-002',
      party: 'PrimeMart Wholesale',
      type: 'Purchase',
      date: '2026-06-11',
      amount: '₹55,000',
      status: 'Pending',
    },
    {
      id: 'SO-003',
      party: 'Budget Bazaar',
      type: 'Sale',
      date: '2026-06-11',
      amount: '₹14,400',
      status: 'Confirmed',
    },
  ];

  const filteredOrders = recentOrders.filter(order => {
    if (activeOrderTab === 'purchase') return order.type === 'Purchase';
    if (activeOrderTab === 'sales') return order.type === 'Sale';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Received':
        return 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40';
      case 'Pending':
        return 'bg-amber-950/60 text-amber-400 border border-amber-800/40';
      case 'Draft':
        return 'bg-slate-800 text-slate-300 border border-slate-700/50';
      case 'Dispatched':
        return 'bg-blue-950/60 text-blue-400 border border-blue-800/40';
      case 'Confirmed':
        return 'bg-purple-950/60 text-purple-400 border border-purple-800/40';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Top Header matching Screenshot 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Overview of your agency business operations
          </p>
        </div>

        {/* Environment Pills & Share Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#121824] border border-[#1e2638] rounded-xl p-1 text-xs font-medium text-slate-400">
            <button
              onClick={() => setEnv('dev')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                env === 'dev'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'hover:text-slate-200'
              }`}
            >
              dev
            </button>
            <button
              onClick={() => setEnv('staging')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                env === 'staging'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'hover:text-slate-200'
              }`}
            >
              staging
            </button>
            <button
              onClick={() => setEnv('prod')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                env === 'prod'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'hover:text-slate-200'
              }`}
            >
              prod
            </button>
          </div>

          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                alert('Dashboard link copied to clipboard!');
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#121824] hover:bg-[#182030] text-slate-200 border border-[#1e2638] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Row 1: 4 Key Metric Cards matching Screenshot 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Purchase Orders */}
        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Purchase Orders</span>
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-2">5</div>
          <div className="text-xs text-slate-400 mt-1">3 pending</div>
        </div>

        {/* Total Sales Orders */}
        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Sales Orders</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-950/40 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-2">6</div>
          <div className="text-xs text-slate-400 mt-1">3 to invoice</div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Low Stock Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-rose-950/40 text-rose-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-2">3</div>
          <div className="text-xs text-slate-400 mt-1">items need reorder</div>
          <div className="text-xs font-medium text-rose-500 mt-1">Action required</div>
        </div>

        {/* Revenue (Paid) */}
        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Revenue (Paid)</span>
            <div className="w-9 h-9 rounded-xl bg-purple-950/40 text-purple-400 flex items-center justify-center font-bold text-sm">
              ₹
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-2">₹13,000</div>
          <div className="text-xs text-slate-400 mt-1">from paid orders</div>
          <div className="text-xs font-medium text-emerald-400 mt-1">This period</div>
        </div>
      </div>

      {/* Row 2: 3 Operational Cards matching Screenshot 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending Invoices */}
        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pending Invoices</span>
            <div className="w-9 h-9 rounded-xl bg-amber-950/40 text-amber-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-2">{pendingInvoicesCount}</div>
          <div className="text-xs text-slate-400 mt-1">awaiting payment</div>
        </div>

        {/* Price Change Alerts */}
        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Price Change Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-amber-950/40 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-2">2</div>
          <div className="text-xs text-slate-400 mt-1">recent price changes</div>
          <button
            onClick={() => setActiveTab('agencies')}
            className="text-xs font-medium text-rose-400 hover:text-rose-300 mt-1 block cursor-pointer"
          >
            Review agencies
          </button>
        </div>

        {/* Pending Purchases */}
        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pending Purchases</span>
            <div className="w-9 h-9 rounded-xl bg-blue-950/40 text-blue-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-2">{pendingPOsCount}</div>
          <div className="text-xs text-slate-400 mt-1">orders not yet received</div>
        </div>
      </div>

      {/* Main Grid: Left Recent Activity (70%) + Right Low Stock & Price Alerts (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Recent Activity Table */}
        <div className="lg:col-span-2 bg-[#121824] border border-[#1e2638] rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Recent Activity</h2>
              <p className="text-xs text-slate-400">Last 5 orders each</p>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-1 bg-[#0b0f19] p-1 rounded-xl border border-[#1e2638] text-xs">
              <button
                onClick={() => setActiveOrderTab('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeOrderTab === 'all'
                    ? 'bg-[#1e2638] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Orders
              </button>
              <button
                onClick={() => setActiveOrderTab('purchase')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeOrderTab === 'purchase'
                    ? 'bg-[#1e2638] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Purchase Orders
              </button>
              <button
                onClick={() => setActiveOrderTab('sales')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeOrderTab === 'sales'
                    ? 'bg-[#1e2638] text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sales Orders
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-[#1e2638]">
                  <th className="pb-3 font-semibold">Order ID</th>
                  <th className="pb-3 font-semibold">Party</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2638]/60">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-[#161d2c]/60 transition-colors">
                    <td className="py-3 font-semibold text-white">{order.id}</td>
                    <td className="py-3 text-slate-300">{order.party}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          order.type === 'Purchase'
                            ? 'bg-purple-950/60 text-purple-300 border border-purple-800/40'
                            : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                        }`}
                      >
                        {order.type}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">{order.date}</td>
                    <td className="py-3 font-semibold text-white">{order.amount}</td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setActiveTab('all_orders')}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="View order"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Low Stock & Price Alerts */}
        <div className="space-y-6">
          {/* Low Stock Card */}
          <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Low Stock</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                3
              </span>
            </div>

            <div className="space-y-3">
              {/* Item 1 */}
              <div className="flex items-center justify-between text-xs pb-3 border-b border-[#1e2638]/60">
                <div>
                  <div className="font-semibold text-white">Sunflower Oil (15L)</div>
                  <div className="text-[11px] text-slate-400">PrimeMart Wholesale</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-rose-400">8 Can</div>
                  <div className="text-[10px] text-slate-400">min 15</div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-center justify-between text-xs pb-3 border-b border-[#1e2638]/60">
                <div>
                  <div className="font-semibold text-white">Sugar (50kg)</div>
                  <div className="text-[11px] text-slate-400">GlobalEdge Traders</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-rose-400">12 Bag</div>
                  <div className="text-[10px] text-slate-400">min 20</div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">Mustard Oil (15L)</div>
                  <div className="text-[11px] text-slate-400">Apex Distributors</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-rose-400">3 Can</div>
                  <div className="text-[10px] text-slate-400">min 10</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('inventory')}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold pt-2 transition-colors cursor-pointer"
            >
              <span>Manage inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Price Alerts Card */}
          <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Price Alerts</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                2
              </span>
            </div>

            <div className="space-y-3">
              {/* Alert 1 */}
              <div className="flex items-center justify-between text-xs pb-3 border-b border-[#1e2638]/60">
                <div>
                  <div className="font-semibold text-white">Sunflower Oil (15L)</div>
                  <div className="text-[11px] text-slate-400">PrimeMart Wholesale</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">2026-06-11</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-rose-400">₹1800 → ₹1900</span>
                </div>
              </div>

              {/* Alert 2 */}
              <div className="flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">Mustard Oil (15L)</div>
                  <div className="text-[11px] text-slate-400">Apex Distributors</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">2026-06-12</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400">₹2100 → ₹2050</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
