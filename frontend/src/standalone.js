import { client } from './api/client.js';

// Application State
let state = {
  activeWorkspace: 'supplier',
  procurementTab: 'requisitions',
  contractTab: 'contracts',
  financeTab: 'invoices',
  adminTab: 'entities',
  currentUserRole: 'System Administrator',
  system: null,
  suppliers: [],
  catalogs: [],
  requisitions: [],
  sourcing: [],
  orders: [],
  receipts: [],
  invoices: [],
  auctions: [],
  contracts: [],
  clauses: [],
  documents: [],
  rbac: [],
  analytics: {},
  auditLogs: []
};

const contentBody = document.getElementById('content-body');
const pageTitle = document.getElementById('page-title');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalFooter = document.getElementById('modal-footer');
const btnCloseModal = document.getElementById('btn-close-modal');
const toastContainer = document.getElementById('toast-container');

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function openModal(title, bodyHtml, footerHtml = '') {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  modalFooter.innerHTML = footerHtml;
  modalOverlay.style.display = 'flex';
}

function closeModal() {
  modalOverlay.style.display = 'none';
}

btnCloseModal.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

async function loadData() {
  try {
    const [sys, sups, cats, reqs, ords, rcpts, invs, aucs, ctrs, anl, logs, src, cls, docs, rbac] = await Promise.all([
      client.getSystem(),
      client.getSuppliers(),
      client.getCatalogs(),
      client.getRequisitions(),
      client.getOrders(),
      client.getReceipts(),
      client.getInvoices(),
      client.getAuctions(),
      client.getContracts(),
      client.getAnalytics(),
      client.getAuditLogs(50),
      client.getSourcing().catch(() => []),
      client.getClauses().catch(() => []),
      client.getDocuments().catch(() => []),
      client.getRbac().catch(() => [])
    ]);

    state = {
      ...state,
      system: sys,
      suppliers: sups,
      catalogs: cats,
      requisitions: reqs,
      orders: ords,
      receipts: rcpts,
      invoices: invs,
      auctions: aucs,
      contracts: ctrs,
      analytics: anl,
      auditLogs: logs,
      sourcing: src,
      clauses: cls,
      documents: docs,
      rbac: rbac
    };

    document.getElementById('badge-suppliers').textContent = sups.length;
    document.getElementById('badge-prs').textContent = reqs.filter(r => r.status === 'PendingApproval').length;
    document.getElementById('badge-contracts').textContent = ctrs.length;
    document.getElementById('badge-invoices').textContent = invs.filter(i => i.matchStatus !== 'MATCHED').length;

    renderWorkspace();
  } catch (err) {
    showToast(`Failed to load data: ${err.message}`, 'error');
  }
}

function renderWorkspace() {
  const ws = state.activeWorkspace;
  if (ws === 'supplier') renderSupplierWorkspace();
  else if (ws === 'procurement') renderProcurementWorkspace();
  else if (ws === 'contract') renderContractWorkspace();
  else if (ws === 'finance') renderFinanceWorkspace();
  else if (ws === 'intelligence') renderIntelligenceWorkspace();
  else if (ws === 'vendor-portal') renderVendorPortal();
  else if (ws === 'admin') renderAdminWorkspace();
}

// -------------------------------------------------------------
// 1. SUPPLIER MANAGEMENT & SRM WORKSPACE (Module 1)
// -------------------------------------------------------------
function renderSupplierWorkspace() {
  pageTitle.textContent = 'Supplier Management & SRM Workspace';
  const activeCount = state.suppliers.filter(s => s.stage === 'Active').length;
  const underReviewCount = state.suppliers.filter(s => s.stage === 'UnderReview' || s.stage === 'Registered').length;
  const unverifiedBankCount = state.suppliers.filter(s => !s.bankVerified).length;

  contentBody.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-title">Authoritative Suppliers</div>
        <div class="stat-value">${state.suppliers.length}</div>
        <div class="stat-desc">Master records in registry</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Active for Commitments</div>
        <div class="stat-value" style="color: var(--success);">${activeCount}</div>
        <div class="stat-desc">Bank verified & activated</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Under Qualification</div>
        <div class="stat-value" style="color: var(--warning);">${underReviewCount}</div>
        <div class="stat-desc">Compliance review pending</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Bank Verification Required</div>
        <div class="stat-value" style="color: var(--danger);">${unverifiedBankCount}</div>
        <div class="stat-desc">Dual-control Treasury gate</div>
      </div>
    </div>

    <div class="workspace-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Supplier Master Directory</h2>
          <p class="section-desc">Onboarding, qualification, risk scoring, and segmentation governance.</p>
        </div>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Supplier Code / Name</th>
              <th>Category</th>
              <th>Tier / Segment</th>
              <th>Lifecycle Stage</th>
              <th>Risk Score</th>
              <th>Bank Status</th>
              <th>Sanctions</th>
              <th>OTD Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.suppliers.map(s => `
              <tr>
                <td>
                  <strong>${s.name}</strong><br>
                  <small style="color: var(--slate-500);">${s.code} • ${s.country}</small>
                </td>
                <td>${s.category}</td>
                <td>
                  <span class="badge badge-neutral">${s.tier}</span>
                  <span class="badge ${s.segment === 'Strategic' ? 'badge-info' : s.segment === 'Restricted' ? 'badge-danger' : 'badge-neutral'}">${s.segment}</span>
                </td>
                <td>
                  <span class="badge ${s.stage === 'Active' ? 'badge-success' : s.stage === 'Suspended' ? 'badge-danger' : 'badge-warning'}">
                    ${s.stage}
                  </span>
                </td>
                <td>
                  <strong style="color: ${s.riskScore > 60 ? 'var(--danger)' : s.riskScore > 35 ? 'var(--warning)' : 'var(--success)'};">
                    ${s.riskScore}/100
                  </strong>
                  <small>(${s.riskLevel})</small>
                </td>
                <td>
                  ${s.bankVerified ? '<span class="badge badge-success">✓ Verified</span>' : '<span class="badge badge-danger">✕ Unverified</span>'}
                </td>
                <td>
                  <span class="badge ${s.sanctionsCheck === 'Passed' ? 'badge-success' : 'badge-warning'}">${s.sanctionsCheck}</span>
                </td>
                <td><strong>${s.scorecard?.onTimeDelivery ? s.scorecard.onTimeDelivery + '%' : 'N/A'}</strong></td>
                <td>
                  <div style="display: flex; gap: 4px;">
                    ${!s.bankVerified ? `
                      <button class="btn btn-outline btn-sm btn-verify-bank" data-id="${s.id}" title="Dual-control Treasury Authorization">
                        Verify Bank
                      </button>
                    ` : ''}
                    <button class="btn btn-outline btn-sm btn-inspect-sup" data-id="${s.id}">Inspect</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.querySelectorAll('.btn-verify-bank').forEach(b => {
    b.addEventListener('click', async (e) => {
      try {
        await client.verifySupplierBank(e.currentTarget.dataset.id);
        showToast('Treasury dual-control verification recorded', 'success');
        await loadData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  document.querySelectorAll('.btn-inspect-sup').forEach(b => {
    b.addEventListener('click', (e) => {
      const s = state.suppliers.find(x => x.id === e.currentTarget.dataset.id);
      if (!s) return;

      const bodyHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
          <div>
            <strong>Legal Name:</strong> ${s.name}<br>
            <strong>Tax Identifier:</strong> ${s.taxId}<br>
            <strong>Payment Terms:</strong> ${s.paymentTerms}
          </div>
          <div>
            <strong>Stage:</strong> ${s.stage}<br>
            <strong>Bank Verification:</strong> ${s.bankVerified ? 'Verified' : 'Pending Dual-Control Audit'}<br>
            <strong>Risk Score:</strong> ${s.riskScore}/100 (${s.riskLevel})
          </div>
        </div>
        <h4>Compliance & Quality Documents</h4>
        <table class="data-table">
          <thead><tr><th>Document</th><th>Type</th><th>Expiry</th><th>Status</th></tr></thead>
          <tbody>
            ${(s.documents || []).map(d => `
              <tr>
                <td>${d.name}</td>
                <td>${d.type}</td>
                <td>${d.expires}</td>
                <td><span class="badge ${d.status === 'Verified' ? 'badge-success' : 'badge-warning'}">${d.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      const footerHtml = `
        <select id="stage-select-box" class="form-control" style="width: 160px;">
          <option value="Registered" ${s.stage === 'Registered' ? 'selected' : ''}>Stage: Registered</option>
          <option value="UnderReview" ${s.stage === 'UnderReview' ? 'selected' : ''}>Stage: UnderReview</option>
          <option value="Qualified" ${s.stage === 'Qualified' ? 'selected' : ''}>Stage: Qualified</option>
          <option value="Active" ${s.stage === 'Active' ? 'selected' : ''}>Stage: Active</option>
          <option value="Suspended" ${s.stage === 'Suspended' ? 'selected' : ''}>Stage: Suspended</option>
        </select>
        <button class="btn btn-primary btn-sm" id="btn-save-stage">Save Stage</button>
      `;

      openModal(`Supplier Master: ${s.name} (${s.code})`, bodyHtml, footerHtml);

      document.getElementById('btn-save-stage').addEventListener('click', async () => {
        const newStage = document.getElementById('stage-select-box').value;
        try {
          await client.updateSupplierStage(s.id, newStage);
          showToast(`Supplier stage updated to ${newStage}`, 'success');
          closeModal();
          await loadData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  });
}

// -------------------------------------------------------------
// 2. PROCUREMENT, SOURCING & PO WORKSPACE (Modules 2, 3, 4, 7, 8)
// -------------------------------------------------------------
function renderProcurementWorkspace() {
  pageTitle.textContent = 'Procurement, Strategic Sourcing & Purchase Orders';
  const tab = state.procurementTab;

  contentBody.innerHTML = `
    <!-- Sub-tab Navigation -->
    <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--slate-300); padding-bottom: 10px;">
      <button class="btn ${tab === 'requisitions' ? 'btn-primary' : 'btn-outline'} btn-sm" data-ptab="requisitions">📋 Requisitions (PR)</button>
      <button class="btn ${tab === 'catalogs' ? 'btn-primary' : 'btn-outline'} btn-sm" data-ptab="catalogs">🏷️ Master Catalogs</button>
      <button class="btn ${tab === 'sourcing' ? 'btn-primary' : 'btn-outline'} btn-sm" data-ptab="sourcing">🎯 Strategic Sourcing (RFx)</button>
      <button class="btn ${tab === 'auctions' ? 'btn-primary' : 'btn-outline'} btn-sm" data-ptab="auctions">⚡ Live Auctions</button>
      <button class="btn ${tab === 'orders' ? 'btn-primary' : 'btn-outline'} btn-sm" data-ptab="orders">📦 Purchase Orders (PO)</button>
      <button class="btn ${tab === 'receipts' ? 'btn-primary' : 'btn-outline'} btn-sm" data-ptab="receipts">🚚 Receiving & SES</button>
    </div>

    <div id="procurement-tab-content"></div>
  `;

  document.querySelectorAll('[data-ptab]').forEach(b => {
    b.addEventListener('click', (e) => {
      state.procurementTab = e.currentTarget.dataset.ptab;
      renderProcurementWorkspace();
    });
  });

  const tabContainer = document.getElementById('procurement-tab-content');

  // SUB-TAB 1: REQUISITIONS
  if (tab === 'requisitions') {
    tabContainer.innerHTML = `
      <div style="margin-bottom: 16px;">
        <button class="btn btn-primary" id="btn-create-pr">+ Create Purchase Requisition</button>
      </div>
      <div class="workspace-section">
        <div class="section-header">
          <h2 class="section-title">Purchase Requisitions (PR)</h2>
          <p class="section-desc">Budget encumbrance, policy validation, multi-level approvals, and PO conversion.</p>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>PR # / Title</th><th>Requester / Dept</th><th>Type / Channel</th><th>Budget Allocation</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${state.requisitions.map(r => `
                <tr>
                  <td><strong>${r.id}</strong><br><span>${r.title}</span></td>
                  <td>${r.requester}<br><small style="color: var(--slate-500);">${r.department}</small></td>
                  <td><span class="badge badge-neutral">${r.type}</span> <span class="badge ${r.channel === 'Catalog' ? 'badge-info' : 'badge-neutral'}">${r.channel}</span></td>
                  <td><code>${r.budgetCode}</code></td>
                  <td><strong>$${r.totalAmount?.toLocaleString()}</strong></td>
                  <td>
                    <span class="badge ${r.status === 'ConvertedToPO' ? 'badge-success' : r.status === 'Approved' ? 'badge-info' : 'badge-warning'}">${r.status}</span>
                    ${r.convertedPoId ? `<br><small>PO: <b>${r.convertedPoId}</b></small>` : ''}
                  </td>
                  <td>
                    ${r.status === 'PendingApproval' ? `
                      <button class="btn btn-success btn-sm btn-approve-pr" data-id="${r.id}">Approve</button>
                    ` : r.status === 'Approved' ? `
                      <button class="btn btn-primary btn-sm btn-convert-po" data-id="${r.id}">Generate PO</button>
                    ` : '<span style="color: var(--slate-400); font-size: 11px;">Converted</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btn-create-pr').addEventListener('click', openNewPrModal);
    document.querySelectorAll('.btn-approve-pr').forEach(b => {
      b.addEventListener('click', async (e) => {
        try {
          await client.approveRequisition(e.currentTarget.dataset.id);
          showToast('Requisition approved by Finance Controller', 'success');
          await loadData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
    document.querySelectorAll('.btn-convert-po').forEach(b => {
      b.addEventListener('click', async (e) => {
        try {
          const res = await client.convertPrToPo(e.currentTarget.dataset.id);
          showToast(`Purchase Order ${res.purchaseOrder.id} generated!`, 'success');
          await loadData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  }

  // SUB-TAB 2: CATALOGS
  else if (tab === 'catalogs') {
    tabContainer.innerHTML = `
      <div class="workspace-section">
        <div class="section-header">
          <h2 class="section-title">Pre-Negotiated Master Catalogs</h2>
          <p class="section-desc">Negotiated rates, supplier SLAs, and direct requisitioning shortcuts.</p>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead><tr><th>SKU</th><th>Item Name</th><th>Category</th><th>Supplier</th><th>Contracted Unit Price</th><th>Lead Time</th></tr></thead>
            <tbody>
              ${state.catalogs.map(c => `
                <tr>
                  <td><code>${c.sku}</code></td>
                  <td><strong>${c.name}</strong></td>
                  <td>${c.category}</td>
                  <td>${c.supplierName}</td>
                  <td><strong>$${c.unitPrice?.toLocaleString()}</strong> ${c.currency}</td>
                  <td>${c.leadTimeDays} business days</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // SUB-TAB 3: STRATEGIC SOURCING & RFX (Module 3)
  else if (tab === 'sourcing') {
    tabContainer.innerHTML = `
      <div class="workspace-section">
        <div class="section-header">
          <h2 class="section-title">Strategic Sourcing Events (RFI / RFQ / RFP)</h2>
          <p class="section-desc">Sealed-bid confidentiality, weighted technical & commercial evaluation, and award execution.</p>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>Event ID / Title</th><th>Type</th><th>Category</th><th>Baseline Spend</th><th>Budget</th><th>Sealed Bids</th><th>Status</th><th>Leading Proposal</th></tr>
            </thead>
            <tbody>
              ${state.sourcing.map(ev => {
                const leadBid = ev.bids?.[0];
                return `
                  <tr>
                    <td><strong>${ev.id}</strong><br><span>${ev.title}</span></td>
                    <td><span class="badge badge-neutral">${ev.type}</span></td>
                    <td>${ev.category}</td>
                    <td>$${ev.baselineSpend?.toLocaleString()}</td>
                    <td><strong>$${ev.budget?.toLocaleString()}</strong></td>
                    <td>${ev.sealedBid ? '<span class="badge badge-success">✓ Encrypted</span>' : '<span class="badge badge-neutral">Open</span>'}</td>
                    <td><span class="badge badge-info">${ev.status}</span></td>
                    <td>
                      ${leadBid ? `<strong>${leadBid.supplierName}</strong> ($${leadBid.totalBid?.toLocaleString()})<br><small>Score: <b>${leadBid.combinedScore}/100</b> (Rank #1)</small>` : 'No bids submitted'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // SUB-TAB 4: DYNAMIC REVERSE AUCTIONS (Module 4)
  else if (tab === 'auctions') {
    const auc = state.auctions[0];
    tabContainer.innerHTML = `
      <div class="workspace-section" style="padding: 20px;">
        <div style="background: var(--slate-900); color: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="badge badge-success">LIVE REVERSE AUCTION</span>
              <h2 style="margin-top: 6px;">${auc?.title}</h2>
              <p style="font-size: 13px; color: var(--slate-400); margin-top: 4px;">Dynamic Lots • Server Clock Synchronized • Anti-Sniping Protection Active</p>
            </div>
            <div style="text-align: right;">
              <small style="color: var(--slate-400);">SERVER AUTHORITATIVE TIME</small>
              <div style="font-size: 24px; font-weight: 800; color: #60a5fa;">COUNTDOWN ACTIVE</div>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
            <div><small style="color: var(--slate-400);">Reserve Price:</small><br><strong style="font-size: 18px;">$${auc?.reservePrice?.toLocaleString()}</strong></div>
            <div><small style="color: var(--slate-400);">Current Winning Low Bid:</small><br><strong style="color: #34d399; font-size: 22px;">$${auc?.currentLowBid?.toLocaleString()}</strong></div>
            <div><small style="color: var(--slate-400);">Min Bid Decrement:</small><br><strong style="font-size: 18px;">$${auc?.minDecrement?.toLocaleString()}</strong></div>
          </div>
        </div>

        <h3 style="margin-bottom: 10px;">Submit Competitive Bid</h3>
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <select id="auc-bidder-in" class="form-control" style="width: 240px;">
            <option value="SUP-102">Apex Cloud & IT Solutions</option>
            <option value="SUP-101">Global Industrial Supply</option>
            <option value="SUP-103">Nova Precision Engineering</option>
          </select>
          <input type="number" id="auc-amount-in" class="form-control" 
            value="${(auc?.currentLowBid || 168000) - (auc?.minDecrement || 1000)}" 
            max="${(auc?.currentLowBid || 168000) - (auc?.minDecrement || 1000)}" 
            step="${auc?.minDecrement || 1000}" style="width: 180px;">
          <button class="btn btn-primary" id="btn-auc-submit">Submit Authoritative Bid</button>
        </div>

        <h3>Bidding Audit Log</h3>
        <div class="table-container">
          <table class="data-table">
            <thead><tr><th>Rank</th><th>Bidder</th><th>Amount</th><th>Server Timestamp</th></tr></thead>
            <tbody>
              ${(auc?.bids || []).map(b => `
                <tr>
                  <td><span class="badge ${b.rank === 1 ? 'badge-success' : 'badge-neutral'}">Rank #${b.rank}</span></td>
                  <td><strong>${b.bidderName}</strong></td>
                  <td><strong>$${b.amount?.toLocaleString()}</strong></td>
                  <td><small>${b.timestamp?.replace('T', ' ')?.replace('Z','')}</small></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btn-auc-submit').addEventListener('click', async () => {
      const bidderId = document.getElementById('auc-bidder-in').value;
      const amount = Number(document.getElementById('auc-amount-in').value);
      try {
        const res = await client.submitBid(auc.id, bidderId, amount);
        showToast(`Bid of $${amount.toLocaleString()} submitted! New Rank: #${res.new_bid.rank}`, 'success');
        await loadData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // SUB-TAB 5: PURCHASE ORDERS (Module 7)
  else if (tab === 'orders') {
    tabContainer.innerHTML = `
      <div class="workspace-section">
        <div class="section-header">
          <h2 class="section-title">Purchase Orders (PO) & Legal Commitments</h2>
          <p class="section-desc">Line-item commitments, contracted unit rates, and supplier delivery tracking.</p>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>PO Number</th><th>Supplier</th><th>Lines</th><th>Order Date</th><th>Status</th><th>Commitment</th><th>Acknowledgement</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${state.orders.map(po => `
                <tr>
                  <td><strong>${po.id}</strong></td>
                  <td>${po.supplierName}</td>
                  <td>${po.lines?.length} lines</td>
                  <td>${po.orderDate?.split('T')[0]}</td>
                  <td><span class="badge ${po.status === 'Completed' ? 'badge-success' : po.status === 'PartiallyReceived' ? 'badge-warning' : 'badge-info'}">${po.status}</span></td>
                  <td><strong>$${po.totalAmount?.toLocaleString()}</strong></td>
                  <td><span class="badge badge-success">✓ ${po.supplierAcknowledgement}</span></td>
                  <td>
                    ${po.status !== 'Completed' ? `
                      <button class="btn btn-outline btn-sm btn-receipt-modal" data-id="${po.id}">📦 Record Receipt</button>
                    ` : '<span class="badge badge-success">✓ Fully Received</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    attachReceiptModalHandlers();
  }

  // SUB-TAB 6: GOODS RECEIPT & SERVICE ENTRY SHEETS (Module 8)
  else if (tab === 'receipts') {
    tabContainer.innerHTML = `
      <div class="workspace-section">
        <div class="section-header">
          <h2 class="section-title">Goods Receipts (GRN) & Service Entry Sheets (SES)</h2>
          <p class="section-desc">Physical dock check-ins, milestone verifications, and quality inspections feeding 3-way matching.</p>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>Receipt ID</th><th>Type</th><th>PO Reference</th><th>Date</th><th>Inspection Result</th><th>Status</th><th>Delivered vs Accepted</th></tr>
            </thead>
            <tbody>
              ${state.receipts.map(rc => {
                const totalDel = rc.lines?.reduce((s, l) => s + (l.deliveredQty || 0), 0);
                const totalAcc = rc.lines?.reduce((s, l) => s + (l.acceptedQty || 0), 0);
                const totalRej = rc.lines?.reduce((s, l) => s + (l.rejectedQty || 0), 0);
                return `
                  <tr>
                    <td><strong>${rc.id}</strong></td>
                    <td><span class="badge badge-neutral">${rc.type}</span></td>
                    <td><strong>${rc.poId}</strong></td>
                    <td>${rc.receiptDate?.split('T')[0]}</td>
                    <td>
                      <span class="badge ${rc.inspectionResult === 'Pass' ? 'badge-success' : 'badge-danger'}">
                        ${rc.inspectionResult}
                      </span>
                    </td>
                    <td><span class="badge badge-success">${rc.status}</span></td>
                    <td>
                      Delivered: <b>${totalDel}</b> • Accepted: <b style="color: var(--success);">${totalAcc}</b>
                      ${totalRej > 0 ? ` • Rejected: <b style="color: var(--danger);">${totalRej}</b>` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

function attachReceiptModalHandlers() {
  document.querySelectorAll('.btn-receipt-modal').forEach(b => {
    b.addEventListener('click', (e) => {
      const po = state.orders.find(x => x.id === e.currentTarget.dataset.id);
      if (!po) return;

      const bodyHtml = `
        <p style="margin-bottom: 10px;">Record dock acceptance for <strong>${po.supplierName}</strong>:</p>
        <table class="data-table">
          <thead><tr><th>Line</th><th>Description</th><th>Ordered</th><th>Received</th><th>Accept Now</th></tr></thead>
          <tbody>
            ${po.lines.map(l => `
              <tr>
                <td>Line ${l.line}</td>
                <td>${l.description}</td>
                <td>${l.orderedQty}</td>
                <td>${l.receivedQty || 0}</td>
                <td>
                  <input type="number" class="form-control grn-in-qty" data-line="${l.line}" 
                    value="${Math.max(0, l.orderedQty - (l.receivedQty || 0))}" style="width: 80px;">
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="form-group" style="margin-top: 14px;">
          <label class="form-label">Quality Inspection Result</label>
          <select id="grn-sel-inspect" class="form-control">
            <option value="Pass">Pass - Fully verified against specifications</option>
            <option value="PartialPass">Partial Pass - Transit defect rejected</option>
          </select>
        </div>
      `;

      openModal(`Warehouse Goods Receipt (GRN): ${po.id}`, bodyHtml, '<button class="btn btn-primary btn-sm" id="btn-post-grn">Confirm Receipt</button>');

      document.getElementById('btn-post-grn').addEventListener('click', async () => {
        const lines = [];
        document.querySelectorAll('.grn-in-qty').forEach(inp => {
          const lNum = Number(inp.dataset.line);
          const acceptedQty = Number(inp.value);
          const poLine = po.lines.find(l => l.line === lNum);
          lines.push({
            poLine: lNum,
            sku: poLine?.sku,
            deliveredQty: acceptedQty,
            acceptedQty,
            rejectedQty: 0
          });
        });

        try {
          await client.createReceipt({
            poId: po.id,
            type: 'GoodsReceipt',
            inspectionResult: document.getElementById('grn-sel-inspect').value,
            lines
          });
          showToast(`Goods Receipt (GRN) created for ${po.id}! Accepted for 3-way match.`, 'success');
          closeModal();
          await loadData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  });
}

function openNewPrModal() {
  const bodyHtml = `
    <div class="form-group">
      <label class="form-label">Requisition Title</label>
      <input type="text" id="pr-in-title" class="form-control" placeholder="e.g. Production Lab High-Performance Workstations">
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div class="form-group">
        <label class="form-label">Type</label>
        <select id="pr-in-type" class="form-control">
          <option value="Goods">Goods</option>
          <option value="Capital Expenditure">Capital Expenditure (Capex)</option>
          <option value="Service">Professional Service</option>
          <option value="Operating Expenditure">Operating Expenditure (Opex)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Budget Center Allocation</label>
        <input type="text" id="pr-in-budget" class="form-control" value="CAPEX-IT-2026-08">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Pre-Negotiated Master Catalog Item</label>
      <select id="pr-in-catalog" class="form-control">
        ${state.catalogs.map(c => `
          <option value="${c.id}" data-price="${c.unitPrice}" data-desc="${c.name}" data-sku="${c.sku}">
            ${c.name} - $${c.unitPrice?.toLocaleString()} (${c.supplierName})
          </option>
        `).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Quantity</label>
      <input type="number" id="pr-in-qty" class="form-control" value="5" min="1">
    </div>
  `;

  openModal('Create New Purchase Requisition', bodyHtml, '<button class="btn btn-primary btn-sm" id="btn-submit-pr-form">Submit Requisition</button>');

  document.getElementById('btn-submit-pr-form').addEventListener('click', async () => {
    const catSelect = document.getElementById('pr-in-catalog');
    const opt = catSelect.options[catSelect.selectedIndex];
    const qty = Number(document.getElementById('pr-in-qty').value) || 1;
    const unitPrice = Number(opt.dataset.price) || 1000;
    const total = qty * unitPrice;

    try {
      const res = await client.createRequisition({
        title: document.getElementById('pr-in-title').value || 'Requisition Order',
        type: document.getElementById('pr-in-type').value,
        channel: 'Catalog',
        budgetCode: document.getElementById('pr-in-budget').value,
        totalAmount: total,
        items: [{ line: 1, sku: opt.dataset.sku, description: opt.dataset.desc, qty, unitPrice, total }]
      });
      showToast(`Requisition ${res.requisition.id} submitted!`, 'success');
      closeModal();
      await loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// -------------------------------------------------------------
// 3. CONTRACT LIFECYCLE MANAGEMENT (CLM) (Module 6)
// -------------------------------------------------------------
function renderContractWorkspace() {
  pageTitle.textContent = 'Contract Lifecycle Management (CLM)';
  const tab = state.contractTab;

  contentBody.innerHTML = `
    <!-- Sub-tab Navigation -->
    <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--slate-300); padding-bottom: 10px;">
      <button class="btn ${tab === 'contracts' ? 'btn-primary' : 'btn-outline'} btn-sm" data-ctab="contracts">📜 Agreements</button>
      <button class="btn ${tab === 'clauses' ? 'btn-primary' : 'btn-outline'} btn-sm" data-ctab="clauses">⚖️ Governed Clause Library</button>
      <button class="btn ${tab === 'obligations' ? 'btn-primary' : 'btn-outline'} btn-sm" data-ctab="obligations">🔔 Obligations & Renewals</button>
    </div>

    <div id="contract-tab-content"></div>
  `;

  document.querySelectorAll('[data-ctab]').forEach(b => {
    b.addEventListener('click', (e) => {
      state.contractTab = e.currentTarget.dataset.ctab;
      renderContractWorkspace();
    });
  });

  const tabContainer = document.getElementById('contract-tab-content');

  // SUB-TAB 1: CONTRACTS
  if (tab === 'contracts') {
    tabContainer.innerHTML = `
      <div style="background: var(--warning-light); border: 1px solid var(--warning-border); padding: 14px 18px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <strong style="color: var(--warning);">⚠️ AI Clause Deviation Detected on CTR-603:</strong>
          <span style="font-size: 13px; color: var(--slate-700); margin-left: 8px;">
            Vendor proposed 0.5x liability cap vs standard 2.0x policy in Draft SOW.
          </span>
        </div>
        <button class="btn btn-outline btn-sm" id="btn-inspect-dev">Inspect Deviation</button>
      </div>

      <div class="workspace-section">
        <div class="section-header">
          <h2 class="section-title">Enterprise Contract Repository</h2>
          <p class="section-desc">Lifecycle management, clause playbooks, e-signature tracking, and obligation enforcement.</p>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>Contract ID / Title</th><th>Supplier</th><th>Type</th><th>Total Value</th><th>Notice Period</th><th>E-Signature</th><th>Status</th><th>Obligations</th></tr>
            </thead>
            <tbody>
              ${state.contracts.map(c => `
                <tr>
                  <td><strong>${c.id}</strong><br><span>${c.title}</span></td>
                  <td>${c.supplierName}</td>
                  <td><span class="badge badge-neutral">${c.type}</span></td>
                  <td><strong>$${c.totalValue?.toLocaleString()}</strong> ${c.currency}</td>
                  <td>${c.noticePeriodDays} days before expiry</td>
                  <td><span class="badge ${c.eSignatureStatus === 'Executed' ? 'badge-success' : 'badge-warning'}">${c.eSignatureStatus}</span></td>
                  <td><span class="badge ${c.status === 'Active' ? 'badge-success' : 'badge-warning'}">${c.status}</span></td>
                  <td><span class="badge badge-info">${c.obligations?.length || 0} Monitored</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btn-inspect-dev').addEventListener('click', () => {
      openModal(
        'Clause Deviation Review: CTR-603',
        `
        <div style="background: var(--slate-50); padding: 14px; border-radius: 8px;">
          <h4 style="color: var(--danger);">Clause: Limitation of Liability & Indemnification</h4>
          <p style="margin-top: 8px; font-size: 13px;">
            <strong>Corporate Standard:</strong> Mutual aggregate liability capped at 2.0x contract value (€360,000.00).<br>
            <strong>Nova Precision Proposed:</strong> Liability capped at 0.5x contract value (€90,000.00).
          </p>
          <p style="margin-top: 10px; font-size: 13px; color: var(--slate-600);">
            <strong>Legal Risk:</strong> Non-standard liability caps require written authorization from the General Counsel and Corporate Risk Officer prior to signature.
          </p>
        </div>
        `
      );
    });
  }

  // SUB-TAB 2: CLAUSE LIBRARY
  else if (tab === 'clauses') {
    tabContainer.innerHTML = `
      <div class="workspace-section">
        <div class="section-header">
          <h2 class="section-title">Governed Enterprise Clause Library & Legal Playbooks</h2>
          <p class="section-desc">Approved corporate legal terms, risk ratings, and pre-authorized fallback positions.</p>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead><tr><th>Clause ID / Title</th><th>Category</th><th>Risk Level</th><th>Standard Approved Term</th><th>Authorized Fallback Term</th></tr></thead>
            <tbody>
              ${state.clauses.map(cl => `
                <tr>
                  <td><strong>${cl.id}</strong><br><span>${cl.title}</span></td>
                  <td><span class="badge badge-neutral">${cl.category}</span></td>
                  <td><span class="badge ${cl.riskLevel === 'Critical' ? 'badge-danger' : 'badge-warning'}">${cl.riskLevel}</span></td>
                  <td style="max-width: 280px; font-size: 12px;">${cl.standardTerm}</td>
                  <td style="max-width: 280px; font-size: 12px; color: var(--slate-600);">${cl.fallbackTerm}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // SUB-TAB 3: OBLIGATIONS & RENEWALS
  else if (tab === 'obligations') {
    const allObligations = [];
    state.contracts.forEach(c => {
      (c.obligations || []).forEach(o => {
        allObligations.push({ ...o, contractId: c.id, supplierName: c.supplierName });
      });
    });

    tabContainer.innerHTML = `
      <div class="workspace-section">
        <div class="section-header">
          <h2 class="section-title">Contractual Obligations & SLA Governance</h2>
          <p class="section-desc">Continuous monitoring of service levels, audits, and renewal notice deadlines.</p>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead><tr><th>Obligation ID</th><th>Contract Reference</th><th>Supplier</th><th>Obligation Title</th><th>Status</th></tr></thead>
            <tbody>
              ${allObligations.map(ob => `
                <tr>
                  <td><code>${ob.id}</code></td>
                  <td><strong>${ob.contractId}</strong></td>
                  <td>${ob.supplierName}</td>
                  <td>${ob.title}</td>
                  <td><span class="badge ${ob.status === 'Compliant' || ob.status === 'Completed' ? 'badge-success' : 'badge-warning'}">${ob.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

// -------------------------------------------------------------
// 4. FINANCE & 3-WAY MATCHING (Module 9)
// -------------------------------------------------------------
function renderFinanceWorkspace() {
  pageTitle.textContent = 'Finance, Invoicing & Deterministic 3-Way Matching';
  const tab = state.financeTab;

  contentBody.innerHTML = `
    <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--slate-300); padding-bottom: 10px;">
      <button class="btn ${tab === 'invoices' ? 'btn-primary' : 'btn-outline'} btn-sm" data-ftab="invoices">💳 Invoices & 3-Way Match</button>
      <button class="btn ${tab === 'ocr' ? 'btn-primary' : 'btn-outline'} btn-sm" data-ftab="ocr">📄 Simulate Invoice Upload / OCR Intake</button>
      <button class="btn ${tab === 'controls' ? 'btn-primary' : 'btn-outline'} btn-sm" data-ftab="controls">⚙️ Tolerances & AP Controls</button>
    </div>

    <div id="finance-tab-content"></div>
  `;

  document.querySelectorAll('[data-ftab]').forEach(b => {
    b.addEventListener('click', (e) => {
      state.financeTab = e.currentTarget.dataset.ftab;
      renderFinanceWorkspace();
    });
  });

  const tabContainer = document.getElementById('finance-tab-content');

  if (tab === 'invoices') {
    const matchedCount = state.invoices.filter(i => i.matchStatus === 'MATCHED').length;
    const exceptionCount = state.invoices.filter(i => i.matchStatus !== 'MATCHED').length;
    const totalLiability = state.invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    tabContainer.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-title">Invoices Ingested</div>
          <div class="stat-value">${state.invoices.length}</div>
          <div class="stat-desc">OCR & e-invoicing intake</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Perfect 3-Way Match</div>
          <div class="stat-value" style="color: var(--success);">${matchedCount}</div>
          <div class="stat-desc">Approved for ERP disbursement</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Exception Holds</div>
          <div class="stat-value" style="color: var(--danger);">${exceptionCount}</div>
          <div class="stat-desc">Tolerances exceeded / missing GRN</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Total AP Liability</div>
          <div class="stat-value">$${(totalLiability / 1000).toFixed(1)}k</div>
          <div class="stat-desc">Invoiced commitments</div>
        </div>
      </div>

      <div class="workspace-section">
        <div class="section-header">
          <h2 class="section-title">Invoice Processing & 3-Way Reconciliation</h2>
          <p class="section-desc">Automated matching between PO commitment, Goods Receipt acceptance, and Invoiced rates.</p>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>Invoice # / Date</th><th>PO Reference</th><th>Supplier</th><th>Total Amount</th><th>3-Way Match Status</th><th>Payment Status</th><th>ERP Posting</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${state.invoices.map(inv => `
                <tr>
                  <td><strong>${inv.invoiceNumber}</strong><br><small style="color: var(--slate-500);">${inv.invoiceDate} (Due: ${inv.dueDate})</small></td>
                  <td><strong>${inv.poId}</strong></td>
                  <td>${inv.supplierName}</td>
                  <td><strong>$${inv.totalAmount?.toLocaleString()}</strong> ${inv.currency}</td>
                  <td><span class="badge ${inv.matchStatus === 'MATCHED' ? 'badge-success' : inv.matchStatus === 'MISSING_RECEIPT' ? 'badge-info' : 'badge-danger'}">${inv.matchStatus}</span></td>
                  <td><span class="badge ${inv.paymentStatus === 'Scheduled' ? 'badge-success' : inv.paymentStatus === 'Disputed' ? 'badge-danger' : 'badge-warning'}">${inv.paymentStatus}</span></td>
                  <td>${inv.erpPosting?.posted ? `<span class="badge badge-success">✓ ${inv.erpPosting.voucherId}</span>` : '<span class="badge badge-neutral">Not Posted</span>'}</td>
                  <td><button class="btn btn-outline btn-sm btn-inspect-inv" data-id="${inv.id}">🔍 Match Audit</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    attachInvoiceInspectionHandlers();
  } else if (tab === 'ocr') {
    tabContainer.innerHTML = `
      <div class="workspace-section" style="padding: 20px;">
        <h2 class="section-title">Simulate Multi-Channel Invoice Intake & OCR Extraction</h2>
        <p class="section-desc" style="margin-bottom: 20px;">Test the deterministic 3-way matching engine against any active Purchase Order.</p>

        <div style="max-width: 550px;">
          <div class="form-group">
            <label class="form-label">Vendor Invoice Number</label>
            <input type="text" id="ocr-inv-num" class="form-control" value="INV-SIM-${Date.now().toString().slice(-4)}">
          </div>
          <div class="form-group">
            <label class="form-label">Reference Purchase Order (PO)</label>
            <select id="ocr-po-select" class="form-control">
              ${state.orders.map(p => `
                <option value="${p.id}">${p.id} - ${p.supplierName} ($${p.totalAmount?.toLocaleString()})</option>
              `).join('')}
            </select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group">
              <label class="form-label">Billed Unit Price</label>
              <input type="number" id="ocr-unit-price" class="form-control" value="2450.00">
            </div>
            <div class="form-group">
              <label class="form-label">Billed Quantity</label>
              <input type="number" id="ocr-qty" class="form-control" value="17">
            </div>
          </div>
          <button class="btn btn-primary" id="btn-run-ocr">Ingest Invoice & Run 3-Way Match</button>
        </div>
      </div>
    `;

    document.getElementById('btn-run-ocr').addEventListener('click', async () => {
      const poId = document.getElementById('ocr-po-select').value;
      const po = state.orders.find(p => p.id === poId);
      const unitPrice = Number(document.getElementById('ocr-unit-price').value);
      const qty = Number(document.getElementById('ocr-qty').value);
      const totalAmount = unitPrice * qty;

      try {
        const res = await client.createInvoice({
          invoiceNumber: document.getElementById('ocr-inv-num').value,
          poId,
          supplierId: po?.supplierId,
          supplierName: po?.supplierName,
          totalAmount,
          lines: [{ line: 1, poLine: 1, sku: po?.lines?.[0]?.sku || 'SKU-01', qty, unitPrice, lineTotal: totalAmount }]
        });
        showToast(`Invoice ${res.invoice.invoiceNumber} ingested! Result: ${res.matchResult.matchStatus}`, 'success');
        state.financeTab = 'invoices';
        await loadData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  } else if (tab === 'controls') {
    tabContainer.innerHTML = `
      <div class="workspace-section" style="padding: 20px;">
        <h2 class="section-title">Deterministic 3-Way Matching Tolerances & AP Controls</h2>
        <p class="section-desc" style="margin-bottom: 16px;">Configured automated threshold limits before exceptions require human approval.</p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div style="padding: 14px; border: 1px solid var(--slate-200); border-radius: 8px;">
            <strong>Price Variance Tolerance:</strong> ±1.0%<br>
            <small style="color: var(--slate-500);">Invoices with unit rates beyond 1% require Buyer authorization.</small>
          </div>
          <div style="padding: 14px; border: 1px solid var(--slate-200); border-radius: 8px;">
            <strong>Quantity Tolerance:</strong> 0.0%<br>
            <small style="color: var(--slate-500);">Invoiced quantities cannot exceed dock-accepted quantities.</small>
          </div>
        </div>
      </div>
    `;
  }
}

function attachInvoiceInspectionHandlers() {
  document.querySelectorAll('.btn-inspect-inv').forEach(b => {
    b.addEventListener('click', (e) => {
      const inv = state.invoices.find(x => x.id === e.currentTarget.dataset.id);
      if (!inv) return;

      const bodyHtml = `
        <div style="background: var(--slate-50); padding: 12px; border-radius: 8px; margin-bottom: 14px; display: flex; justify-content: space-between;">
          <div>
            <strong>Invoice:</strong> ${inv.invoiceNumber}<br>
            <strong>PO Ref:</strong> ${inv.poId}<br>
            <strong>Supplier:</strong> ${inv.supplierName}
          </div>
          <div style="text-align: right;">
            <span class="badge ${inv.matchStatus === 'MATCHED' ? 'badge-success' : 'badge-danger'}" style="font-size: 12px;">
              ${inv.matchStatus}
            </span><br>
            <strong>Total: $${inv.totalAmount?.toLocaleString()}</strong>
          </div>
        </div>

        ${inv.discrepancies?.length > 0 ? `
          <div style="background: var(--danger-light); border: 1px solid var(--danger-border); padding: 12px; border-radius: 8px; margin-bottom: 14px;">
            <strong style="color: var(--danger);">Deterministic Discrepancies Flagged:</strong>
            <ul style="margin: 6px 0 0 18px; font-size: 12px; color: var(--danger);">
              ${inv.discrepancies.map(d => `<li>${d.detail}</li>`).join('')}
            </ul>
          </div>
        ` : `
          <div style="background: var(--success-light); border: 1px solid var(--success-border); padding: 12px; border-radius: 8px; margin-bottom: 14px; color: var(--success);">
            ✓ All lines matched within 1.0% price tolerance and 0.0% quantity tolerance.
          </div>
        `}

        <h4>Invoice Line Items & Rates</h4>
        <table className="data-table">
          <thead><tr><th>Line</th><th>SKU</th><th>Billed Qty</th><th>Unit Rate</th><th>Line Total</th></tr></thead>
          <tbody>
            ${(inv.lines || []).map(l => `
              <tr>
                <td>Line ${l.line}</td>
                <td>${l.sku}</td>
                <td>${l.qty}</td>
                <td>$${l.unitPrice?.toLocaleString()}</td>
                <td>$${l.lineTotal?.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      const footerHtml = `
        <button class="btn btn-outline btn-sm" id="btn-reeval-inv">🔄 Re-evaluate Match</button>
        ${inv.matchStatus === 'MATCHED' && !inv.erpPosting?.posted ? `
          <button class="btn btn-success btn-sm" id="btn-post-erp-inv">Post to ERP (Create Voucher)</button>
        ` : ''}
      `;

      openModal(`3-Way Match Audit: ${inv.invoiceNumber}`, bodyHtml, footerHtml);

      document.getElementById('btn-reeval-inv').addEventListener('click', async () => {
        try {
          await client.reevaluateInvoice(inv.id);
          showToast('3-Way Match re-calculated', 'success');
          closeModal();
          await loadData();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });

      const erpBtn = document.getElementById('btn-post-erp-inv');
      if (erpBtn) {
        erpBtn.addEventListener('click', async () => {
          try {
            const res = await client.postInvoiceToErp(inv.id);
            showToast(`AP Voucher ${res.invoice.erpPosting.voucherId} posted to SAP!`, 'success');
            closeModal();
            await loadData();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      }
    });
  });
}

// -------------------------------------------------------------
// 5. INTELLIGENCE & ANALYTICS (Module 10)
// -------------------------------------------------------------
function renderIntelligenceWorkspace() {
  pageTitle.textContent = 'Spend Analytics & Savings Intelligence';
  const a = state.analytics || {};

  contentBody.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-title">Total Annual Spend</div>
        <div class="stat-value">$${((a.totalAnnualSpend || 0) / 1000000).toFixed(2)}M</div>
        <div class="stat-desc">Unified cross-entity spend</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Contract Coverage</div>
        <div class="stat-value" style="color: var(--success);">${a.contractCoveragePct}%</div>
        <div class="stat-desc">Spend on active agreements</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Maverick (Off-Contract)</div>
        <div class="stat-value" style="color: var(--danger);">$${((a.maverickSpendAmount || 0) / 1000000).toFixed(2)}M</div>
        <div class="stat-desc">Target for consolidation</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Realized Savings YTD</div>
        <div class="stat-value" style="color: var(--success);">$${((a.realizedSavingsYTD || 0) / 1000000).toFixed(2)}M</div>
        <div class="stat-desc">Audited financial impact</div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div class="workspace-section">
        <div class="section-header">
          <h3 class="section-title">Spend by Category (UNSPSC Taxonomy)</h3>
        </div>
        <div style="padding: 16px;">
          ${(a.spendByCategory || []).map(cat => `
            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                <span><strong>${cat.category}</strong></span>
                <span>$${(cat.amount / 1000000).toFixed(2)}M (${cat.share}%)</span>
              </div>
              <div style="height: 8px; background: var(--slate-200); border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; width: ${cat.share}%; background: var(--primary);"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="workspace-section">
        <div class="section-header">
          <h3 class="section-title">Procurement Savings Pipeline</h3>
        </div>
        <div style="padding: 16px;">
          ${(a.savingsPipeline || []).map(p => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--slate-200);">
              <div>
                <strong>${p.stage}</strong><br>
                <small style="color: var(--slate-500);">${p.count} strategic projects</small>
              </div>
              <div style="text-align: right;">
                <strong style="color: var(--success);">$${(p.value / 1000000).toFixed(2)}M</strong>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 6. VENDOR SELF-SERVICE PORTAL (Module 5)
// -------------------------------------------------------------
function renderVendorPortal() {
  pageTitle.textContent = 'Vendor Self-Service Portal (External View)';
  const currentSupplier = state.suppliers[0];
  const vendorPos = state.orders.filter(p => p.supplierId === currentSupplier?.id);
  const vendorInvoices = state.invoices.filter(i => i.supplierId === currentSupplier?.id);

  contentBody.innerHTML = `
    <div style="background: var(--slate-900); color: #fff; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
      <span class="badge badge-info" style="margin-bottom: 4px;">VENDOR PORTAL CONSOLE</span>
      <h3>${currentSupplier?.name} (${currentSupplier?.code})</h3>
      <p style="font-size: 12px; color: var(--slate-400); margin-top: 2px;">
        Isolated external counterparty session • Payment Terms: ${currentSupplier?.paymentTerms}
      </p>
    </div>

    <div class="workspace-section">
      <div class="section-header">
        <h3 class="section-title">Purchase Orders Acknowledged & In Fulfillment</h3>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead><tr><th>PO Number</th><th>Order Date</th><th>Status</th><th>Lines</th><th>Total Amount</th><th>Acknowledgement</th></tr></thead>
          <tbody>
            ${vendorPos.map(p => `
              <tr>
                <td><strong>${p.id}</strong></td>
                <td>${p.orderDate?.split('T')[0]}</td>
                <td><span class="badge badge-info">${p.status}</span></td>
                <td>${p.lines?.length} lines</td>
                <td><strong>$${p.totalAmount?.toLocaleString()}</strong></td>
                <td><span class="badge badge-success">✓ ${p.supplierAcknowledgement}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="workspace-section">
      <div class="section-header">
        <h3 class="section-title">Submitted Invoices & Real-Time Payment Status</h3>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead><tr><th>Invoice #</th><th>Date</th><th>Due Date</th><th>Amount</th><th>Validation Status</th><th>Payment Remittance</th></tr></thead>
          <tbody>
            ${vendorInvoices.map(inv => `
              <tr>
                <td><strong>${inv.invoiceNumber}</strong></td>
                <td>${inv.invoiceDate}</td>
                <td>${inv.dueDate}</td>
                <td><strong>$${inv.totalAmount?.toLocaleString()}</strong></td>
                <td><span class="badge ${inv.matchStatus === 'MATCHED' ? 'badge-success' : 'badge-warning'}">${inv.matchStatus}</span></td>
                <td><span class="badge ${inv.paymentStatus === 'Scheduled' ? 'badge-success' : 'badge-neutral'}">${inv.paymentStatus}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 7. ADMINISTRATION & GOVERNANCE (Modules 11 & 12)
// -------------------------------------------------------------
function renderAdminWorkspace() {
  pageTitle.textContent = 'Administration, Governance & Audit Trail';
  const tab = state.adminTab;

  contentBody.innerHTML = `
    <!-- Sub-tab Navigation -->
    <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--slate-300); padding-bottom: 10px;">
      <button class="btn ${tab === 'entities' ? 'btn-primary' : 'btn-outline'} btn-sm" data-atab="entities">🏢 Multi-Entity Hierarchy</button>
      <button class="btn ${tab === 'rbac' ? 'btn-primary' : 'btn-outline'} btn-sm" data-atab="rbac">🛡️ RBAC & SoD Engine</button>
      <button class="btn ${tab === 'documents' ? 'btn-primary' : 'btn-outline'} btn-sm" data-atab="documents">📁 Document Repository (Module 11)</button>
      <button class="btn ${tab === 'audit' ? 'btn-primary' : 'btn-outline'} btn-sm" data-atab="audit">🔒 Tamper-Evident Audit Ledger</button>
    </div>

    <div id="admin-tab-content"></div>
  `;

  document.querySelectorAll('[data-atab]').forEach(b => {
    b.addEventListener('click', (e) => {
      state.adminTab = e.currentTarget.dataset.atab;
      renderAdminWorkspace();
    });
  });

  const tabContainer = document.getElementById('admin-tab-content');

  // ENTITIES
  if (tab === 'entities') {
    tabContainer.innerHTML = `
      <div class="workspace-section">
        <div class="section-header">
          <h3 class="section-title">Multi-Entity Corporate Architecture</h3>
          <p class="section-desc">Unified master records across regional operating companies and currencies.</p>
        </div>
        <div style="padding: 16px;">
          ${(state.system?.entities || []).map(ent => `
            <div style="padding: 12px; border: 1px solid var(--slate-200); border-radius: 6px; margin-bottom: 10px;">
              <strong>${ent.name}</strong><br>
              <small style="color: var(--slate-500);">Entity Code: <b>${ent.id}</b> • Base Currency: <b>${ent.currency}</b> • Jurisdiction: <b>${ent.country}</b></small>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // RBAC & SOD
  else if (tab === 'rbac') {
    tabContainer.innerHTML = `
      <div class="workspace-section">
        <div class="section-header">
          <h3 class="section-title">Role-Based Access Control (RBAC) & Segregation of Duties (SoD) Engine</h3>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead><tr><th>Role Name</th><th>Authorized Operational Scope</th><th>SoD Restriction Enforced</th></tr></thead>
            <tbody>
              ${state.rbac.map(r => `
                <tr>
                  <td><strong>${r.role}</strong></td>
                  <td>${r.scope}</td>
                  <td><span class="badge badge-warning">✓ ${r.soDRestriction}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // DOCUMENTS (Module 11)
  else if (tab === 'documents') {
    tabContainer.innerHTML = `
      <div class="workspace-section">
        <div class="section-header">
          <h2 class="section-title">Document & Knowledge Management Repository (Module 11)</h2>
          <p class="section-desc">Authoritative policy library, version control, malware scan verification, and retention policies.</p>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead><tr><th>Document Name</th><th>Type / Category</th><th>Version</th><th>Owner</th><th>Malware Integrity</th><th>Retention</th></tr></thead>
            <tbody>
              ${state.documents.map(d => `
                <tr>
                  <td><strong>${d.name}</strong></td>
                  <td><span class="badge badge-neutral">${d.type}</span> <small>${d.category}</small></td>
                  <td><code>${d.version}</code></td>
                  <td>${d.owner}</td>
                  <td><span class="badge badge-success">✓ ${d.malwareStatus}</span></td>
                  <td>${d.retentionPeriod}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // AUDIT
  else if (tab === 'audit') {
    tabContainer.innerHTML = `
      <div class="workspace-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">Cryptographic Tamper-Evident Audit Ledger</h2>
            <p class="section-desc">SHA-256 chained transaction trail preserving complete procurement accountability.</p>
          </div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead><tr><th>Audit ID / Timestamp</th><th>Actor</th><th>Action Event</th><th>Target</th><th>Details</th><th>Integrity</th></tr></thead>
            <tbody>
              ${state.auditLogs.map(log => `
                <tr>
                  <td><strong>${log.id}</strong><br><small style="color: var(--slate-500);">${log.timestamp?.replace('T', ' ')?.slice(0, 19)}</small></td>
                  <td><strong>${log.actor}</strong></td>
                  <td><span class="badge badge-neutral">${log.action}</span></td>
                  <td><code>${log.target}</code></td>
                  <td>${log.details}</td>
                  <td><span class="badge badge-success">✓ Verified</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

// -------------------------------------------------------------
// AI COPILOT INTERACTION (Module 13)
// -------------------------------------------------------------
const aiDrawer = document.getElementById('ai-drawer');
const btnToggleAi = document.getElementById('btn-toggle-ai');
const aiHeader = document.getElementById('ai-header');
const aiInput = document.getElementById('ai-input');
const btnSendAi = document.getElementById('btn-send-ai');
const aiMessages = document.getElementById('ai-messages');

aiHeader.addEventListener('click', () => {
  aiDrawer.classList.toggle('collapsed');
  btnToggleAi.textContent = aiDrawer.classList.contains('collapsed') ? 'Expand ▲' : 'Collapse ▼';
});

async function sendAiMessage(promptText, mode = 'general') {
  const text = promptText || aiInput.value.trim();
  if (!text) return;

  const userMsg = document.createElement('div');
  userMsg.className = 'ai-message ai-message-user';
  userMsg.textContent = text;
  aiMessages.appendChild(userMsg);
  aiInput.value = '';

  const botMsg = document.createElement('div');
  botMsg.className = 'ai-message ai-message-bot';
  botMsg.innerHTML = '<em>Thinking with enterprise S2P domain knowledge...</em>';
  aiMessages.appendChild(botMsg);
  aiMessages.scrollTop = aiMessages.scrollHeight;

  try {
    const res = await client.askAi(text, mode);
    const ai = res.response;
    botMsg.innerHTML = `
      <div style="font-weight: 700; color: var(--primary); margin-bottom: 4px;">${ai.agent} (${(ai.confidence * 100).toFixed(0)}% confidence)</div>
      <div style="white-space: pre-line;">${ai.content}</div>
      ${ai.citations?.length ? `
        <div style="margin-top: 6px; font-size: 11px; color: var(--slate-500); border-top: 1px solid var(--slate-300); padding-top: 4px;">
          <strong>Citations:</strong> ${ai.citations.join(', ')}
        </div>
      ` : ''}
    `;
  } catch (err) {
    botMsg.innerHTML = `<span style="color: var(--danger);">Failed: ${err.message}</span>`;
  }
  aiMessages.scrollTop = aiMessages.scrollHeight;
}

btnSendAi.addEventListener('click', () => sendAiMessage());
aiInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendAiMessage(); });

document.querySelectorAll('.ai-chip').forEach(c => {
  c.addEventListener('click', (e) => {
    aiDrawer.classList.remove('collapsed');
    btnToggleAi.textContent = 'Collapse ▼';
    sendAiMessage(e.currentTarget.dataset.prompt, e.currentTarget.dataset.mode);
  });
});

// Sidebar Navigation
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    state.activeWorkspace = item.dataset.workspace;
    renderWorkspace();
  });
});

document.getElementById('btn-refresh').addEventListener('click', async () => {
  await loadData();
  showToast('Platform synchronized', 'info');
});

// Boot
loadData();
