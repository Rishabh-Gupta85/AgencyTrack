import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Agency,
  Retailer,
  Item,
  PriceChange,
  SalesOrder,
  PurchaseOrder,
  Invoice,
  AlertNotification,
  SlackConfig,
  OrderStatus,
  User,
  UserRole,
  AuditLog,
  ThemeMode,
  Warehouse,
  WarehouseStockItem,
} from '../types';
import {
  INITIAL_AGENCIES,
  INITIAL_RETAILERS,
  INITIAL_ITEMS,
  INITIAL_PRICE_CHANGES,
  INITIAL_SALES_ORDERS,
  INITIAL_INVOICES,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_ALERTS,
  DEFAULT_SLACK_CONFIG,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_WAREHOUSES,
} from '../mockData';

interface AppContextType {
  agencies: Agency[];
  retailers: Retailer[];
  items: Item[];
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  invoices: Invoice[];
  priceChanges: PriceChange[];
  alerts: AlertNotification[];
  slackConfig: SlackConfig;
  selectedAgencyFilter: string; // 'all' or agencyId
  setSelectedAgencyFilter: (id: string) => void;

  // Warehouses
  warehouses: Warehouse[];
  addWarehouse: (warehouse: { name: string; address: string; createdAt?: string }) => void;
  deleteWarehouse: (warehouseId: string) => void;
  addStockToWarehouse: (
    warehouseId: string,
    stockItem: { itemId?: string; itemName: string; quantity: number; addedOn?: string }
  ) => void;
  deleteStockFromWarehouse: (warehouseId: string, stockItemId: string) => void;

  // Theme
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;

  // Auth & Roles
  currentUser: User | null;
  users: User[];
  login: (emailOrRole: string, password?: string) => boolean;
  logout: () => void;
  switchUserRole: (role: UserRole) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  toggleUserStatus: (userId: string) => void;
  canManageAgencies: boolean;
  canCreateOrders: boolean;
  canManageUsers: boolean;
  canManagePricing: boolean;
  canAccessAdmin: boolean;
  canAdjustStock: boolean;
  canCollectPayments: boolean;
  canConfigureSlack: boolean;

  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string, type: AuditLog['type']) => void;

  // Actions
  addSalesOrder: (order: Omit<SalesOrder, 'id' | 'orderNumber' | 'createdAt'>) => SalesOrder;
  updateSalesOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  generateInvoiceForOrder: (orderId: string) => Invoice;
  recordInvoicePayment: (invoiceId: string, amount: number) => void;
  addPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>) => PurchaseOrder;
  updatePurchaseOrderStatus: (poId: string, newStatus: PurchaseOrder['status']) => void;
  updateItemPrice: (itemId: string, newCostPrice: number, newSellingPrice: number, reason: string) => void;
  adjustStock: (itemId: string, deltaQty: number, type: 'in' | 'out', notes?: string) => void;
  addItem: (item: Omit<Item, 'id' | 'lastPriceChangeDate'>) => void;
  addRetailer: (retailer: Omit<Retailer, 'id' | 'totalOrdersPlaced' | 'totalRevenue' | 'lastOrderDate'>) => void;
  updateRetailer: (retailer: Retailer) => void;
  deleteRetailer: (retailerId: string) => void;
  addAgency: (agency: Omit<Agency, 'id' | 'totalOrdersCount' | 'totalSpent'>) => void;
  updateAgency: (agency: Agency) => void;
  deleteAgency: (agencyId: string) => void;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  updateSlackConfig: (config: SlackConfig) => void;
  triggerSlackNotification: (title: string, message: string, color?: string) => Promise<boolean>;
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  AGENCIES: 'agency_track_agencies_v4',
  RETAILERS: 'agency_track_retailers_v4',
  ITEMS: 'agency_track_items_v4',
  SALES_ORDERS: 'agency_track_sales_orders_v4',
  PURCHASE_ORDERS: 'agency_track_purchase_orders_v4',
  INVOICES: 'agency_track_invoices_v4',
  PRICE_CHANGES: 'agency_track_price_changes_v4',
  ALERTS: 'agency_track_alerts_v4',
  SLACK_CONFIG: 'agency_track_slack_v4',
  THEME: 'agency_track_theme_v4',
  CURRENT_USER: 'agency_track_current_user_v4',
  USERS: 'agency_track_users_v4',
  AUDIT_LOGS: 'agency_track_audit_logs_v4',
  WAREHOUSES: 'agency_track_warehouses_v4',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state: defaults to 'dark' to give that sleek dashboard look requested in user screenshot
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved as ThemeMode) || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  // Users & Auth state
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved === 'null') return null;
    return saved ? JSON.parse(saved) : INITIAL_USERS[0]; // default logged in as Admin
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, 'null');
    }
  }, [currentUser]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  const addAuditLog = (action: string, details: string, type: AuditLog['type']) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userName: currentUser ? currentUser.name : 'System',
      userRole: currentUser ? currentUser.role : 'admin',
      action,
      details,
      type,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const login = (emailOrRole: string, _password?: string): boolean => {
    const trimmed = emailOrRole.trim().toLowerCase();
    const matched = users.find(
      u => u.email.toLowerCase() === trimmed || u.role.toLowerCase() === trimmed
    );
    if (matched && matched.active) {
      setCurrentUser(matched);
      addAuditLog('User Login', `${matched.name} (${matched.role}) logged in successfully.`, 'user');
      return true;
    }
    // Fallback: match by role from INITIAL_USERS
    const fallback = users.find(u => u.role === 'admin') || INITIAL_USERS[0];
    setCurrentUser(fallback);
    addAuditLog('User Login', `${fallback.name} logged in.`, 'user');
    return true;
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('User Logout', `${currentUser.name} logged out.`, 'user');
    }
    setCurrentUser(null);
  };

  const switchUserRole = (role: UserRole) => {
    const targetUser = users.find(u => u.role === role) || INITIAL_USERS.find(u => u.role === role) || users[0];
    if (targetUser) {
      setCurrentUser(targetUser);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(targetUser));
      addAuditLog('Role Switched', `Switched active session to ${targetUser.name} (${role.toUpperCase()}).`, 'user');
    }
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers(prev => [...prev, newUser]);
    addAuditLog('Team Member Added', `Added ${newUser.name} with role ${newUser.role}.`, 'user');
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, role } : null);
    }
    addAuditLog('Role Updated', `Updated user ${userId} to role ${role}.`, 'user');
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, active: !u.active } : u))
    );
  };

  // Role permissions
  const role = currentUser?.role;
  const canManageAgencies = role === 'admin' || role === 'manager';
  const canCreateOrders = role === 'admin' || role === 'manager';
  const canManageUsers = role === 'admin';
  const canManagePricing = role === 'admin';
  const canAccessAdmin = role === 'admin';
  const canAdjustStock = role === 'admin' || role === 'manager';
  const canCollectPayments = role === 'admin' || role === 'manager';
  const canConfigureSlack = role === 'admin';
  const [agencies, setAgencies] = useState<Agency[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AGENCIES);
    return saved ? JSON.parse(saved) : INITIAL_AGENCIES;
  });

  const [retailers, setRetailers] = useState<Retailer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RETAILERS);
    return saved ? JSON.parse(saved) : INITIAL_RETAILERS;
  });

  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ITEMS);
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES_ORDERS);
    return saved ? JSON.parse(saved) : INITIAL_SALES_ORDERS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS);
    const rawList: PurchaseOrder[] = saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
    return rawList.map(po => {
      const calcAmount = po.items?.reduce((s, i) => s + (i.total || 0), 0) || 0;
      const amount = po.totalAmount ?? po.totalCost ?? calcAmount;
      return {
        ...po,
        totalAmount: amount,
        totalCost: po.totalCost ?? amount,
        expectedDeliveryDate: po.expectedDeliveryDate || po.expectedDelivery || '',
      };
    });
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [priceChanges, setPriceChanges] = useState<PriceChange[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRICE_CHANGES);
    return saved ? JSON.parse(saved) : INITIAL_PRICE_CHANGES;
  });

  const [alerts, setAlerts] = useState<AlertNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ALERTS);
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [slackConfig, setSlackConfig] = useState<SlackConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SLACK_CONFIG);
    return saved ? JSON.parse(saved) : DEFAULT_SLACK_CONFIG;
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WAREHOUSES);
    return saved ? JSON.parse(saved) : INITIAL_WAREHOUSES;
  });

  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState<string>('all');

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses));
  }, [warehouses]);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AGENCIES, JSON.stringify(agencies));
  }, [agencies]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RETAILERS, JSON.stringify(retailers));
  }, [retailers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES_ORDERS, JSON.stringify(salesOrders));
  }, [salesOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRICE_CHANGES, JSON.stringify(priceChanges));
  }, [priceChanges]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SLACK_CONFIG, JSON.stringify(slackConfig));
  }, [slackConfig]);

  // Slack notification trigger
  const triggerSlackNotification = async (title: string, message: string, color = '#2563eb'): Promise<boolean> => {
    if (!slackConfig.isEnabled) return false;

    const payload = {
      channel: slackConfig.channelName,
      username: slackConfig.botName,
      icon_emoji: ':package:',
      attachments: [
        {
          color: color,
          title: `🔔 ${title}`,
          text: message,
          footer: 'Agency Order & Inventory Hub',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    // If a valid live webhook URL is provided and not the placeholder, attempt POST
    if (slackConfig.webhookUrl && !slackConfig.webhookUrl.includes('00000000')) {
      try {
        await fetch(slackConfig.webhookUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('Slack webhook fetch error (handled gracefully):', err);
      }
    }

    setSlackConfig(prev => ({
      ...prev,
      lastTestedAt: new Date().toISOString(),
    }));

    return true;
  };

  // Add Sales Order
  const addSalesOrder = (orderData: Omit<SalesOrder, 'id' | 'orderNumber' | 'createdAt'>): SalesOrder => {
    const currentYear = new Date().getFullYear();
    const orderNumber = `#ORD-${currentYear}-${String(salesOrders.length + 1).padStart(4, '0')}`;
    const newOrder: SalesOrder = {
      ...orderData,
      id: `so-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
    };

    setSalesOrders(prev => [newOrder, ...prev]);
    addAuditLog('Order Created', `Created order ${newOrder.orderNumber} for ${newOrder.retailerStore} (₹${(newOrder.grandTotal || 0).toLocaleString()})`, 'order');

    // Update items committed stock
    setItems(prev =>
      prev.map(itm => {
        const ordered = newOrder.items.find(i => i.itemId === itm.id);
        if (ordered) {
          return {
            ...itm,
            committedStock: itm.committedStock + ordered.quantity,
          };
        }
        return itm;
      })
    );

    // Update retailer order count & balance
    setRetailers(prev =>
      prev.map(ret => {
        if (ret.id === newOrder.retailerId) {
          return {
            ...ret,
            totalOrdersPlaced: ret.totalOrdersPlaced + 1,
            totalRevenue: ret.totalRevenue + newOrder.grandTotal,
            outstandingBalance: ret.outstandingBalance + (newOrder.paymentStatus === 'Paid' ? 0 : newOrder.grandTotal),
            lastOrderDate: new Date().toISOString().split('T')[0],
          };
        }
        return ret;
      })
    );

    // Add alert
    const newAlert: AlertNotification = {
      id: `alt-${Date.now()}`,
      type: 'new_order',
      title: `New Order: ${newOrder.orderNumber} (${newOrder.retailerStore})`,
      message: `Total: ₹${newOrder.grandTotal.toLocaleString()} for ${newOrder.items.length} items via ${newOrder.source}.`,
      timestamp: new Date().toISOString(),
      read: false,
      severity: 'info',
    };
    setAlerts(prev => [newAlert, ...prev]);

    if (slackConfig.notifyNewOrders) {
      triggerSlackNotification(
        `New Order: ${newOrder.orderNumber}`,
        `Retailer: *${newOrder.retailerStore}*\nAmount: *₹${newOrder.grandTotal.toLocaleString()}*\nItems: ${newOrder.items.map(i => `${i.itemName} (${i.quantity} ${i.unit})`).join(', ')}`,
        '#10b981'
      );
    }

    return newOrder;
  };

  // Update Sales Order Status
  const updateSalesOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    let targetOrder: SalesOrder | undefined;

    setSalesOrders(prev =>
      prev.map(order => {
        if (order.id === orderId) {
          targetOrder = {
            ...order,
            status: newStatus,
            dispatchDate: newStatus === 'Dispatched' ? new Date().toISOString() : order.dispatchDate,
            deliveryDate: newStatus === 'Delivered' ? new Date().toISOString() : order.deliveryDate,
          };
          return targetOrder;
        }
        return order;
      })
    );

    if (!targetOrder) return;

    addAuditLog('Order Status Updated', `Order ${targetOrder.orderNumber} status changed to ${newStatus}`, 'order');

    // When Dispatched: reduce stockOnHand and committedStock
    if (newStatus === 'Dispatched') {
      setItems(prev =>
        prev.map(itm => {
          const ordered = targetOrder!.items.find(i => i.itemId === itm.id);
          if (ordered) {
            const newOnHand = Math.max(0, itm.stockOnHand - ordered.quantity);
            const newCommitted = Math.max(0, itm.committedStock - ordered.quantity);

            // Check if stock now dropped below reorder level
            if (newOnHand <= itm.reorderLevel) {
              const lowStockAlert: AlertNotification = {
                id: `alt-low-${Date.now()}-${itm.id}`,
                type: 'low_stock',
                title: `Low Stock Alert: ${itm.name}`,
                message: `Stock on hand dropped to ${newOnHand} ${itm.unit} (Reorder Level: ${itm.reorderLevel}). Order from ${itm.agencyName}.`,
                timestamp: new Date().toISOString(),
                read: false,
                severity: 'urgent',
                agencyId: itm.agencyId,
              };
              setAlerts(a => [lowStockAlert, ...a]);

              if (slackConfig.notifyLowStock) {
                triggerSlackNotification(
                  `⚠️ Low Stock: ${itm.name}`,
                  `Current Stock: *${newOnHand} ${itm.unit}*\nReorder Threshold: ${itm.reorderLevel}\nSupplier: *${itm.agencyName}*`,
                  '#ef4444'
                );
              }
            }

            return {
              ...itm,
              stockOnHand: newOnHand,
              committedStock: newCommitted,
            };
          }
          return itm;
        })
      );

      // Alert for dispatch
      const dispatchAlert: AlertNotification = {
        id: `alt-disp-${Date.now()}`,
        type: 'dispatch',
        title: `Order Dispatched: ${targetOrder.orderNumber}`,
        message: `Order for ${targetOrder.retailerStore} has been dispatched. Stock deducted.`,
        timestamp: new Date().toISOString(),
        read: false,
        severity: 'info',
      };
      setAlerts(a => [dispatchAlert, ...a]);

      if (slackConfig.notifyDispatches) {
        triggerSlackNotification(
          `🚚 Dispatched: ${targetOrder.orderNumber}`,
          `Retailer: *${targetOrder.retailerStore}*\nAmount: ₹${targetOrder.grandTotal.toLocaleString()}\nStatus: On the way to delivery.`,
          '#3b82f6'
        );
      }
    }

    // If cancelled: restore committed stock
    if (newStatus === 'Cancelled') {
      setItems(prev =>
        prev.map(itm => {
          const ordered = targetOrder!.items.find(i => i.itemId === itm.id);
          if (ordered) {
            return {
              ...itm,
              committedStock: Math.max(0, itm.committedStock - ordered.quantity),
            };
          }
          return itm;
        })
      );
    }
  };

  // Generate Invoice for an Order
  const generateInvoiceForOrder = (orderId: string): Invoice => {
    const existing = invoices.find(inv => inv.salesOrderId === orderId);
    if (existing) return existing;

    const order = salesOrders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const retailer = retailers.find(r => r.id === order.retailerId);

    const invoiceNumber = `INV-2026-${100 + invoices.length + 1}`;
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 14);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      salesOrderId: order.id,
      orderNumber: order.orderNumber,
      retailerId: order.retailerId,
      retailerName: order.retailerName,
      retailerStore: order.retailerStore,
      retailerAddress: retailer?.address || 'Main Market Commercial Road',
      retailerWhatsapp: order.retailerWhatsapp,
      retailerGstin: retailer?.gstin,
      issueDate: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      items: order.items,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      discount: order.discount,
      grandTotal: order.grandTotal,
      paidAmount: order.paidAmount || (order.paymentStatus === 'Paid' ? order.grandTotal : 0),
      balanceDue: order.paymentStatus === 'Paid' ? 0 : order.grandTotal - (order.paidAmount || 0),
      status: order.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid',
      upiId: 'agencyhub@okaxis',
      bankDetails: {
        accountName: 'Agency Central Distribution Hub',
        bankName: 'HDFC Bank Ltd',
        accountNumber: '50200088991122',
        ifsc: 'HDFC0001234',
      },
    };

    setInvoices(prev => [newInvoice, ...prev]);

    // Update sales order with invoiceId
    setSalesOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, invoiceId: newInvoice.id } : o))
    );

    addAuditLog('Invoice Generated', `Generated invoice ${newInvoice.invoiceNumber} for order ${order.orderNumber} (₹${newInvoice.grandTotal.toLocaleString()})`, 'order');

    return newInvoice;
  };

  // Record Invoice Payment
  const recordInvoicePayment = (invoiceId: string, amount: number) => {
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id === invoiceId) {
          const newPaid = inv.paidAmount + amount;
          const newBalance = Math.max(0, inv.grandTotal - newPaid);
          const newStatus = newBalance === 0 ? 'Paid' : 'Partially Paid';

          // Also update corresponding sales order
          setSalesOrders(orders =>
            orders.map(so => {
              if (so.id === inv.salesOrderId) {
                return {
                  ...so,
                  paidAmount: newPaid,
                  paymentStatus: newStatus,
                };
              }
              return so;
            })
          );

          // Update retailer balance
          setRetailers(rets =>
            rets.map(r => {
              if (r.id === inv.retailerId) {
                return {
                  ...r,
                  outstandingBalance: Math.max(0, r.outstandingBalance - amount),
                };
              }
              return r;
            })
          );

          addAuditLog('Payment Recorded', `Recorded payment of ₹${amount.toLocaleString()} for invoice ${inv.invoiceNumber} (${inv.retailerStore})`, 'order');

          return {
            ...inv,
            paidAmount: newPaid,
            balanceDue: newBalance,
            status: newStatus,
          };
        }
        return inv;
      })
    );
  };

  // Add Purchase Order to Agency
  const addPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>): PurchaseOrder => {
    const currentYear = new Date().getFullYear();
    const poNumber = `#ORD-${currentYear}-${String(purchaseOrders.length + 1001).padStart(4, '0')}`;
    const calcAmount = poData.items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
    const finalAmount = poData.totalAmount ?? poData.totalCost ?? calcAmount;
    const newPO: PurchaseOrder = {
      ...poData,
      id: `po-${Date.now()}`,
      poNumber,
      totalAmount: finalAmount,
      totalCost: poData.totalCost ?? finalAmount,
      expectedDeliveryDate: poData.expectedDeliveryDate || poData.expectedDelivery || '',
      createdAt: new Date().toISOString(),
    };

    setPurchaseOrders(prev => [newPO, ...prev]);
    addAuditLog('Purchase Order Placed', `Placed PO ${newPO.poNumber} with ${newPO.agencyName} for ₹${(newPO.totalAmount || 0).toLocaleString()}`, 'order');

    // Update Agency stats
    setAgencies(prev =>
      prev.map(agy => {
        if (agy.id === newPO.agencyId) {
          return {
            ...agy,
            totalOrdersCount: (agy.totalOrdersCount || 0) + 1,
            totalSpent: (agy.totalSpent || 0) + (newPO.totalAmount || 0),
          };
        }
        return agy;
      })
    );

    return newPO;
  };

  // Update PO Status (e.g. Received -> Stock in!)
  const updatePurchaseOrderStatus = (poId: string, newStatus: PurchaseOrder['status']) => {
    let targetPO: PurchaseOrder | undefined;

    setPurchaseOrders(prev =>
      prev.map(po => {
        if (po.id === poId) {
          targetPO = {
            ...po,
            status: newStatus,
            receivedDate: newStatus === 'Received' ? new Date().toISOString() : po.receivedDate,
          };
          return targetPO;
        }
        return po;
      })
    );

    if (!targetPO) return;

    addAuditLog('PO Status Updated', `Purchase order ${targetPO.poNumber} status changed to ${newStatus}`, 'order');

    // When Received: Increase stock on hand!
    if (newStatus === 'Received') {
      setItems(prev =>
        prev.map(itm => {
          const poItem = targetPO!.items.find(i => i.itemId === itm.id);
          if (poItem) {
            return {
              ...itm,
              stockOnHand: itm.stockOnHand + poItem.quantity,
            };
          }
          return itm;
        })
      );

      const alert: AlertNotification = {
        id: `alt-rec-${Date.now()}`,
        type: 'new_order',
        title: `Stock Received: ${targetPO.poNumber}`,
        message: `Received ${targetPO.items.length} items from ${targetPO.agencyName}. Inventory stock updated.`,
        timestamp: new Date().toISOString(),
        read: false,
        severity: 'info',
        agencyId: targetPO.agencyId,
      };
      setAlerts(a => [alert, ...a]);

      if (slackConfig.notifyNewOrders) {
        triggerSlackNotification(
          `📦 Stock Received: ${targetPO.poNumber}`,
          `Supplier: *${targetPO.agencyName}*\nTotal items added: ${targetPO.items.map(i => `${i.itemName} (+${i.quantity})`).join(', ')}`,
          '#10b981'
        );
      }
    }
  };

  // Update Item Price from Agency (Price Alert!)
  const updateItemPrice = (
    itemId: string,
    newCostPrice: number,
    newSellingPrice: number,
    reason: string
  ) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const oldCost = item.costPrice;
    const oldSelling = item.sellingPrice;
    const changePct = Number((((newCostPrice - oldCost) / oldCost) * 100).toFixed(2));

    const priceChangeRecord: PriceChange = {
      id: `pc-${Date.now()}`,
      itemId: item.id,
      itemName: item.name,
      agencyId: item.agencyId,
      agencyName: item.agencyName,
      oldCostPrice: oldCost,
      newCostPrice,
      oldSellingPrice: oldSelling,
      newSellingPrice,
      changePercent: changePct,
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: reason || 'Agency supplier price update',
      notifiedSlack: slackConfig.isEnabled && slackConfig.notifyPriceChanges,
    };

    setPriceChanges(prev => [priceChangeRecord, ...prev]);

    // Update item
    setItems(prev =>
      prev.map(itm => {
        if (itm.id === itemId) {
          return {
            ...itm,
            costPrice: newCostPrice,
            sellingPrice: newSellingPrice,
            lastPriceChangeDate: new Date().toISOString().split('T')[0],
          };
        }
        return itm;
      })
    );

    // Add alert
    const priceAlert: AlertNotification = {
      id: `alt-pc-${Date.now()}`,
      type: 'price_change',
      title: `Price Alert: ${item.name}`,
      message: `${item.agencyName} revised cost: ₹${oldCost} ➔ ₹${newCostPrice} (${changePct > 0 ? '+' : ''}${changePct}%). Selling price set to ₹${newSellingPrice}.`,
      timestamp: new Date().toISOString(),
      read: false,
      severity: changePct > 5 ? 'urgent' : 'warning',
      agencyId: item.agencyId,
    };
    setAlerts(prev => [priceAlert, ...prev]);

    if (slackConfig.notifyPriceChanges) {
      triggerSlackNotification(
        `🚨 Agency Price Change Alert: ${item.name}`,
        `Agency: *${item.agencyName}*\nPrevious Cost: ₹${oldCost}\nNew Cost: *₹${newCostPrice}* (${changePct > 0 ? '+' : ''}${changePct}%)\nNew Retail Selling Price: *₹${newSellingPrice}*\nReason: ${reason || 'Market revision'}`,
        changePct > 0 ? '#f59e0b' : '#10b981'
      );
    }
    addAuditLog('Price Changed', `Updated price for ${item.name}: Cost ₹${newCostPrice}, Selling ₹${newSellingPrice} (${reason || 'Supplier update'})`, 'price');
  };

  // Adjust stock directly
  const adjustStock = (itemId: string, deltaQty: number, type: 'in' | 'out', notes?: string) => {
    const targetItem = items.find(i => i.id === itemId);
    setItems(prev =>
      prev.map(itm => {
        if (itm.id === itemId) {
          const adjustment = type === 'in' ? deltaQty : -deltaQty;
          const newOnHand = Math.max(0, itm.stockOnHand + adjustment);
          return {
            ...itm,
            stockOnHand: newOnHand,
          };
        }
        return itm;
      })
    );
    addAuditLog('Stock Adjusted', `Adjusted ${type === 'in' ? '+' : '-'}${deltaQty} units for ${targetItem?.name || itemId}. Notes: ${notes || 'Manual adjustment'}`, 'inventory');
  };

  // Add Item
  const addItem = (itemData: Omit<Item, 'id' | 'lastPriceChangeDate'>) => {
    const newItem: Item = {
      ...itemData,
      id: `itm-${Date.now()}`,
      lastPriceChangeDate: new Date().toISOString().split('T')[0],
    };
    setItems(prev => [newItem, ...prev]);
    addAuditLog('Product Added', `Added new product ${newItem.name} (SKU: ${newItem.sku}) under ${newItem.agencyName}`, 'inventory');
  };

  // Add Retailer
  const addRetailer = (retailerData: Omit<Retailer, 'id' | 'totalOrdersPlaced' | 'totalRevenue' | 'lastOrderDate'>) => {
    const newRetailer: Retailer = {
      ...retailerData,
      id: `ret-${Date.now()}`,
      totalOrdersPlaced: 0,
      totalRevenue: 0,
      lastOrderDate: new Date().toISOString().split('T')[0],
    };
    setRetailers(prev => [newRetailer, ...prev]);
    addAuditLog('Retailer Added', `Registered retailer ${newRetailer.storeName} (${newRetailer.ownerName || newRetailer.name})`, 'agency');
  };

  const updateRetailer = (updatedRetailer: Retailer) => {
    setRetailers(prev => prev.map(r => (r.id === updatedRetailer.id ? updatedRetailer : r)));
    addAuditLog('Retailer Updated', `Updated retailer profile for ${updatedRetailer.storeName}`, 'agency');
  };

  const deleteRetailer = (retailerId: string) => {
    const target = retailers.find(r => r.id === retailerId);
    setRetailers(prev => prev.filter(r => r.id !== retailerId));
    if (target) {
      addAuditLog('Retailer Deleted', `Removed retailer ${target.storeName} (${target.ownerName || target.name})`, 'agency');
    }
  };

  // Add Agency
  const addAgency = (agencyData: Omit<Agency, 'id' | 'totalOrdersCount' | 'totalSpent'>) => {
    const newAgency: Agency = {
      ...agencyData,
      id: `agy-${Date.now()}`,
      totalOrdersCount: 0,
      totalSpent: 0,
    };
    setAgencies(prev => [newAgency, ...prev]);
    addAuditLog('Agency Created', `Created agency profile for ${newAgency.name}.`, 'agency');
  };

  const updateAgency = (updatedAgency: Agency) => {
    setAgencies(prev => prev.map(a => (a.id === updatedAgency.id ? updatedAgency : a)));
    addAuditLog('Agency Updated', `Updated agency profile for ${updatedAgency.name}.`, 'agency');
  };

  const deleteAgency = (agencyId: string) => {
    const target = agencies.find(a => a.id === agencyId);
    setAgencies(prev => prev.filter(a => a.id !== agencyId));
    if (target) {
      addAuditLog('Agency Deleted', `Removed agency ${target.name}.`, 'agency');
    }
  };

  // Warehouse Management
  const addWarehouse = (data: { name: string; address: string; createdAt?: string }) => {
    const currentFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const newWh: Warehouse = {
      id: `wh-${Date.now()}`,
      name: data.name.trim(),
      address: data.address.trim(),
      createdAt: data.createdAt || currentFormatted,
      items: [],
    };
    setWarehouses(prev => [newWh, ...prev]);
    addAuditLog('Warehouse Created', `Added new warehouse "${newWh.name}" at ${newWh.address}`, 'inventory');
  };

  const deleteWarehouse = (warehouseId: string) => {
    const target = warehouses.find(w => w.id === warehouseId);
    if (!target) return;
    setWarehouses(prev => prev.filter(w => w.id !== warehouseId));
    addAuditLog('Warehouse Deleted', `Deleted warehouse "${target.name}" and removed all stored items`, 'inventory');
  };

  const addStockToWarehouse = (
    warehouseId: string,
    stockItem: { itemId?: string; itemName: string; quantity: number; addedOn?: string }
  ) => {
    const target = warehouses.find(w => w.id === warehouseId);
    if (!target) return;

    const nowFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newItem: WarehouseStockItem = {
      id: `ws-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemId: stockItem.itemId,
      itemName: stockItem.itemName.trim(),
      quantity: Number(stockItem.quantity) || 0,
      addedOn: stockItem.addedOn || nowFormatted,
    };

    setWarehouses(prev =>
      prev.map(w => {
        if (w.id === warehouseId) {
          return {
            ...w,
            items: [newItem, ...w.items],
          };
        }
        return w;
      })
    );

    addAuditLog(
      'Warehouse Stock Added',
      `Added ${newItem.quantity} units of ${newItem.itemName} to ${target.name}`,
      'inventory'
    );
  };

  const deleteStockFromWarehouse = (warehouseId: string, stockItemId: string) => {
    const target = warehouses.find(w => w.id === warehouseId);
    if (!target) return;
    const item = target.items.find(i => i.id === stockItemId);
    if (!item) return;

    setWarehouses(prev =>
      prev.map(w => {
        if (w.id === warehouseId) {
          return {
            ...w,
            items: w.items.filter(i => i.id !== stockItemId),
          };
        }
        return w;
      })
    );

    addAuditLog(
      'Warehouse Stock Removed',
      `Removed ${item.itemName} (${item.quantity} units) from ${target.name}`,
      'inventory'
    );
  };

  const markAlertRead = (id: string) => {
    setAlerts(prev => prev.map(a => (a.id === id ? { ...a, read: true } : a)));
  };

  const markAllAlertsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  const updateSlackConfig = (config: SlackConfig) => {
    setSlackConfig(config);
    addAuditLog('Slack Config Updated', 'Updated Slack webhook notification settings', 'system');
  };

  const resetToDemoData = () => {
    setAgencies(INITIAL_AGENCIES);
    setRetailers(INITIAL_RETAILERS);
    setItems(INITIAL_ITEMS);
    setSalesOrders(INITIAL_SALES_ORDERS);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setInvoices(INITIAL_INVOICES);
    setPriceChanges(INITIAL_PRICE_CHANGES);
    setAlerts(INITIAL_ALERTS);
    setSlackConfig(DEFAULT_SLACK_CONFIG);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setWarehouses(INITIAL_WAREHOUSES);
  };

  return (
    <AppContext.Provider
      value={{
        agencies,
        retailers,
        items,
        warehouses,
        addWarehouse,
        deleteWarehouse,
        addStockToWarehouse,
        deleteStockFromWarehouse,
        salesOrders,
        purchaseOrders,
        invoices,
        priceChanges,
        alerts,
        slackConfig,
        selectedAgencyFilter,
        setSelectedAgencyFilter,
        theme,
        toggleTheme,
        setTheme,
        currentUser,
        users,
        login,
        logout,
        switchUserRole,
        addUser,
        updateUserRole,
        toggleUserStatus,
        canManageAgencies,
        canCreateOrders,
        canManageUsers,
        canManagePricing,
        canAccessAdmin,
        canAdjustStock,
        canCollectPayments,
        canConfigureSlack,
        auditLogs,
        addAuditLog,
        addSalesOrder,
        updateSalesOrderStatus,
        generateInvoiceForOrder,
        recordInvoicePayment,
        addPurchaseOrder,
        updatePurchaseOrderStatus,
        updateItemPrice,
        adjustStock,
        addItem,
        addRetailer,
        updateRetailer,
        deleteRetailer,
        addAgency,
        updateAgency,
        deleteAgency,
        markAlertRead,
        markAllAlertsRead,
        updateSlackConfig,
        triggerSlackNotification,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
