import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  MessageSquare,
  Sparkles,
  Send,
  Copy,
  Check,
  CheckCircle2,
  FileText,
  Smartphone,
  ArrowRight,
  ShoppingCart,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { openWhatsAppChat, parseWhatsAppOrderText } from '../utils/whatsapp';
import { OrderItem } from '../types';

interface WhatsAppHubViewProps {
  onOpenNewOrderModal?: () => void;
  onNavigateToOrders?: () => void;
}

interface IncomingMessage {
  id: string;
  senderName: string;
  storeName: string;
  phone: string;
  text: string;
  receivedAt: string;
  status: 'pending' | 'converted';
  convertedOrderId?: string;
}

export const WhatsAppHubView: React.FC<WhatsAppHubViewProps> = ({
  onOpenNewOrderModal,
  onNavigateToOrders,
}) => {
  const { retailers, items, salesOrders, invoices, addSalesOrder, generateInvoiceForOrder } = useApp();

  const [selectedRetailerId, setSelectedRetailerId] = useState<string>(retailers[0]?.id || '');
  const [templateType, setTemplateType] = useState<
    'order_confirm' | 'dispatch' | 'payment_reminder' | 'price_hike'
  >('order_confirm');
  const [copied, setCopied] = useState(false);
  const [convertedOrderAlert, setConvertedOrderAlert] = useState<string | null>(null);

  // Incoming WhatsApp Logs
  const [incomingMessages, setIncomingMessages] = useState<IncomingMessage[]>([
    {
      id: 'wa-msg-1',
      senderName: 'Arun Mehra',
      storeName: 'Quick Mart',
      phone: '+91-98100-99001',
      text: 'Namaste bhai, please send 10 bags Basmati Rice and 5 cans Sunflower Oil today to Quick Mart.',
      receivedAt: 'Today, 10:15 AM',
      status: 'pending',
    },
    {
      id: 'wa-msg-2',
      senderName: 'Pooja Verma',
      storeName: 'City Store',
      phone: '+91-98200-99002',
      text: 'Kal subah 15 bags Wheat Flour aur 8 bags Sugar bhej dena - City Store.',
      receivedAt: 'Today, 09:30 AM',
      status: 'pending',
    },
    {
      id: 'wa-msg-3',
      senderName: 'Kailash Joshi',
      storeName: 'FreshMart',
      phone: '+91-98500-99005',
      text: 'Send 8 bags Basmati Rice and 10 bags Wheat Flour urgently. FreshMart.',
      receivedAt: 'Yesterday, 06:45 PM',
      status: 'converted',
      convertedOrderId: '#ORD-2026-0004',
    },
  ]);

  // Workbench parser state
  const [workbenchText, setWorkbenchText] = useState(
    'Bhai please send 10 bags Basmati Rice and 5 cans Sunflower Oil urgently to Quick Mart.'
  );
  const [workbenchResult, setWorkbenchResult] = useState<any>(null);

  const currentRetailer = retailers.find(r => r.id === selectedRetailerId) || retailers[0];
  const lastOrder = salesOrders.find(o => o.retailerId === currentRetailer?.id) || salesOrders[0];
  const lastInvoice = invoices.find(i => i.retailerId === currentRetailer?.id) || invoices[0];

  // Generate template text based on chosen type
  const getGeneratedMessage = () => {
    if (!currentRetailer) return '';

    switch (templateType) {
      case 'order_confirm':
        return `*AGENCY ORDER CONFIRMATION* 📦
Dear ${currentRetailer.ownerName} (${currentRetailer.storeName}),
Your order *${lastOrder?.orderNumber || '#ORD-2026-0001'}* is confirmed and being packed at our central depot.

*Items:*
${(lastOrder?.items || [])
  .map(i => `• ${i.quantity} ${i.unit} ${i.itemName} @ ₹${i.unitPrice}`)
  .join('\n')}

*Total Amount:* ₹${(lastOrder?.grandTotal || 0).toLocaleString()}
*Status:* Confirmed & Packing

Thank you for your business!`;

      case 'dispatch':
        return `*ORDER DISPATCHED FOR DELIVERY* 🚚
Dear ${currentRetailer.ownerName} (${currentRetailer.storeName}),
Your order *${lastOrder?.orderNumber || '#ORD-2026-0001'}* has been loaded onto our morning delivery vehicle.

*Driver/Tempo Contact:* Central Logistics (+91 98200 00000)
*Expected Arrival:* Today by 2:00 PM
*Invoice Attached:* Yes (#${lastInvoice?.invoiceNumber || 'INV-2026-001'})
*Total Bill Amount:* ₹${(lastOrder?.grandTotal || 0).toLocaleString()}

Please inspect goods upon delivery.`;

      case 'payment_reminder':
        return `*PAYMENT REMINDER - STATEMENT OF ACCOUNT* 💳
Namaste ${currentRetailer.ownerName} ji (${currentRetailer.storeName}),
This is a gentle reminder regarding your outstanding balance with Agency Central Hub.

*Current Outstanding Balance:* ₹${(currentRetailer.outstandingBalance || 0).toLocaleString()}
*Credit Limit:* ₹${(currentRetailer.creditLimit || 0).toLocaleString()}

*Instant UPI Payment ID:* agencyhub@okaxis
*Bank Transfer:* HDFC Bank | A/C: 50200012345678 | IFSC: HDFC0001234

Kindly settle the balance at your earliest convenience to keep stock supply seamless. Thank you!`;

      case 'price_hike':
        return `*IMPORTANT NOTICE: AGENCY PRICE REVISION* 📈
Dear Retail Partners (${currentRetailer.storeName}),
Please note that effective immediately, manufacturing agencies have revised wholesale rates due to raw material increases:

• *StarTex Supplies:* Basmati Rice +4.5%
• *PrimeMart Wholesale:* Edible Oils +3.0%

Orders booked before 5:00 PM today will be honored at old rates. Please plan stock accordingly!`;

      default:
        return '';
    }
  };

  const currentMessage = getGeneratedMessage();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendDirect = () => {
    if (currentRetailer) {
      openWhatsAppChat(currentRetailer.whatsapp, currentMessage);
    }
  };

  const handleRunWorkbenchParse = () => {
    const res = parseWhatsAppOrderText(workbenchText, items, retailers);
    setWorkbenchResult(res);
  };

  // Convert an incoming WhatsApp message into a confirmed Sales Order
  const handleConvertMessageToOrder = (msg: IncomingMessage) => {
    const parsed = parseWhatsAppOrderText(msg.text, items, retailers);
    const retailer =
      retailers.find(r => r.id === parsed.retailerId) ||
      retailers.find(r => r.storeName.toLowerCase() === msg.storeName.toLowerCase()) ||
      retailers[0];

    const orderItems: OrderItem[] = parsed.matchedItems.map(p => {
      const lineTotal = p.quantity * p.item.sellingPrice;
      return {
        itemId: p.item.id,
        itemName: p.item.name,
        sku: p.item.sku,
        agencyId: p.item.agencyId,
        quantity: p.quantity,
        unit: p.item.unit,
        unitPrice: p.item.sellingPrice,
        unitCost: p.item.costPrice,
        taxPercent: p.item.taxPercent || 5,
        total: lineTotal,
      };
    });

    const subtotal = orderItems.reduce((sum, it) => sum + it.total, 0);
    const taxAmount = Math.round(orderItems.reduce((sum, it) => sum + (it.total * it.taxPercent) / 100, 0));
    const grandTotal = subtotal + taxAmount;
    const totalCost = orderItems.reduce((sum, it) => sum + it.quantity * it.unitCost, 0);
    const estimatedProfit = grandTotal - totalCost;

    const created = addSalesOrder({
      retailerId: retailer.id,
      retailerName: retailer.ownerName,
      retailerStore: retailer.storeName,
      retailerWhatsapp: retailer.whatsapp,
      items: orderItems,
      subtotal,
      taxAmount,
      discount: 0,
      grandTotal,
      totalCost,
      estimatedProfit,
      status: 'Confirmed',
      paymentStatus: 'Pending',
      paidAmount: 0,
      source: 'WhatsApp',
      notes: `Converted from WhatsApp: "${msg.text}"`,
      rawWhatsAppText: msg.text,
    });

    // Auto generate invoice
    generateInvoiceForOrder(created.id);

    // Update message status
    setIncomingMessages(prev =>
      prev.map(m =>
        m.id === msg.id ? { ...m, status: 'converted', convertedOrderId: created.orderNumber } : m
      )
    );

    setConvertedOrderAlert(`Order ${created.orderNumber} successfully created for ${retailer.storeName}!`);
    setTimeout(() => setConvertedOrderAlert(null), 6000);
  };

  // Convert workbench parsed result into real order
  const handleConvertWorkbenchToOrder = () => {
    if (!workbenchResult || workbenchResult.matchedItems.length === 0) {
      alert('Please parse text with at least 1 matched item first.');
      return;
    }

    const retailer =
      retailers.find(r => r.id === workbenchResult.retailerId) ||
      retailers.find(r => r.storeName === workbenchResult.retailerStore) ||
      retailers[0];

    const orderItems: OrderItem[] = workbenchResult.matchedItems.map((p: any) => {
      const lineTotal = p.quantity * p.item.sellingPrice;
      return {
        itemId: p.item.id,
        itemName: p.item.name,
        sku: p.item.sku,
        agencyId: p.item.agencyId,
        quantity: p.quantity,
        unit: p.item.unit,
        unitPrice: p.item.sellingPrice,
        unitCost: p.item.costPrice,
        taxPercent: p.item.taxPercent || 5,
        total: lineTotal,
      };
    });

    const subtotal = orderItems.reduce((sum: number, it: OrderItem) => sum + it.total, 0);
    const taxAmount = Math.round(orderItems.reduce((sum: number, it: OrderItem) => sum + (it.total * it.taxPercent) / 100, 0));
    const grandTotal = subtotal + taxAmount;
    const totalCost = orderItems.reduce((sum: number, it: OrderItem) => sum + it.quantity * it.unitCost, 0);
    const estimatedProfit = grandTotal - totalCost;

    const created = addSalesOrder({
      retailerId: retailer.id,
      retailerName: retailer.ownerName,
      retailerStore: retailer.storeName,
      retailerWhatsapp: retailer.whatsapp,
      items: orderItems,
      subtotal,
      taxAmount,
      discount: 0,
      grandTotal,
      totalCost,
      estimatedProfit,
      status: 'Confirmed',
      paymentStatus: 'Pending',
      paidAmount: 0,
      source: 'WhatsApp',
      notes: `Converted from WhatsApp Workbench: "${workbenchText}"`,
      rawWhatsAppText: workbenchText,
    });

    generateInvoiceForOrder(created.id);

    setConvertedOrderAlert(`Order ${created.orderNumber} created for ${retailer.storeName} with GST Invoice!`);
    setTimeout(() => setConvertedOrderAlert(null), 6000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            WhatsApp Automation & Messaging Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Turn unstructured chat messages into confirmed orders, dispatch bills, and collect money with 1 click.
          </p>
        </div>

        {onOpenNewOrderModal && (
          <button
            onClick={onOpenNewOrderModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Smart Order Modal</span>
          </button>
        )}
      </div>

      {/* Success Alert Banner */}
      {convertedOrderAlert && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl p-4 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">{convertedOrderAlert}</span>
          </div>
          {onNavigateToOrders && (
            <button
              onClick={onNavigateToOrders}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              <span>View in Orders</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* 1. Incoming WhatsApp Message Log (With Convert Order Action) */}
      <div className="bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Incoming WhatsApp Orders & Inquiries Log
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click "Convert Order" on any chat below to automatically create a Sales Order and GST Invoice
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
            {incomingMessages.filter(m => m.status === 'pending').length} Pending Conversion
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-[#1e2638]">
          {incomingMessages.map(msg => (
            <div
              key={msg.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#161d2c]/60 p-3 rounded-xl transition-colors"
            >
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{msg.storeName}</span>
                  <span className="text-[11px] text-slate-400">({msg.senderName} • {msg.phone})</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {msg.receivedAt}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-slate-100 dark:bg-[#0f1522] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#1e2638]">
                  "{msg.text}"
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {msg.status === 'converted' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Converted ({msg.convertedOrderId})</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleConvertMessageToOrder(msg)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Convert Order</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Message Generator */}
        <div className="lg:col-span-6 bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Pre-Formatted WhatsApp Business Messages
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">1-Click Dispatch to WhatsApp Web</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Select Retailer
              </label>
              <select
                value={selectedRetailerId}
                onChange={e => setSelectedRetailerId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {retailers.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.storeName} ({r.ownerName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Message Type
              </label>
              <select
                value={templateType}
                onChange={e => setTemplateType(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="order_confirm">📦 Order Confirmation & Packing</option>
                <option value="dispatch">🚚 Dispatch Alert & Driver Info</option>
                <option value="payment_reminder">💳 Payment Due Reminder + UPI</option>
                <option value="price_hike">📈 Supplier Price Revision Notice</option>
              </select>
            </div>
          </div>

          {/* Generated Preview Box */}
          <div className="relative">
            <textarea
              readOnly
              rows={8}
              value={currentMessage}
              className="w-full p-3.5 bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden resize-none leading-relaxed"
            />
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-[#1a2336] hover:bg-slate-100 dark:hover:bg-[#222e47] border border-slate-200 dark:border-[#2b3752] rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Recipient: <strong className="text-slate-800 dark:text-white">{currentRetailer?.whatsapp}</strong>
            </span>
            <button
              onClick={handleSendDirect}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Open in WhatsApp Web / App</span>
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Parsing Workbench */}
        <div className="lg:col-span-6 bg-white dark:bg-[#121824] border border-slate-200 dark:border-[#1e2638] rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Interactive Chat Parser Workbench
            </h3>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">Live NLP Engine</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Test how arbitrary WhatsApp order messages are converted into structured product line items and matched against agency inventories.
          </p>

          <div className="space-y-2 text-xs">
            <textarea
              rows={4}
              value={workbenchText}
              onChange={e => setWorkbenchText(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-[#0f1522] border border-slate-300 dark:border-[#1e2638] rounded-xl font-mono text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={handleRunWorkbenchParse}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors cursor-pointer text-xs shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Parse Now</span>
              </button>
            </div>
          </div>

          {/* Parser Results */}
          {workbenchResult && (
            <div className="p-3.5 bg-slate-50 dark:bg-[#0f1522] rounded-xl border border-slate-200 dark:border-[#1e2638] space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e2638] pb-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Store:{' '}
                  <span className="text-indigo-700 dark:text-indigo-400">
                    {workbenchResult.retailerStore || 'Defaulted to Primary'}
                  </span>
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {workbenchResult.matchedItems.length} Item(s) Extracted
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {workbenchResult.matchedItems.map((it: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-white dark:bg-[#161d2c] rounded-lg border border-slate-200 dark:border-[#1e2638]"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{it.item.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        Agency: {it.item.agencyName} • SKU: {it.item.sku}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {it.quantity} {it.item.unit} × ₹{it.item.sellingPrice}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        = ₹{(it.quantity * it.item.sellingPrice).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-[#1e2638] flex justify-end">
                <button
                  onClick={handleConvertWorkbenchToOrder}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors cursor-pointer text-xs shadow-xs"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Convert to Real Order Now</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
