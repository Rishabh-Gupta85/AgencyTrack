import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Item } from '../types';
import {
  Package,
  TrendingUp,
  Percent,
  Search,
  Plus,
  Edit2,
  Sliders,
  Building2,
  X,
  CheckCircle2,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { items, recordPriceChange, canManagePricing, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editPriceItem, setEditPriceItem] = useState<Item | null>(null);
  const [newCostPrice, setNewCostPrice] = useState<number>(0);
  const [newSellingPrice, setNewSellingPrice] = useState<number>(0);
  const [priceReason, setPriceReason] = useState<string>('');

  const categories = Array.from(new Set(items.map(i => i.category)));

  const filteredItems = items.filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.agencyName.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const handleOpenPriceModal = (item: Item) => {
    setEditPriceItem(item);
    setNewCostPrice(item.costPrice);
    setNewSellingPrice(item.sellingPrice);
    setPriceReason('Standard market revision');
  };

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPriceItem) return;

    recordPriceChange(editPriceItem.id, newCostPrice, newSellingPrice, priceReason);
    setEditPriceItem(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Products</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Manage product catalog, cost vs. selling prices, and agency origin
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total SKUs</span>
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-2">{items.length}</div>
        </div>

        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Categories</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-950/40 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-indigo-400 mt-2">{categories.length}</div>
        </div>

        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Avg Profit Margin</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-950/40 text-emerald-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-2">10.8%</div>
        </div>

        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Price Revisions</span>
            <div className="w-9 h-9 rounded-xl bg-amber-950/40 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-400 mt-2">2</div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search SKU, product name, or agency..."
            className="w-full bg-[#121824] border border-[#1e2638] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="bg-[#121824] border border-[#1e2638] rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#121824] border border-[#1e2638] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-[#1e2638] bg-[#0f1522]">
                <th className="py-3 px-4 font-semibold">SKU / Item</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Agency Supplier</th>
                <th className="py-3 px-4 font-semibold">Cost (₹)</th>
                <th className="py-3 px-4 font-semibold">Selling (₹)</th>
                <th className="py-3 px-4 font-semibold">Margin</th>
                <th className="py-3 px-4 font-semibold">Stock</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2638]/60">
              {filteredItems.map(item => {
                const marginAmount = item.sellingPrice - item.costPrice;
                const marginPct = ((marginAmount / item.costPrice) * 100).toFixed(1);

                return (
                  <tr key={item.id} className="hover:bg-[#161d2c]/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.sku}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{item.category}</td>
                    <td className="py-3.5 px-4 text-slate-300">{item.agencyName}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      ₹{item.costPrice.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      ₹{item.sellingPrice.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        +{marginPct}% (₹{marginAmount})
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold ${
                          item.stockOnHand <= item.reorderLevel
                            ? 'text-rose-400'
                            : 'text-white'
                        }`}
                      >
                        {item.stockOnHand} {item.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenPriceModal(item)}
                        className="px-2.5 py-1 bg-[#1a2336] hover:bg-[#222e47] text-slate-200 border border-[#2b3752] rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Update Price
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Price Edit Modal */}
      {editPriceItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#121824] border border-[#1e2638] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2638]">
              <div>
                <h2 className="text-base font-bold text-white">Revise Product Pricing</h2>
                <p className="text-xs text-slate-400">{editPriceItem.name}</p>
              </div>
              <button
                onClick={() => setEditPriceItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Agency Cost Price (₹)</label>
                <input
                  type="number"
                  value={newCostPrice}
                  onChange={e => setNewCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f1522] border border-[#1e2638] rounded-xl px-3.5 py-2.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Retail Selling Price (₹)</label>
                <input
                  type="number"
                  value={newSellingPrice}
                  onChange={e => setNewSellingPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0f1522] border border-[#1e2638] rounded-xl px-3.5 py-2.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Revision Reason</label>
                <input
                  type="text"
                  value={priceReason}
                  onChange={e => setPriceReason(e.target.value)}
                  placeholder="e.g. Commodity crude spike"
                  className="w-full bg-[#0f1522] border border-[#1e2638] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e2638]">
                <button
                  type="button"
                  onClick={() => setEditPriceItem(null)}
                  className="px-4 py-2 bg-[#1a2336] hover:bg-[#222e47] text-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold cursor-pointer"
                >
                  Apply & Record Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
