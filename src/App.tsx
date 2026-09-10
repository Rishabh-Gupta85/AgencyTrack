import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { AllOrdersView } from './components/AllOrdersView';
import { SalesOrdersView } from './components/SalesOrdersView';
import { InvoicesView } from './components/InvoicesView';
import { PurchaseOrdersView } from './components/PurchaseOrdersView';
import { RetailersView } from './components/RetailersView';
import { AgenciesView } from './components/AgenciesView';
import { ProductsView } from './components/ProductsView';
import { PriceAlertsView } from './components/PriceAlertsView';
import { WhatsAppHubView } from './components/WhatsAppHubView';
import { SlackConfigView } from './components/SlackConfigView';
import { AdminView } from './components/AdminView';
import { LoginView } from './components/LoginView';
import { WhatsAppOrderModal } from './components/WhatsAppOrderModal';
import { NewOrderModal } from './components/NewOrderModal';
import { InvoiceModal } from './components/InvoiceModal';
import { Invoice } from './types';
import { Menu, X } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { invoices, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // If user is not logged in, show Login page with role-selection & authentication
  if (!currentUser) {
    return <LoginView />;
  }

  const isStaff = currentUser?.role === 'staff';

  // Automatically enforce view restrictions for staff
  React.useEffect(() => {
    if (isStaff && activeTab !== 'all_orders' && activeTab !== 'inventory') {
      setActiveTab('all_orders');
    }
  }, [isStaff, activeTab]);

  // Helper to open invoice by id
  const handleOpenInvoiceById = (invoiceId: string) => {
    const found = invoices.find(inv => inv.id === invoiceId);
    if (found) {
      setSelectedInvoice(found);
    }
  };

  const handleNavigate = (tab: string) => {
    if (isStaff && tab !== 'all_orders' && tab !== 'inventory') {
      setActiveTab('all_orders');
    } else {
      setActiveTab(tab);
    }
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Mobile Sidebar Toggle Header Bar */}
      <div className="md:hidden bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-white px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-[#161f30]">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 bg-slate-100 dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-xl text-slate-700 dark:text-slate-200"
        >
          {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>Menu</span>
        </button>
        <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">AgencyTrack</span>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar activeTab={activeTab} setActiveTab={handleNavigate} />
        </div>

        {/* Mobile Drawer Sidebar */}
        {isMobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative z-50 w-64 bg-[#0b0f19] h-full overflow-y-auto">
              <Sidebar activeTab={activeTab} setActiveTab={handleNavigate} />
            </div>
          </div>
        )}

        {/* View Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0b0f19]">
          {!isStaff && activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={handleNavigate}
              onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
              onOpenNewOrderModal={() => setIsNewOrderModalOpen(true)}
            />
          )}

          {/* Unified All Orders Section (Both Retailer Orders and Agency Orders) */}
          {(activeTab === 'all_orders' || activeTab === 'sales_orders' || activeTab === 'purchase_orders') && (
            <AllOrdersView
              onOpenNewOrderModal={() => setIsNewOrderModalOpen(true)}
              onOpenInvoice={handleOpenInvoiceById}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              onOpenNewPOWithItem={() => {
                setActiveTab('all_orders');
              }}
            />
          )}

          {!isStaff && activeTab === 'invoices' && (
            <InvoicesView onOpenInvoiceModal={inv => setSelectedInvoice(inv)} />
          )}

          {!isStaff && activeTab === 'retailers' && (
            <RetailersView
              onOpenInvoiceModal={inv => setSelectedInvoice(inv)}
              onOpenCreateOrder={() => setIsNewOrderModalOpen(true)}
            />
          )}

          {!isStaff && activeTab === 'products' && <ProductsView />}

          {!isStaff && activeTab === 'agencies' && <AgenciesView />}

          {!isStaff && activeTab === 'price_alerts' && <PriceAlertsView />}

          {!isStaff && activeTab === 'whatsapp_hub' && (
            <WhatsAppHubView onOpenNewOrderModal={() => setIsNewOrderModalOpen(true)} />
          )}

          {!isStaff && activeTab === 'slack' && <SlackConfigView />}

          {/* Admin Management Tab */}
          {!isStaff && activeTab === 'admin' && <AdminView />}
        </main>
      </div>

      {/* Modals */}
      <WhatsAppOrderModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
      />

      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
      />

      <InvoiceModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
