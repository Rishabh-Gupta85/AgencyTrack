import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  Bell,
  MessageSquare,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Package,
  Truck,
  ExternalLink,
  Slack,
  Sun,
  Moon,
  Layers,
  Shield,
} from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  onOpenWhatsAppModal: () => void;
  onOpenNewOrderModal: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenWhatsAppModal,
  onOpenNewOrderModal,
  onNavigateToTab,
}) => {
  const {
    agencies,
    selectedAgencyFilter,
    setSelectedAgencyFilter,
    alerts,
    markAlertRead,
    markAllAlertsRead,
    slackConfig,
    resetToDemoData,
    items,
    theme,
    toggleTheme,
    currentUser,
    canCreateOrders,
    switchUserRole,
  } = useApp();

  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const unreadAlerts = alerts.filter(a => !a.read);
  const lowStockCount = items.filter(i => i.stockOnHand <= i.reorderLevel).length;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand & Active Agency Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-base leading-tight tracking-tight">
                  AgencyHub
                </span>
                <span className="text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 uppercase tracking-wider">
                  {currentUser?.role || 'Portal'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Wholesale Agency & Retailer Distribution
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

          {/* Active Agency Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline-flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> Agency:
            </span>
            <select
              id="agency-filter-select"
              value={selectedAgencyFilter}
              onChange={e => setSelectedAgencyFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-purple-500 focus:outline-hidden transition-colors cursor-pointer"
            >
              <option value="all">🏢 All 5 Agencies Combined</option>
              {agencies.map(agency => (
                <option key={agency.id} value={agency.id}>
                  {agency.code} - {agency.name} ({agency.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Interactive RBAC Role Switcher */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Shield className={`w-3.5 h-3.5 shrink-0 ${
              currentUser?.role === 'admin'
                ? 'text-purple-600 dark:text-purple-400'
                : currentUser?.role === 'manager'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-amber-600 dark:text-amber-400'
            }`} />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 hidden sm:inline">
                Role:
              </span>
              <select
                id="header-role-switcher"
                value={currentUser?.role || 'admin'}
                onChange={(e) => switchUserRole(e.target.value as UserRole)}
                className="bg-transparent font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-hidden"
                title="Switch active role instantly to test RBAC permissions"
              >
                <option value="admin" className="dark:bg-slate-900 text-slate-900 dark:text-white">
                  👑 Admin (Full Access)
                </option>
                <option value="manager" className="dark:bg-slate-900 text-slate-900 dark:text-white">
                  👔 Manager (Agencies & Orders)
                </option>
                <option value="staff" className="dark:bg-slate-900 text-slate-900 dark:text-white">
                  👷 Staff (View Only)
                </option>
              </select>
            </div>
          </div>

          {/* Quick WhatsApp Order Parser */}
          <button
            id="btn-quick-whatsapp"
            onClick={onOpenWhatsAppModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs"
            title="Paste unstructured order message from WhatsApp or SMS"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">WhatsApp</span> Order Parser
          </button>

          {/* Create New Order (if Admin or Manager) */}
          {canCreateOrders && (
            <button
              id="btn-header-new-order"
              onClick={onOpenNewOrderModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Order</span>
            </button>
          )}

          {/* Dark / Light Theme Toggle in Header */}
          <button
            id="btn-header-theme-toggle"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Alerts Bell */}
          <div className="relative">
            <button
              id="btn-header-alerts"
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {/* Alerts Dropdown Popover */}
            {showAlertsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">Activity & Alerts</span>
                    <span className="text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold px-1.5 py-0.5 rounded-full">
                      {unreadAlerts.length} new
                    </span>
                  </div>
                  {unreadAlerts.length > 0 && (
                    <button
                      onClick={markAllAlertsRead}
                      className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-medium cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                  {alerts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                      No alerts right now
                    </div>
                  ) : (
                    alerts.slice(0, 8).map(alert => (
                      <div
                        key={alert.id}
                        onClick={() => markAlertRead(alert.id)}
                        className={`p-3 text-xs cursor-pointer transition-colors ${
                          !alert.read
                            ? 'bg-purple-50/40 dark:bg-purple-950/30 hover:bg-purple-50/70 dark:hover:bg-purple-900/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-750'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5">
                            {alert.type === 'price_change' && (
                              <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                                <TrendingUp className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {alert.type === 'low_stock' && (
                              <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {alert.type === 'new_order' && (
                              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                                <Package className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {alert.type === 'dispatch' && (
                              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                                <Truck className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-slate-900 dark:text-white leading-tight">
                                {alert.title}
                              </h4>
                              <span className="text-[10px] text-slate-400">
                                {new Date(alert.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed text-[11px]">
                              {alert.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live alerts synchronized with Slack & WhatsApp
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Reset Demo Data */}
          <button
            id="btn-reset-demo-data"
            onClick={() => {
              if (confirm('Reset all inventory, orders, and agency data back to default demo state?')) {
                resetToDemoData();
              }
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
            title="Reset to default sample data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
