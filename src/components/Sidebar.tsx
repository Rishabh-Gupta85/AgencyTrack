import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutGrid,
  Building2,
  Users,
  Package,
  FileText,
  Box,
  Receipt,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { alerts, theme, toggleTheme, currentUser, logout } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const unreadAlertsCount = alerts.filter(a => !a.read).length || 3;
  const isStaff = currentUser?.role === 'staff';

  const allNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
      badge: null,
    },
    {
      id: 'agencies',
      label: 'Agencies',
      icon: Building2,
      badge: null,
    },
    {
      id: 'retailers',
      label: 'Retailers',
      icon: Users,
      badge: null,
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      badge: null,
    },
    {
      id: 'all_orders',
      label: isStaff ? 'Incoming Orders' : 'Orders',
      icon: FileText,
      badge: null,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Box,
      badge: null,
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'price_alerts',
      label: 'Price Alerts',
      icon: AlertTriangle,
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : null,
      badgeColor: 'bg-rose-500 text-white font-bold',
    },
    {
      id: 'admin',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  // Restrict staff strictly to orders (incoming) and inventory
  const navItems = isStaff
    ? allNavItems.filter(item => item.id === 'all_orders' || item.id === 'inventory')
    : allNavItems;

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-60'
      } bg-[#0b0f19] text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-[#161f30] select-none transition-all duration-200 justify-between`}
    >
      <div>
        {/* Brand Header matching Screenshot 1 & 8 */}
        <div className="p-4 flex items-center gap-3 border-b border-[#161f30]/60">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <LayoutGrid className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-white text-base leading-tight tracking-tight">
                AgencyTrack
              </h1>
              <p className="text-xs text-slate-400 font-medium">Inventory Manager</p>
            </div>
          )}
        </div>

        {/* Navigation List matching Screenshot 8 */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (item.id === 'all_orders' &&
                (activeTab === 'all_orders' ||
                  activeTab === 'sales_orders' ||
                  activeTab === 'purchase_orders'));

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-2' : 'justify-between px-3.5'
                } py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#131b2e] font-medium'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Area: Collapse Button matching Screenshot 1 & 8 */}
      <div className="p-3 border-t border-[#161f30] space-y-2">
        {/* Light / Dark Mode Toggle */}
        <div className="bg-[#111827] rounded-xl p-1 border border-slate-800">
          {isCollapsed ? (
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-center p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-400" />
              )}
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => theme === 'dark' && toggleTheme()}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-slate-800 text-amber-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => theme === 'light' && toggleTheme()}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
            </div>
          )}
        </div>

        {/* User Mini Bar */}
        {!isCollapsed && currentUser && (
          <div className="px-3 py-1.5 flex items-center justify-between text-xs bg-[#111827] rounded-lg border border-slate-800">
            <div className="min-w-0">
              <p className="font-semibold text-white truncate text-[11px]">{currentUser.name}</p>
              <p className="text-[10px] text-indigo-400 capitalize">{currentUser.role}</p>
            </div>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-rose-400 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Collapse Button */}
        <button
          id="btn-sidebar-collapse"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#131b2e] transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
