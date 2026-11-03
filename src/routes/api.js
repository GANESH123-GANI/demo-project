import { store } from '../store.js';

/**
 * Handles incoming API requests
 */
export async function handleApiRequest(req, res, pathname, query, body) {
  res.setHeader('Content-Type', 'application/json');

  try {
    // GET /api/system
    if (pathname === '/api/system' && req.method === 'GET') {
      return res.end(JSON.stringify(store.data.system));
    }

    // GET /api/suppliers
    if (pathname === '/api/suppliers' && req.method === 'GET') {
      const suppliers = store.getSuppliers(query);
      return res.end(JSON.stringify(suppliers));
    }

    // POST /api/suppliers/:id/stage
    const matchStage = pathname.match(/^\/api\/suppliers\/([^/]+)\/stage$/);
    if (matchStage && req.method === 'POST') {
      const id = matchStage[1];
      const updated = store.updateSupplierStage(id, body.stage, body.actor);
      return res.end(JSON.stringify({ success: true, supplier: updated }));
    }

    // POST /api/suppliers/:id/verify-bank
    const matchBank = pathname.match(/^\/api\/suppliers\/([^/]+)\/verify-bank$/);
    if (matchBank && req.method === 'POST') {
      const id = matchBank[1];
      const updated = store.verifySupplierBank(id, body.actor);
      return res.end(JSON.stringify({ success: true, supplier: updated }));
    }

    // GET /api/catalogs
    if (pathname === '/api/catalogs' && req.method === 'GET') {
      return res.end(JSON.stringify(store.getCatalogs()));
    }

    // GET /api/requisitions
    if (pathname === '/api/requisitions' && req.method === 'GET') {
      return res.end(JSON.stringify(store.getRequisitions()));
    }

    // POST /api/requisitions
    if (pathname === '/api/requisitions' && req.method === 'POST') {
      const created = store.createRequisition(body, body.actor);
      return res.end(JSON.stringify({ success: true, requisition: created }));
    }

    // POST /api/requisitions/:id/approve
    const matchPrApprove = pathname.match(/^\/api\/requisitions\/([^/]+)\/approve$/);
    if (matchPrApprove && req.method === 'POST') {
      const id = matchPrApprove[1];
      const approved = store.approveRequisition(id, body.actor);
      return res.end(JSON.stringify({ success: true, requisition: approved }));
    }

    // POST /api/requisitions/:id/convert-to-po
    const matchPrConvert = pathname.match(/^\/api\/requisitions\/([^/]+)\/convert-to-po$/);
    if (matchPrConvert && req.method === 'POST') {
      const id = matchPrConvert[1];
      const newPo = store.convertPrToPo(id, body.actor);
      return res.end(JSON.stringify({ success: true, purchaseOrder: newPo }));
    }

    // GET /api/sourcing
    if (pathname === '/api/sourcing' && req.method === 'GET') {
      return res.end(JSON.stringify(store.getSourcingEvents()));
    }

    // GET /api/auctions
    if (pathname === '/api/auctions' && req.method === 'GET') {
      return res.end(JSON.stringify(store.getAuctions()));
    }

    // POST /api/auctions/:id/bid
    const matchAuctionBid = pathname.match(/^\/api\/auctions\/([^/]+)\/bid$/);
    if (matchAuctionBid && req.method === 'POST') {
      const id = matchAuctionBid[1];
      const result = store.submitAuctionBid(id, body.bidderId, body.amount, body.actor);
      return res.end(JSON.stringify({ success: true, ...result }));
    }

    // GET /api/contracts
    if (pathname === '/api/contracts' && req.method === 'GET') {
      return res.end(JSON.stringify(store.getContracts()));
    }

    // GET /api/purchase-orders
    if (pathname === '/api/purchase-orders' && req.method === 'GET') {
      return res.end(JSON.stringify(store.getPurchaseOrders()));
    }

    // GET /api/receipts
    if (pathname === '/api/receipts' && req.method === 'GET') {
      return res.end(JSON.stringify(store.getReceipts()));
    }

    // POST /api/receipts
    if (pathname === '/api/receipts' && req.method === 'POST') {
      const created = store.createReceipt(body, body.actor);
      return res.end(JSON.stringify({ success: true, receipt: created }));
    }

    // GET /api/invoices
    if (pathname === '/api/invoices' && req.method === 'GET') {
      return res.end(JSON.stringify(store.getInvoices()));
    }

    // POST /api/invoices
    if (pathname === '/api/invoices' && req.method === 'POST') {
      const result = store.createInvoice(body, body.actor);
      return res.end(JSON.stringify({ success: true, ...result }));
    }

    // POST /api/invoices/:id/reevaluate
    const matchInvReeval = pathname.match(/^\/api\/invoices\/([^/]+)\/reevaluate$/);
    if (matchInvReeval && req.method === 'POST') {
      const id = matchInvReeval[1];
      const result = store.reEvaluateMatch(id, body.actor);
      return res.end(JSON.stringify({ success: true, ...result }));
    }

    // POST /api/invoices/:id/post-erp
    const matchInvErp = pathname.match(/^\/api\/invoices\/([^/]+)\/post-erp$/);
    if (matchInvErp && req.method === 'POST') {
      const id = matchInvErp[1];
      const invoice = store.postToErp(id, body.actor);
      return res.end(JSON.stringify({ success: true, invoice }));
    }

    // GET /api/analytics
    if (pathname === '/api/analytics' && req.method === 'GET') {
      return res.end(JSON.stringify(store.getSpendAnalytics()));
    }

    // GET /api/audit-logs
    if (pathname === '/api/audit-logs' && req.method === 'GET') {
      const limit = Number(query.limit) || 50;
      return res.end(JSON.stringify(store.getAuditLogs(limit)));
    }

    // POST /api/ai/copilot
    if (pathname === '/api/ai/copilot' && req.method === 'POST') {
      const response = generateAiResponse(body.prompt, body.mode, body.context);
      return res.end(JSON.stringify({ success: true, response }));
    }

    // Not found
    res.statusCode = 404;
    return res.end(JSON.stringify({ error: `Endpoint ${req.method} ${pathname} not found` }));
  } catch (err) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * Intelligent AI Copilot simulator tailored for enterprise S2P domain
 */
function generateAiResponse(prompt = '', mode = 'general', context = {}) {
  const p = prompt.toLowerCase();

  if (mode === 'contract' || p.includes('contract') || p.includes('clause') || p.includes('liability')) {
    return {
      agent: 'Contract Intelligence Assistant',
      recommendation: 'Clause Deviation Analysis Flagged',
      confidence: 0.96,
      citations: ['CTR-603 Section 14.2 (Limitation of Liability)', 'Corporate Standard Playbook 2026'],
      content: `Contract **CTR-603** with **Nova Precision Engineering** contains a critical liability deviation:
- **Standard Clause**: Mutual aggregate liability capped at 2.0x total contract value ($360,000.00).
- **Vendor Proposed**: Aggregate liability capped at 0.5x total contract value ($90,000.00).
- **Policy Risk**: Non-standard terms require formal Legal Counsel and CFO sign-off prior to electronic signature execution.
- **Recommended Action**: Propose fallback clause at 1.0x with carve-outs for confidentiality breaches and gross negligence.`
    };
  }

  if (mode === 'invoice' || p.includes('invoice') || p.includes('match') || p.includes('inv-802') || p.includes('inv-803')) {
    return {
      agent: 'AP 3-Way Match Assistant',
      recommendation: 'Deterministic Variance Assessment',
      confidence: 0.99,
      citations: ['PO-3002 Line 1', 'GRN-702 Inspection Note', 'INV-802 Line 1'],
      content: `**Analysis of Invoice Exception on INV-802:**
1. **Purchase Order PO-3002** authorized 10 units at $12,800.00 each ($128,000.00).
2. **Goods Receipt GRN-702** received 10 units, but inspection passed only **8 units**. 2 units failed diagnostic boot and were physically rejected.
3. **Invoice INV-802** bills for the full 10 units ($128,000.00).
4. **Resolution Path**:
   - Do NOT approve voucher for $128,000.00.
   - Issue automated Debit Note / Credit Request to Apex Cloud for $25,600.00 (2 units).
   - Alternatively, approve partial voucher for accepted liability of $102,400.00.`
    };
  }

  if (mode === 'supplier' || p.includes('supplier') || p.includes('risk') || p.includes('biohealth') || p.includes('bank')) {
    return {
      agent: 'Supplier Risk & SRM Assistant',
      recommendation: 'High Risk Alert: Dual-Control Banking Verification Required',
      confidence: 0.98,
      citations: ['SUP-105 Supplier Master', 'Treasury Anti-Fraud Policy §4.1'],
      content: `**Alert on BioHealth Laboratories Ltd (SUP-105):**
- **Status**: Suspended (Risk Score: 76 / High).
- **Trigger**: Bank account routing update submitted via vendor portal.
- **Security Check**: Bank verification is currently unverified. Automated sanctions screening requires secondary KYC review.
- **Segregation of Duties Enforcement**: In accordance with enterprise controls, accounts payable disbursements are frozen until independent Treasury phone confirmation is logged.`
    };
  }

  // Default S2P Assistant
  return {
    agent: 'ProcureFlow AI Copilot',
    recommendation: 'Strategic Spend & Workflow Guidance',
    confidence: 0.94,
    citations: ['ProcureFlow Knowledge Base', 'Enterprise Spend Taxonomy 2026'],
    content: `I have analyzed your active procurement workspace:
- **Active Requisitions**: PR-2026-004 is currently awaiting Finance Controller approval ($55,000.00).
- **Live Auctions**: Reverse Auction AUC-501 is live with current low bid $168,000.00 (7.1% below reserve price).
- **3-Way Matching**: 3 invoices have open exceptions requiring AP clerk or buyer action.
- **Contract Opportunities**: CTR-602 has volume rebate calculations due this quarter.`
  };
}

