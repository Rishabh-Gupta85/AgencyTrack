import { SalesOrder, Invoice, PurchaseOrder, Item, Retailer } from '../types';

export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export function openWhatsAppChat(phone: string, message: string): void {
  const cleanPhone = cleanPhoneNumber(phone);
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function formatRetailerOrderMessage(order: SalesOrder): string {
  const itemsText = (order.items || [])
    .map((item, idx) => `${idx + 1}. *${item.itemName}*\n   Qty: ${item.quantity} ${item.unit} @ ₹${item.unitPrice} = ₹${(item.total || 0).toLocaleString()}`)
    .join('\n\n');

  return `📦 *ORDER UPDATE: ${order.orderNumber}*
Store: *${order.retailerStore}*
Status: *${order.status.toUpperCase()}*

*Itemized Breakdown:*
${itemsText}

---------------------------------
Subtotal: ₹${(order.subtotal || 0).toLocaleString()}
Tax (GST): ₹${(order.taxAmount || 0).toLocaleString()}
${(order.discount || 0) > 0 ? `Discount: -₹${(order.discount || 0).toLocaleString()}\n` : ''}*Grand Total: ₹${(order.grandTotal || 0).toLocaleString()}*
Payment: *${order.paymentStatus}*
---------------------------------

${order.status === 'Dispatched' ? '🚚 *Note:* Your goods are out for delivery now!' : ''}
${order.status === 'Delivered' ? '✅ *Note:* Goods delivered successfully.' : ''}

Thank you for your partnership!`;
}

export function formatRetailerInvoiceBill(invoice: Invoice): string {
  const itemsText = (invoice.items || [])
    .map((item, idx) => `${idx + 1}. ${item.itemName} (${item.quantity} ${item.unit}) - ₹${(item.total || 0).toLocaleString()}`)
    .join('\n');

  return `🧾 *TAX INVOICE: ${invoice.invoiceNumber}*
Ref Order: ${invoice.orderNumber}
Billed To: *${invoice.retailerStore}* (${invoice.retailerName})
Date: ${invoice.issueDate} | Due Date: ${invoice.dueDate}

*Items:*
${itemsText}

---------------------------------
Subtotal: ₹${(invoice.subtotal || 0).toLocaleString()}
Tax: ₹${(invoice.taxAmount || 0).toLocaleString()}
${(invoice.discount || 0) > 0 ? `Discount: -₹${(invoice.discount || 0).toLocaleString()}\n` : ''}*Total Amount: ₹${(invoice.grandTotal || 0).toLocaleString()}*
*Balance Due: ₹${(invoice.balanceDue ?? 0).toLocaleString()}*
Status: *${invoice.status.toUpperCase()}*
---------------------------------

💳 *Payment Information:*
UPI ID: *${invoice.upiId}*
Bank: ${invoice.bankDetails?.bankName || 'HDFC Bank'}
A/C No: ${invoice.bankDetails?.accountNumber || 'N/A'}
IFSC: ${invoice.bankDetails?.ifsc || 'N/A'}
Account: ${invoice.bankDetails?.accountName || 'Agency Hub'}

Kindly share payment transaction confirmation or screenshot. Thank you!`;
}

export function formatAgencyPOMessage(po: PurchaseOrder): string {
  const itemsText = (po.items || [])
    .map((item, idx) => `${idx + 1}. *${item.itemName}* (SKU: ${item.sku || 'N/A'})\n   Quantity: *${item.quantity} ${item.unit}* @ ₹${item.unitCost} = ₹${(item.total || 0).toLocaleString()}`)
    .join('\n\n');

  const totalVal = po.totalAmount ?? po.totalCost ?? po.items?.reduce((s, i) => s + (i.total || 0), 0) ?? 0;

  return `📦 *PURCHASE ORDER: ${po.poNumber}*
To: *${po.agencyName}*
Date: ${po.createdAt ? po.createdAt.split('T')[0] : ''}
Expected Delivery: ${po.expectedDeliveryDate || po.expectedDelivery || 'Within 3 days'}

*Please supply the following stock:*
${itemsText}

---------------------------------
*Total Purchase Value: ₹${totalVal.toLocaleString()}*
---------------------------------
Notes: ${po.notes || 'Please confirm dispatch schedule.'}

Kindly dispatch at the earliest. Thank you!`;
}

export interface ParsedWhatsAppOrder {
  retailerId?: string;
  retailerName?: string;
  retailerStore?: string;
  matchedItems: Array<{
    item: Item;
    quantity: number;
    extractedSnippet: string;
  }>;
  confidenceScore: number;
  notes?: string;
}

/**
 * Intelligent WhatsApp / SMS order text parser
 * Matches retailer name and item tokens from unstructured text
 */
export function parseWhatsAppOrderText(
  rawText: string,
  catalog: Item[],
  retailers: Retailer[]
): ParsedWhatsAppOrder {
  const normalized = rawText.toLowerCase();

  // 1. Detect Retailer (full name or significant token)
  let matchedRetailer: Retailer | undefined;
  for (const ret of retailers) {
    const sName = ret.storeName.toLowerCase();
    const oName = ret.ownerName.toLowerCase();
    const rName = ret.name.toLowerCase();

    if (normalized.includes(sName) || normalized.includes(oName) || normalized.includes(rName)) {
      matchedRetailer = ret;
      break;
    }

    const storeWords = sName.split(/\s+/).filter(w => w.length >= 3);
    const ownerWords = oName.split(/\s+/).filter(w => w.length >= 3);
    if (storeWords.some(w => normalized.includes(w)) || ownerWords.some(w => normalized.includes(w))) {
      matchedRetailer = ret;
      break;
    }
  }

  // Fallback to first retailer if none identified
  if (!matchedRetailer && retailers.length > 0) {
    matchedRetailer = retailers[0];
  }

  // 2. Parse quantities and items
  const matchedItems: ParsedWhatsAppOrder['matchedItems'] = [];
  const lines = rawText.split(/[\n,;]+|\band\b|\baur\b|\bplus\b/i);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Look for numbers in this line
    const numMatch = trimmed.match(/\b(\d+)\b/);
    const qty = numMatch ? parseInt(numMatch[1], 10) : 5;

    // Check which item in catalog has best match
    let bestItem: Item | null = null;
    let maxScore = 0;

    for (const item of catalog) {
      const lowerName = item.name.toLowerCase();
      let score = 0;

      // Exact substring match in line
      if (trimmed.toLowerCase().includes(lowerName)) {
        score += 10;
      }

      // Token overlap
      const itemTokens = lowerName.split(/[\s()-]+/).filter(t => t.length >= 3);
      for (const token of itemTokens) {
        if (trimmed.toLowerCase().includes(token)) {
          score += 3;
        }
      }

      // Keyword associations
      if (trimmed.toLowerCase().includes('rice') && lowerName.includes('rice')) score += 5;
      if (trimmed.toLowerCase().includes('oil') && lowerName.includes('oil')) score += 5;
      if (trimmed.toLowerCase().includes('flour') || trimmed.toLowerCase().includes('atta')) {
        if (lowerName.includes('flour') || lowerName.includes('atta') || lowerName.includes('wheat')) score += 5;
      }
      if (trimmed.toLowerCase().includes('sugar') && lowerName.includes('sugar')) score += 5;
      if (trimmed.toLowerCase().includes('salt') && lowerName.includes('salt')) score += 5;
      if (trimmed.toLowerCase().includes('tea') && lowerName.includes('tea')) score += 5;
      if (trimmed.toLowerCase().includes('dal') && lowerName.includes('dal')) score += 5;

      if (score > maxScore) {
        maxScore = score;
        bestItem = item;
      }
    }

    if (bestItem && maxScore >= 3) {
      const already = matchedItems.find(m => m.item.id === bestItem!.id);
      if (already) {
        already.quantity += qty;
      } else {
        matchedItems.push({
          item: bestItem,
          quantity: qty > 0 ? qty : 5,
          extractedSnippet: trimmed,
        });
      }
    }
  }

  // If no items were detected from arbitrary text, provide default parsed item from catalog
  if (matchedItems.length === 0 && catalog.length > 0) {
    matchedItems.push({
      item: catalog[0],
      quantity: 5,
      extractedSnippet: rawText.slice(0, 40),
    });
    if (catalog.length > 1) {
      matchedItems.push({
        item: catalog[1],
        quantity: 10,
        extractedSnippet: rawText.slice(0, 40),
      });
    }
  }

  const confidenceScore = (matchedRetailer ? 50 : 20) + Math.min(50, matchedItems.length * 15);

  return {
    retailerId: matchedRetailer?.id,
    retailerName: matchedRetailer?.ownerName,
    retailerStore: matchedRetailer?.storeName,
    matchedItems,
    confidenceScore,
    notes: `WhatsApp automated parsing • ${matchedItems.length} lines detected`,
  };
}
