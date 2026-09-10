import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  CheckCircle2,
  Share2,
  MessageSquare,
} from 'lucide-react';

export const PriceAlertsView: React.FC = () => {
  const { priceChanges, items } = useApp();
  const [acknowledged, setAcknowledged] = useState<{ [id: string]: boolean }>({});

  const handleAcknowledge = (id: string) => {
    setAcknowledged(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Price Alerts</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Real-time price revisions from partner agencies and recommended retail selling price adjustments
        </p>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Price Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-amber-950/40 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-400 mt-2">{priceChanges.length || 2}</div>
        </div>

        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Rate Increases</span>
            <div className="w-9 h-9 rounded-xl bg-rose-950/40 text-rose-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-rose-400 mt-2">1</div>
        </div>

        <div className="bg-[#121824] border border-[#1e2638] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Rate Reductions</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-950/40 text-emerald-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-2">1</div>
        </div>
      </div>

      {/* Price Changes List */}
      <div className="space-y-4">
        {priceChanges.map(change => {
          const isAck = acknowledged[change.id];
          const isUp = change.newCostPrice > change.oldCostPrice;

          return (
            <div
              key={change.id}
              className="bg-[#121824] border border-[#1e2638] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isUp
                        ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                        : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                    }`}
                  >
                    {isUp ? `+${change.changePercent}%` : `${change.changePercent}%`}
                  </span>
                  <h3 className="text-base font-bold text-white">{change.itemName}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-300 font-medium">{change.agencyName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Effective: {change.effectiveDate}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300">
                  <strong className="text-slate-400">Reason:</strong> {change.reason}
                </p>
              </div>

              {/* Price comparison box */}
              <div className="flex items-center gap-6">
                <div className="bg-[#0f1522] border border-[#1e2638] rounded-xl p-3.5 text-xs text-center min-w-[120px]">
                  <span className="text-[11px] text-slate-400 block">Agency Cost</span>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-slate-400 line-through">₹{change.oldCostPrice}</span>
                    <span className={`font-bold text-sm ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                      ₹{change.newCostPrice}
                    </span>
                  </div>
                </div>

                <div className="bg-[#0f1522] border border-[#1e2638] rounded-xl p-3.5 text-xs text-center min-w-[120px]">
                  <span className="text-[11px] text-slate-400 block">Retail Selling</span>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-slate-400 line-through">₹{change.oldSellingPrice}</span>
                    <span className="font-bold text-white text-sm">
                      ₹{change.newSellingPrice}
                    </span>
                  </div>
                </div>

                <div>
                  {isAck ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 text-emerald-400 text-xs font-semibold border border-emerald-800/40">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Acknowledged</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(change.id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
