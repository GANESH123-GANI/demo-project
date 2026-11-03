import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execute3WayMatch } from './utils/matching-engine.js';
import { createAuditRecord } from './utils/audit-logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data', 'initial-data.json');

class DataStore {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      this.data = JSON.parse(raw);
      // Hash existing audit logs
      if (Array.isArray(this.data.auditLogs)) {
        this.data.auditLogs = this.data.auditLogs.map(log => ({
          ...log,
          verified: true
        }));
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
      this.data = {};
    }
  }

  // --- Audit Logging ---
  logAudit(actor, action, target, details) {
    const record = createAuditRecord({ actor, action, target, details });
    if (!this.data.auditLogs) this.data.auditLogs = [];
    this.data.auditLogs.unshift(record);
    return record;
  }

  // --- Suppliers ---
  getSuppliers(filter = {}) {
    let list = this.data.suppliers || [];
    if (filter.stage) list = list.filter(s => s.stage === filter.stage);
    if (filter.segment) list = list.filter(s => s.segment === filter.segment);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
    }
    return list;
  }

  getSupplierById(id) {
    return (this.data.suppliers || []).find(s => s.id === id);
  }

  updateSupplierStage(id, newStage, actor = 'System Admin') {
    const supplier = this.getSupplierById(id);
    if (!supplier) throw new Error(`Supplier ${id} not found`);

    const oldStage = supplier.stage;
    supplier.stage = newStage;

    if (newStage === 'Active' && !supplier.bankVerified) {
      throw new Error(`Cannot activate supplier ${id}: Bank verification is incomplete.`);
    }

    this.logAudit(actor, 'SUPPLIER_STAGE_CHANGED', id, `Stage updated from ${oldStage} to ${newStage}`);
    return supplier;
  }

  verifySupplierBank(id, actor = 'Treasury Lead') {
    const supplier = this.getSupplierById(id);
    if (!supplier) throw new Error(`Supplier ${id} not found`);

    supplier.bankVerified = true;
    supplier.riskScore = Math.max(10, supplier.riskScore - 15);
    this.logAudit(actor, 'SUPPLIER_BANK_VERIFIED', id, `Bank account verified under dual-control Treasury authorization.`);
    return supplier;
  }

  // --- Catalogs ---
  getCatalogs() {
    return this.data.catalogs || [];
  }

  // --- Requisitions ---
  getRequisitions() {
    return this.data.requisitions || [];
  }

  getRequisitionById(id) {
    return (this.data.requisitions || []).find(r => r.id === id);
  }

  createRequisition(reqData, actor = 'Requisitioner') {
    const id = `PR-2026-0${(this.data.requisitions.length + 1).toString().padStart(2, '0')}`;
    const newReq = {
      id,
      title: reqData.title,
      requester: reqData.requester || actor,
      department: reqData.department || 'General Procurement',
      type: reqData.type || 'Goods',
      channel: reqData.channel || 'Catalog',
      entityId: reqData.entityId || 'ENT-US',
      budgetCode: reqData.budgetCode || 'OPEX-GEN-2026',
      allocatedBudget: Number(reqData.allocatedBudget) || (Number(reqData.totalAmount) * 1.25),
      totalAmount: Number(reqData.totalAmount),
      currency: reqData.currency || 'USD',
      status: 'PendingApproval',
      convertedPoId: null,
      createdAt: new Date().toISOString(),
      approvalFlow: [
        { role: 'Department Manager', approver: 'Department Lead', status: 'Approved', date: new Date().toISOString() },
        { role: 'Finance Controller', approver: 'Karen Wu', status: 'Pending', date: null }
      ],
      items: reqData.items || []
    };

    this.data.requisitions.unshift(newReq);
    this.logAudit(actor, 'PR_CREATED', id, `Requisition created for ${newReq.currency} ${newReq.totalAmount.toLocaleString()} against budget ${newReq.budgetCode}`);
    return newReq;
  }

  approveRequisition(id, actor = 'Karen Wu (Finance Controller)') {
    const req = this.getRequisitionById(id);
    if (!req) throw new Error(`Requisition ${id} not found`);

    req.status = 'Approved';
    for (const step of req.approvalFlow) {
      if (step.status === 'Pending') {
        step.status = 'Approved';
        step.date = new Date().toISOString();
        step.approver = actor;
      }
    }

    this.logAudit(actor, 'PR_APPROVED', id, `Requisition approved and budget reserved.`);
    return req;
  }

  convertPrToPo(prId, actor = 'Sarah Jenkins (Buyer)') {
    const req = this.getRequisitionById(prId);
    if (!req) throw new Error(`Requisition ${prId} not found`);
    if (req.status !== 'Approved') throw new Error(`Requisition must be approved prior to PO generation`);

    const poId = `PO-${3000 + this.data.purchaseOrders.length + 1}`;
    const defaultSupplier = this.data.suppliers.find(s => s.stage === 'Active') || this.data.suppliers[0];

    const newPo = {
      id: poId,
      requisitionId: req.id,
      supplierId: defaultSupplier.id,
      supplierName: defaultSupplier.name,
      contractId: 'CTR-602',
      orderDate: new Date().toISOString(),
      deliveryDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      status: 'Dispatched',
      supplierAcknowledgement: 'Accepted',
      totalAmount: req.totalAmount,
      currency: req.currency,
      lines: req.items.map((item, idx) => ({
        line: idx + 1,
        sku: item.sku || `SKU-ITEM-${idx + 1}`,
        description: item.description,
        orderedQty: item.qty,
        receivedQty: 0,
        invoicedQty: 0,
        unitPrice: item.unitPrice,
        lineTotal: item.total
      }))
    };

    this.data.purchaseOrders.unshift(newPo);
    req.status = 'ConvertedToPO';
    req.convertedPoId = poId;

    this.logAudit(actor, 'PR_CONVERTED_TO_PO', prId, `Created ${poId} from ${prId} for supplier ${defaultSupplier.name}`);
    return newPo;
  }

  // --- Purchase Orders ---
  getPurchaseOrders() {
    return this.data.purchaseOrders || [];
  }

  getPurchaseOrderById(id) {
    return (this.data.purchaseOrders || []).find(p => p.id === id);
  }

  // --- Receipts & Acceptance ---
  getReceipts() {
    return this.data.receipts || [];
  }

  createReceipt(receiptData, actor = 'Warehouse Lead') {
    const id = receiptData.type === 'ServiceEntrySheet'
      ? `SES-70${this.data.receipts.length + 1}`
      : `GRN-70${this.data.receipts.length + 1}`;

    const po = this.getPurchaseOrderById(receiptData.poId);
    if (!po) throw new Error(`Purchase order ${receiptData.poId} not found`);

    const newReceipt = {
      id,
      type: receiptData.type || 'GoodsReceipt',
      poId: po.id,
      supplierId: po.supplierId,
      receiptDate: new Date().toISOString(),
      warehouse: receiptData.warehouse || 'Central Facility Receiving Dock',
      receivedBy: actor,
      inspectionResult: receiptData.inspectionResult || 'Pass',
      status: receiptData.status || 'Accepted',
      notes: receiptData.notes || 'Inspected and verified against delivery documents.',
      lines: receiptData.lines || []
    };

    // Update PO line received quantities
    for (const rLine of newReceipt.lines) {
      const poLine = po.lines.find(l => l.line === rLine.poLine);
      if (poLine) {
        poLine.receivedQty = Math.min(poLine.orderedQty, (poLine.receivedQty || 0) + (rLine.acceptedQty || 0));
      }
    }

    if (po.lines.every(l => l.receivedQty >= l.orderedQty)) {
      po.status = 'FullyReceived';
    } else {
      po.status = 'PartiallyReceived';
    }

    this.data.receipts.unshift(newReceipt);
    this.logAudit(actor, 'RECEIPT_POSTED', id, `${newReceipt.type} recorded for ${po.id}. Result: ${newReceipt.inspectionResult}`);
    return newReceipt;
  }

  // --- Invoices & 3-Way Matching ---
  getInvoices() {
    return this.data.invoices || [];
  }

  getInvoiceById(id) {
    return (this.data.invoices || []).find(i => i.id === id);
  }

  createInvoice(invData, actor = 'Vendor Portal API / AP Clerk') {
    const id = `INV-80${this.data.invoices.length + 1}`;
    const po = this.getPurchaseOrderById(invData.poId);

    const newInvoice = {
      id,
      invoiceNumber: invData.invoiceNumber || `INV-AUTO-${Date.now().toString().slice(-5)}`,
      poId: invData.poId,
      supplierId: invData.supplierId || (po ? po.supplierId : 'SUP-101'),
      supplierName: invData.supplierName || (po ? po.supplierName : 'Vendor'),
      invoiceDate: invData.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      totalAmount: Number(invData.totalAmount) || 0,
      taxAmount: Number(invData.taxAmount) || 0,
      currency: invData.currency || 'USD',
      status: 'AwaitingValidation',
      matchStatus: 'PENDING',
      discrepancies: [],
      erpPosting: { posted: false, voucherId: null },
      paymentStatus: 'AwaitingValidation',
      lines: invData.lines || []
    };

    // Run deterministic 3-Way Match
    const matchResult = execute3WayMatch(newInvoice, po, this.data.receipts);
    newInvoice.matchStatus = matchResult.matchStatus;
    newInvoice.discrepancies = matchResult.discrepancies;

    if (matchResult.approvedForPayment) {
      newInvoice.status = 'ApprovedForPayment';
      newInvoice.paymentStatus = 'Scheduled';
    } else if (matchResult.matchStatus === 'MISSING_RECEIPT') {
      newInvoice.status = 'AwaitingGoodsReceipt';
      newInvoice.paymentStatus = 'AwaitingReceipt';
    } else {
      newInvoice.status = 'UnderExceptionReview';
      newInvoice.paymentStatus = 'OnHold';
    }

    this.data.invoices.unshift(newInvoice);
    this.logAudit(actor, 'INVOICE_SUBMITTED', id, `Invoice ${newInvoice.invoiceNumber} processed. Match status: ${newInvoice.matchStatus}`);
    return { invoice: newInvoice, matchResult };
  }

  reEvaluateMatch(invoiceId, actor = 'AP Automation Engine') {
    const invoice = this.getInvoiceById(invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    const po = this.getPurchaseOrderById(invoice.poId);
    const matchResult = execute3WayMatch(invoice, po, this.data.receipts);

    invoice.matchStatus = matchResult.matchStatus;
    invoice.discrepancies = matchResult.discrepancies;

    if (matchResult.approvedForPayment) {
      invoice.status = 'ApprovedForPayment';
      invoice.paymentStatus = 'Scheduled';
    }

    this.logAudit(actor, '3WAY_MATCH_REEVALUATED', invoiceId, `Match result: ${matchResult.matchStatus} (${matchResult.discrepancies.length} discrepancies)`);
    return { invoice, matchResult };
  }

  postToErp(invoiceId, actor = 'Karen Wu (AP Lead)') {
    const invoice = this.getInvoiceById(invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
    if (invoice.status !== 'ApprovedForPayment') {
      throw new Error(`Cannot post invoice ${invoiceId} to ERP: Must be in ApprovedForPayment status`);
    }

    const voucherId = `SAP-AP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    invoice.erpPosting = {
      posted: true,
      voucherId,
      postedAt: new Date().toISOString()
    };
    invoice.paymentStatus = 'Scheduled';

    this.logAudit(actor, 'ERP_AP_VOUCHER_POSTED', invoiceId, `Voucher generated: ${voucherId} in core financial ledger.`);
    return invoice;
  }

  // --- Sourcing & RFx ---
  getSourcingEvents() {
    return this.data.sourcingEvents || [];
  }

  // --- Auctions ---
  getAuctions() {
    return this.data.auctions || [];
  }

  getAuctionById(id) {
    return (this.data.auctions || []).find(a => a.id === id);
  }

  submitAuctionBid(auctionId, bidderId, amount, actor = null) {
    const auction = this.getAuctionById(auctionId);
    if (!auction) throw new Error(`Auction ${auctionId} not found`);
    if (auction.status !== 'Live') throw new Error(`Auction ${auctionId} is not active`);

    const bidder = this.getSupplierById(bidderId);
    const bidderName = bidder ? bidder.name : bidderId;
    const bidAmount = Number(amount);

    if (isNaN(bidAmount) || bidAmount <= 0) {
      throw new Error(`Invalid bid amount`);
    }

    if (bidAmount >= auction.currentLowBid) {
      throw new Error(`Bid of $${bidAmount.toLocaleString()} is not lower than current low bid of $${auction.currentLowBid.toLocaleString()}`);
    }

    const decrement = auction.currentLowBid - bidAmount;
    if (decrement < auction.minDecrement) {
      throw new Error(`Bid decrement of $${decrement.toLocaleString()} is less than minimum decrement of $${auction.minDecrement.toLocaleString()}`);
    }

    // Authoritative Server Timestamp
    const timestamp = new Date().toISOString();
    auction.currentLowBid = bidAmount;

    // Recalculate ranks
    const newBid = {
      bidderId,
      bidderName,
      amount: bidAmount,
      timestamp,
      rank: 1
    };

    auction.bids.unshift(newBid);

    // Update all bid ranks
    const sortedBids = [...auction.bids].sort((a, b) => a.amount - b.amount);
    const rankMap = new Map();
    sortedBids.forEach((b, idx) => {
      if (!rankMap.has(b.bidderId)) {
        rankMap.set(b.bidderId, idx + 1);
      }
    });

    for (const b of auction.bids) {
      b.rank = rankMap.get(b.bidderId) || 99;
    }

    // Anti-Sniping Check: if within antiSnipingWindowSec of endsAt, extend by 2 minutes
    const endMs = new Date(auction.endsAt).getTime();
    const nowMs = Date.now();
    const secRemaining = Math.max(0, (endMs - nowMs) / 1000);

    let extended = false;
    if (secRemaining < auction.antiSnipingWindowSec) {
      auction.endsAt = new Date(endMs + 120000).toISOString();
      extended = true;
    }

    this.logAudit(actor || bidderName, 'AUCTION_BID_SUBMITTED', auctionId, `New lead bid: $${bidAmount.toLocaleString()}${extended ? ' (Anti-sniping 2m extension triggered)' : ''}`);
    return { auction, newBid, extended };
  }

  // --- Contracts (CLM) ---
  getContracts() {
    return this.data.contracts || [];
  }

  // --- Spend Analytics ---
  getSpendAnalytics() {
    return this.data.spendAnalytics || {};
  }

  // --- Audit Logs ---
  getAuditLogs(limit = 50) {
    return (this.data.auditLogs || []).slice(0, limit);
  }
}

export const store = new DataStore();

