export type AgencyCategory =
  | 'FMCG'
  | 'Beverages'
  | 'Packaged Foods'
  | 'Personal Care'
  | 'Commodities & Grains'
  | 'Grains & Staples'
  | 'Edible Oils & Pulses'
  | 'Sugar & Pulses'
  | 'Mustard Oil & Spices'
  | 'Salt & Essentials'
  | string;

export interface Agency {
  id: string;
  name: string;
  code: string;
  category: AgencyCategory;
  whatsapp: string;
  phone: string;
  email: string;
  contactPerson: string;
  address: string;
  paymentTerms: string;
  leadTimeDays: number;
  totalOrdersCount: number;
  totalSpent: number;
  rating: number;
  badgeColor: string;
  notes: string;
}

export interface Retailer {
  id: string;
  name: string;
  storeName: string;
  ownerName: string;
  whatsapp: string;
  phone: string;
  address: string;
  city: string;
  gstin?: string;
  creditLimit: number;
  outstandingBalance: number;
  totalOrdersPlaced: number;
  totalRevenue: number;
  lastOrderDate: string;
  paymentRating: 'Excellent' | 'Good' | 'Needs Follow-up';
}

export type ItemUnit =
  | 'Box'
  | 'Carton'
  | 'Pack'
  | 'Case'
  | 'Kg'
  | 'Bottle'
  | 'Tin'
  | 'Bags'
  | 'Bag'
  | 'Can'
  | string;

export interface Item {
  id: string;
  agencyId: string;
  agencyName: string;
  name: string;
  sku: string;
  category: string;
  unit: ItemUnit;
  costPrice: number; // Price bought from Agency
  sellingPrice: number; // Price sold to Retailer
  stockOnHand: number;
  committedStock: number; // In active confirmed orders not yet dispatched
  reorderLevel: number;
  hsnCode: string;
  taxPercent: number; // e.g. 5, 12, 18
  barcode?: string;
  lastPriceChangeDate: string;
}

export interface PriceChange {
  id: string;
  itemId: string;
  itemName: string;
  agencyId: string;
  agencyName: string;
  oldCostPrice: number;
  newCostPrice: number;
  oldSellingPrice: number;
  newSellingPrice: number;
  changePercent: number;
  effectiveDate: string;
  reason: string;
  notifiedSlack: boolean;
}

export type OrderStatus =
  | 'Draft'
  | 'Confirmed'
  | 'Packed'
  | 'Dispatched'
  | 'Delivered'
  | 'Cancelled'
  | 'Received';

export type PaymentStatus =
  | 'Pending'
  | 'Partially Paid'
  | 'Paid'
  | 'Unpaid'
  | 'Overdue';

export type OrderSource =
  | 'WhatsApp'
  | 'Phone Call'
  | 'Chat'
  | 'In-Person'
  | 'Manual';

export interface OrderItem {
  itemId: string;
  itemName: string;
  sku: string;
  agencyId: string;
  quantity: number;
  unit: ItemUnit;
  unitPrice: number; // Selling price to retailer
  unitCost: number;  // Cost price from agency
  taxPercent: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string; // SO-2026-001
  retailerId: string;
  retailerName: string;
  retailerStore: string;
  retailerWhatsapp: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  grandTotal: number;
  totalCost: number;
  estimatedProfit: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  source: OrderSource;
  createdAt: string;
  dispatchDate?: string;
  deliveryDate?: string;
  notes?: string;
  rawWhatsAppText?: string;
  invoiceId?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // PO-AGY-001
  agencyId: string;
  agencyName: string;
  agencyWhatsapp: string;
  items: Array<{
    itemId: string;
    itemName: string;
    sku?: string;
    quantity: number;
    unit: ItemUnit;
    unitCost: number;
    total: number;
  }>;
  totalAmount?: number;
  totalCost?: number;
  status:
    | 'Draft'
    | 'Sent via WhatsApp'
    | 'Confirmed'
    | 'Received'
    | 'Cancelled'
    | 'Pending';
  createdAt: string;
  expectedDelivery?: string;
  expectedDeliveryDate?: string;
  receivedAt?: string;
  receivedDate?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // INV-2026-001
  salesOrderId?: string;
  orderId?: string;
  orderNumber: string;
  retailerId: string;
  retailerName: string;
  retailerStore: string;
  retailerAddress: string;
  retailerWhatsapp: string;
  retailerGstin?: string;
  issueDate?: string;
  issuedDate?: string;
  dueDate: string;
  items: Array<any>;
  subtotal: number;
  taxAmount: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';
  upiId?: string;
  bankDetails?: {
    accountName: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
  };
}

export interface AlertNotification {
  id: string;
  type: 'price_change' | 'low_stock' | 'new_order' | 'dispatch' | 'payment_due';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: 'info' | 'warning' | 'urgent';
  agencyId?: string;
  actionUrl?: string;
}

export interface SlackConfig {
  webhookUrl: string;
  channelName: string;
  botName: string;
  isEnabled: boolean;
  notifyPriceChanges: boolean;
  notifyLowStock: boolean;
  notifyNewOrders: boolean;
  notifyDispatches: boolean;
  lastTestedAt?: string;
}

export type UserRole = 'admin' | 'manager' | 'staff';
export type Role = UserRole;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  title: string;
  phone?: string;
  createdAt: string;
  active: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  type: 'order' | 'agency' | 'inventory' | 'user' | 'price' | 'system';
}

export interface WarehouseStockItem {
  id: string;
  itemId?: string;
  itemName: string;
  sku?: string;
  quantity: number;
  addedOn: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  items: WarehouseStockItem[];
}

export type ThemeMode = 'light' | 'dark';
