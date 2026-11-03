import { api } from './api.js';

// Application State
const state = {
  activeWorkspace: 'supplier',
  system: null,
  suppliers: [],
  catalogs: [],
  requisitions: [],
  sourcing: [],
  auctions: [],
  contracts: [],
  purchaseOrders: [],
  receipts: [],
  invoices: [],
  analytics: {},
  auditLogs: [],
  selectedVendorId: 'SUP-101' // For Vendor Portal view
};

// DOM Elements
const contentBody = document.getElementById('content-body');
const pageTitle = document.getElementById('page-title');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalFooter = document.getElementById('modal-footer');
const btnCloseModal = document.getElementById('btn-close-modal');
const toastContainer = document.getElementById('toast-container');

// AI Copilot Elements
const aiDrawer = document.getElementById('ai-drawer');
const btnToggleAi = document.getElementById('btn-toggle-ai');
const aiHeader = document.getElementById('ai-header');
const aiInput = document.getElementById('ai-input');
const btnSendAi = document.getElementById('btn-send-ai');
const aiMessages = document.getElementById('ai-messages');

/**
 * Toast Notifications
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

/**
 * Modal Management
 */
function openModal(title, bodyHtml, footerHtml = '') {
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  modalFooter.innerHTML = footerHtml;
  modalOverlay.classList.add('open');
}

function closeModal() {
  modalOverlay.classList.remove('open');
}

btnCloseModal.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

/**
 * Load Initial Data from API
 */
async function loadData() {
  try {
    const [system, suppliers, catalogs, requisitions, sourcing, auctions, contracts, purchaseOrders, receipts, invoices, analytics, auditLogs] = await Promise.all([
      api.getSystem(),
      api.getSuppliers(),
      api.getCatalogs(),
      api.getRequisitions(),
      api.getSourcing(),
      api.getAuctions(),
      api.getContracts(),
      api.getPurchaseOrders(),
      api.getReceipts(),
      api.getInvoices(),
      api.getAnalytics(),
      api.getAuditLogs(50)
    ]);

    state.system = system;
    state.suppliers = suppliers;
    state.catalogs = catalogs;
    state.requisitions = requisitions;
    state.sourcing = sourcing;
    state.auctions = auctions;
    state.contracts = contracts;
    state.purchaseOrders = purchaseOrders;
    state.receipts = receipts;
    state.invoices = invoices;
    state.analytics = analytics;
    state.auditLogs = auditLogs;

    // Update navigation badges
    document.getElementById('badge-suppliers').textContent = suppliers.length;
    document.getElementById('badge-prs').textContent = requisitions.filter(r => r.status === 'PendingApproval').length;
    document.getElementById('badge-contracts').textContent = contracts.length;
    document.getElementById('badge-invoices').textContent = invoices.filter(i => i.status === 'UnderExceptionReview').length;

    renderCurrentWorkspace();
  } catch (err) {
    showToast(`Failed to load data: ${err.message}`, 'error');
  }
}

/**
 * Route / Workspace Renderer Switch
 */
function renderCurrentWorkspace() {
  switch (state.activeWorkspace) {
    case 'supplier':
      pageTitle.textContent = 'Supplier Management & SRM Workspace';
      renderSupplierWorkspace();
      break;
    case 'procurement':
      pageTitle.textContent = 'Procurement, Sourcing & Purchase Orders';
      renderProcurementWorkspace();
      break;
    case 'contract':
      pageTitle.textContent = 'Contract Lifecycle Management (CLM)';
      renderContractWorkspace();
      break;
    case 'finance':
      pageTitle.textContent = 'Finance & 3-Way Invoice Matching';
      renderFinanceWorkspace();
      break;
    case 'intelligence':
      pageTitle.textContent = 'Spend Analytics & Savings Intelligence';
      renderIntelligenceWorkspace();
      break;
    case 'vendor-portal':
      pageTitle.textContent = 'Vendor Self-Service Portal (External View)';
      renderVendorPortal();
      break;
    case 'admin':
      pageTitle.textContent = 'Administration, Governance & Audit Trail';
      renderAdminWorkspace();
      break;
  }
}

// ==========================================
// 1. SUPPLIER WORKSPACE
// ==========================================
function renderSupplierWorkspace() {
  const activeCount = state.suppliers.filter(s => s.stage === 'Active').length;
  const underReviewCount = state.suppliers.filter(s => s.stage === 'UnderReview' || s.stage === 'Registered').length;
  const highRiskCount = state.suppliers.filter(s => s.riskLevel === 'High').length;
  const unverifiedBankCount = state.suppliers.filter(s => !s.bankVerified).length;

  contentBody.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-title">Authoritative Suppliers</div>
        <div class="stat-value">${state.suppliers.length}</div>
        <div class="stat-desc">Master vendor records in registry</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Active for Spend</div>
        <div class="stat-value" style="color: var(--success);">${activeCount}</div>
        <div class="stat-desc">Fully verified & activated</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Onboarding & Qualification</div>
        <div class="stat-value" style="color: var(--warning);">${underReviewCount}</div>
        <div class="stat-desc">Awaiting compliance audit</div>
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
              <th>Code / Name</th>
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
                  ${s.bankVerified
                    ? '<span class="badge badge-success">✓ Verified</span>'
                    : '<span class="badge badge-danger">✕ Unverified</span>'}
                </td>
                <td>
                  <span class="badge ${s.sanctionsCheck === 'Passed' ? 'badge-success' : 'badge-warning'}">
                    ${s.sanctionsCheck}
                  </span>
                </td>
                <td>
                  <strong>${s.scorecard.onTimeDelivery ? s.scorecard.onTimeDelivery + '%' : 'N/A'}</strong>
                </td>
                <td>
                  <div style="display: flex; gap: 4px;">
                    ${!s.bankVerified ? `
                      <button class="btn btn-outline btn-sm btn-verify-bank" data-id="${s.id}" title="Dual-control Treasury Authorization">
                        Verify Bank
                      </button>
                    ` : ''}
                    <button class="btn btn-outline btn-sm btn-view-supplier" data-id="${s.id}">
                      Inspect
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach event listeners
  document.querySelectorAll('.btn-verify-bank').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      try {
        await api.verifySupplierBank(id);
        showToast(`Treasury dual-control verification recorded for ${id}`, 'success');
        await loadData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  document.querySelectorAll('.btn-view-supplier').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const s = state.suppliers.find(item => item.id === id);
      if (!s) return;

      const bodyHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <strong>Legal Name:</strong> ${s.name}<br>
            <strong>Tax Identifier:</strong> ${s.taxId}<br>
            <strong>Payment Terms:</strong> ${s.paymentTerms}<br>
            <strong>Primary Contact:</strong> ${s.contacts[0]?.name} (${s.contacts[0]?.email})
          </div>
          <div>
            <strong>Lifecycle Stage:</strong> ${s.stage}<br>
            <strong>Bank Verification:</strong> ${s.bankVerified ? 'Verified' : 'Pending Dual-Control Audit'}<br>
            <strong>Sanctions Watchlist:</strong> ${s.sanctionsCheck}<br>
            <strong>Risk Score:</strong> ${s.riskScore} (${s.riskLevel} Risk)
          </div>
        </div>

        <h4 style="margin: 12px 0 6px;">Compliance & Legal Documents</h4>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>Document Name</th><th>Type</th><th>Expiration</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${s.documents.length === 0 ? '<tr><td colspan="4">No documents uploaded yet.</td></tr>' : s.documents.map(d => `
                <tr>
                  <td>${d.name}</td>
                  <td>${d.type}</td>
                  <td>${d.expires}</td>
                  <td><span class="badge ${d.status === 'Verified' ? 'badge-success' : 'badge-warning'}">${d.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      const footerHtml = `
        <select id="select-stage-change" class="form-control" style="width: 180px;">
          <option value="Registered" ${s.stage === 'Registered' ? 'selected' : ''}>Stage: Registered</option>
          <option value="UnderReview" ${s.stage === 'UnderReview' ? 'selected' : ''}>Stage: UnderReview</option>
          <option value="Qualified" ${s.stage === 'Qualified' ? 'selected' : ''}>Stage: Qualified</option>
          <option value="Active" ${s.stage === 'Active' ? 'selected' : ''}>Stage: Active</option>
          <option value="Suspended" ${s.stage === 'Suspended' ? 'selected' : ''}>Stage: Suspended</option>
        </select>
        <button class="btn btn-primary btn-sm" id="btn-save-stage">Update Stage</button>
      `;

      openModal(`Supplier Master: ${s.name} (${s.code})`, bodyHtml, footerHtml);

      document.getElementById('btn-save-stage').addEventListener('click', async () => {
        const newStage = document.getElementById('select-stage-change').value;
        try {
          await api.updateSupplierStage(s.id, newStage);
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

// ==========================================
// 2. PROCUREMENT & PO WORKSPACE
// ==========================================
function renderProcurementWorkspace() {
  contentBody.innerHTML = `
    <div style="display: flex; gap: 8px; margin-bottom: 20px;">
      <button class="btn btn-primary" id="btn-new-pr">+ Create Purchase Requisition</button>
      <button class="btn btn-outline" id="btn-view-auction">⚡ View Live Reverse Auction (AUC-501)</button>
    </div>

    <!-- Active Requisitions -->
    <div class="workspace-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Purchase Requisitions (PR)</h2>
          <p class="section-desc">Budget validation, policy checks, multi-level approvals, and PO conversion.</p>
        </div>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>PR Number / Title</th>
              <th>Requester / Dept</th>
              <th>Type / Channel</th>
              <th>Budget Encumbrance</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.requisitions.map(r => `
              <tr>
                <td>
                  <strong>${r.id}</strong><br>
                  <span>${r.title}</span>
                </td>
                <td>
                  ${r.requester}<br>
                  <small style="color: var(--slate-500);">${r.department}</small>
                </td>
                <td>
                  <span class="badge badge-neutral">${r.type}</span>
                  <span class="badge ${r.channel === 'Catalog' ? 'badge-info' : 'badge-neutral'}">${r.channel}</span>
                </td>
                <td>
                  <code>${r.budgetCode}</code><br>
                  <small>Allocated: $${r.allocatedBudget?.toLocaleString()}</small>
                </td>
                <td><strong>$${r.totalAmount.toLocaleString()}</strong> ${r.currency}</td>
                <td>
                  <span class="badge ${r.status === 'ConvertedToPO' ? 'badge-success' : r.status === 'Approved' ? 'badge-info' : 'badge-warning'}">
                    ${r.status}
                  </span>
                  ${r.convertedPoId ? `<br><small>PO: <b>${r.convertedPoId}</b></small>` : ''}
                </td>
                <td>
                  ${r.status === 'PendingApproval' ? `
                    <button class="btn btn-success btn-sm btn-approve-pr" data-id="${r.id}">Approve</button>
                  ` : r.status === 'Approved' ? `
                    <button class="btn btn-primary btn-sm btn-convert-po" data-id="${r.id}">Generate PO</button>
                  ` : `
                    <span style="color: var(--slate-400); font-size: 11px;">Completed</span>
                  `}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Purchase Orders & Receipts -->
    <div class="workspace-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Purchase Orders & Receiving Commitments</h2>
          <p class="section-desc">Line-level commitments, fulfillment tracking, and Goods Receipt (GRN) acceptance.</p>
        </div>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Lines</th>
              <th>Order Date</th>
              <th>Status</th>
              <th>Total Commitment</th>
              <th>Receiving Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.purchaseOrders.map(po => `
              <tr>
                <td><strong>${po.id}</strong></td>
                <td>${po.supplierName}</td>
                <td>${po.lines.length} lines</td>
                <td>${po.orderDate.split('T')[0]}</td>
                <td>
                  <span class="badge ${po.status === 'Completed' ? 'badge-success' : po.status === 'PartiallyReceived' ? 'badge-warning' : 'badge-info'}">
                    ${po.status}
                  </span>
                </td>
                <td><strong>$${po.totalAmount.toLocaleString()}</strong></td>
                <td>
                  ${po.status !== 'Completed' ? `
                    <button class="btn btn-outline btn-sm btn-receive-goods" data-id="${po.id}">
                      📦 Record Receipt (GRN)
                    </button>
                  ` : `
                    <span class="badge badge-success">✓ Fully Received</span>
                  `}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Attach handlers
  document.getElementById('btn-new-pr').addEventListener('click', openNewPrModal);
  document.getElementById('btn-view-auction').addEventListener('click', openAuctionModal);

  document.querySelectorAll('.btn-approve-pr').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      try {
        await api.approveRequisition(id);
        showToast(`Requisition ${id} approved by Finance Controller`, 'success');
        await loadData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  document.querySelectorAll('.btn-convert-po').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      try {
        const res = await api.convertPrToPo(id);
        showToast(`PO ${res.purchaseOrder.id} successfully created from ${id}`, 'success');
        await loadData();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  document.querySelectorAll('.btn-receive-goods').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const po = state.purchaseOrders.find(p => p.id === id);
      if (!po) return;

      const bodyHtml = `
        <p style="margin-bottom: 12px;">Confirm accepted delivery quantities for <strong>${po.id}</strong> (${po.supplierName}):</p>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>Line</th><th>SKU / Description</th><th>Ordered</th><th>Already Received</th><th>Accept Now</th></tr>
            </thead>
            <tbody>
              ${po.lines.map(l => `
                <tr>
                  <td>Line ${l.line}</td>
                  <td>${l.description}</td>
                  <td>${l.orderedQty}</td>
                  <td>${l.receivedQty || 0}</td>
                  <td>
                    <input type="number" class="form-control grn-qty" data-line="${l.line}" 
                      value="${Math.max(0, l.orderedQty - (l.receivedQty || 0))}" 
                      min="0" max="${l.orderedQty - (l.receivedQty || 0)}" style="width: 80px;">
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="form-group" style="margin-top: 14px;">
          <label class="form-label">Warehouse Receiving Facility</label>
          <input type="text" id="grn-warehouse" class="form-control" value="Austin Main Distribution Center (Dock 2)">
        </div>
        <div class="form-group">
          <label class="form-label">Quality Inspection Result</label>
          <select id="grn-inspection" class="form-control">
            <option value="Pass">Pass - All items meet technical specifications</option>
            <option value="PartialPass">Partial Pass - Transit packaging defect flagged</option>
          </select>
        </div>
      `;

      const footerHtml = `
        <button class="btn btn-outline btn-sm" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
        <button class="btn btn-primary btn-sm" id="btn-submit-grn">Confirm & Post Receipt</button>
      `;

      openModal(`Warehouse Receiving (GRN): ${po.id}`, bodyHtml, footerHtml);

      document.getElementById('btn-submit-grn').addEventListener('click', async () => {
        const lines = [];
        document.querySelectorAll('.grn-qty').forEach(input => {
          const poLine = Number(input.dataset.line);
          const acceptedQty = Number(input.value);
          const poLineData = po.lines.find(l => l.line === poLine);
          lines.push({
            poLine,
            sku: poLineData?.sku,
            deliveredQty: acceptedQty,
            acceptedQty,
            rejectedQty: 0
          });
        });

        const receiptData = {
          poId: po.id,
          type: 'GoodsReceipt',
          warehouse: document.getElementById('grn-warehouse').value,
          inspectionResult: document.getElementById('grn-inspection').value,
          lines
        };

        try {
          await api.createReceipt(receiptData);
          showToast(`Goods Receipt (GRN) created for ${po.id}. Accepted for 3-way match!`, 'success');
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
      <input type="text" id="pr-title" class="form-control" placeholder="e.g. Production Lab High-Performance Workstations Refresh">
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
      <div class="form-group">
        <label class="form-label">Type</label>
        <select id="pr-type" class="form-control">
          <option value="Goods">Goods</option>
          <option value="Capital Expenditure">Capital Expenditure (Capex)</option>
          <option value="Service">Professional Service</option>
          <option value="Operating Expenditure">Operating Expenditure (Opex)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Purchasing Channel</label>
        <select id="pr-channel" class="form-control">
          <option value="Catalog">Approved Master Catalog</option>
          <option value="Non-Catalog">Non-Catalog (Requires Sourcing)</option>
        </select>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Select Pre-Negotiated Catalog Item</label>
      <select id="pr-catalog-item" class="form-control">
        ${state.catalogs.map(c => `
          <option value="${c.id}" data-price="${c.unitPrice}" data-desc="${c.name}" data-sku="${c.sku}">
            ${c.name} - $${c.unitPrice.toLocaleString()} (${c.supplierName})
          </option>
        `).join('')}
      </select>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
      <div class="form-group">
        <label class="form-label">Quantity</label>
        <input type="number" id="pr-qty" class="form-control" value="5" min="1">
      </div>
      <div class="form-group">
        <label class="form-label">Budget Center Allocation</label>
        <input type="text" id="pr-budget" class="form-control" value="CAPEX-IT-2026-08">
      </div>
    </div>
  `;

  const footerHtml = `
    <button class="btn btn-outline btn-sm" onclick="document.getElementById('modal-overlay').classList.remove('open')">Cancel</button>
    <button class="btn btn-primary btn-sm" id="btn-save-pr">Submit Requisition</button>
  `;

  openModal('Create New Purchase Requisition', bodyHtml, footerHtml);

  document.getElementById('btn-save-pr').addEventListener('click', async () => {
    const sel = document.getElementById('pr-catalog-item');
    const opt = sel.options[sel.selectedIndex];
    const qty = Number(document.getElementById('pr-qty').value) || 1;
    const unitPrice = Number(opt.dataset.price) || 1000;
    const totalAmount = qty * unitPrice;

    const prData = {
      title: document.getElementById('pr-title').value || 'Requisition Order',
      type: document.getElementById('pr-type').value,
      channel: document.getElementById('pr-channel').value,
      budgetCode: document.getElementById('pr-budget').value,
      totalAmount,
      items: [
        {
          line: 1,
          sku: opt.dataset.sku,
          description: opt.dataset.desc,
          qty,
          unitPrice,
          total: totalAmount
        }
      ]
    };

    try {
      const res = await api.createRequisition(prData);
      showToast(`Requisition ${res.requisition.id} submitted for approval`, 'success');
      closeModal();
      await loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

function openAuctionModal() {
  const auction = state.auctions[0];
  if (!auction) return;

  const bodyHtml = `
    <div style="background: var(--slate-900); color: #fff; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span class="badge badge-success">LIVE REVERSE AUCTION</span>
          <h3 style="margin-top: 6px;">${auction.title}</h3>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; color: var(--slate-400);">AUTHORITATIVE SERVER CLOCK</div>
          <div style="font-size: 20px; font-weight: 800; color: #60a5fa;" id="auction-timer">LIVE EVENT</div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 14px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
        <div>
          <small style="color: var(--slate-400);">Reserve Price:</small><br>
          <strong>$${auction.reservePrice.toLocaleString()}</strong>
        </div>
        <div>
          <small style="color: var(--slate-400);">Current Winning Bid:</small><br>
          <strong style="color: #34d399; font-size: 18px;">$${auction.currentLowBid.toLocaleString()}</strong>
        </div>
        <div>
          <small style="color: var(--slate-400);">Min Decrement:</small><br>
          <strong>$${auction.minDecrement.toLocaleString()}</strong>
        </div>
      </div>
    </div>

    <h4 style="margin: 14px 0 8px;">Submit New Competitive Bid</h4>
    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 16px;">
      <select id="auction-bidder" class="form-control" style="width: 220px;">
        <option value="SUP-102">Apex Cloud & IT Solutions</option>
        <option value="SUP-101">Global Industrial Supply</option>
        <option value="SUP-103">Nova Precision Engineering</option>
      </select>
      <input type="number" id="auction-amount" class="form-control" 
        value="${auction.currentLowBid - auction.minDecrement}" 
        max="${auction.currentLowBid - auction.minDecrement}" 
        step="${auction.minDecrement}">
      <button class="btn btn-primary" id="btn-submit-auction-bid">Submit Bid</button>
    </div>

    <h4>Authoritative Bidding Audit Log</h4>
    <div class="table-container" style="max-height: 200px; overflow-y: auto;">
      <table class="data-table">
        <thead>
          <tr><th>Rank</th><th>Bidder</th><th>Amount</th><th>Server Timestamp</th></tr>
        </thead>
        <tbody id="auction-bids-tbody">
          ${auction.bids.map(b => `
            <tr>
              <td><span class="badge ${b.rank === 1 ? 'badge-success' : 'badge-neutral'}">Rank #${b.rank}</span></td>
              <td><strong>${b.bidderName}</strong></td>
              <td><strong>$${b.amount.toLocaleString()}</strong></td>
              <td><small>${b.timestamp.split('T')[1].replace('Z','')}</small></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  openModal(`Dynamic Reverse Auction: ${auction.id}`, bodyHtml, '');

  document.getElementById('btn-submit-auction-bid').addEventListener('click', async () => {
    const bidderId = document.getElementById('auction-bidder').value;
    const amount = Number(document.getElementById('auction-amount').value);

    try {
      const res = await api.submitBid(auction.id, bidderId, amount);
      showToast(`Bid of $${amount.toLocaleString()} submitted! New Rank: #${res.newBid.rank}`, 'success');
      await loadData();
      closeModal();
      openAuctionModal(); // Reopen updated
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ==========================================
// 3. CONTRACT WORKSPACE (CLM)
// ==========================================
function renderContractWorkspace() {
  contentBody.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-title">Active Contracts</div>
        <div class="stat-value">${state.contracts.filter(c => c.status === 'Active').length}</div>
        <div class="stat-desc">Executed enterprise agreements</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Committed Contract Value</div>
        <div class="stat-value">$2.28M</div>
        <div class="stat-desc">Governed by rate cards</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Clause Deviations</div>
        <div class="stat-value" style="color: var(--danger);">1</div>
        <div class="stat-desc">Flagged for legal review</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Active Obligations</div>
        <div class="stat-value" style="color: var(--info);">5</div>
        <div class="stat-desc">Monitored SLAs & compliance</div>
      </div>
    </div>

    <!-- Clause Deviation Alert Banner -->
    <div style="background: var(--warning-light); border: 1px solid var(--warning-border); padding: 14px 18px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <strong style="color: var(--warning);">⚠️ AI Clause Deviation Detected on CTR-603:</strong>
        <span style="font-size: 13px; color: var(--slate-700); margin-left: 8px;">Vendor proposed 0.5x liability cap vs standard 2.0x policy in Draft SOW.</span>
      </div>
      <button class="btn btn-outline btn-sm" id="btn-inspect-deviation">Inspect Deviation</button>
    </div>

    <div class="workspace-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Enterprise Contract Repository</h2>
          <p class="section-desc">Lifecycle management, clause playbooks, e-signature tracking, and obligation enforcement.</p>
        </div>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Contract ID / Title</th>
              <th>Supplier</th>
              <th>Type</th>
              <th>Total Value</th>
              <th>Notice Period</th>
              <th>E-Signature</th>
              <th>Status</th>
              <th>Obligations</th>
            </tr>
          </thead>
          <tbody>
            ${state.contracts.map(c => `
              <tr>
                <td>
                  <strong>${c.id}</strong><br>
                  <span>${c.title}</span>
                </td>
                <td>${c.supplierName}</td>
                <td><span class="badge badge-neutral">${c.type}</span></td>
                <td><strong>$${c.totalValue.toLocaleString()}</strong> ${c.currency}</td>
                <td>${c.noticePeriodDays} days before expiry</td>
                <td>
                  <span class="badge ${c.eSignatureStatus === 'Executed' ? 'badge-success' : 'badge-warning'}">
                    ${c.eSignatureStatus}
                  </span>
                </td>
                <td>
                  <span class="badge ${c.status === 'Active' ? 'badge-success' : 'badge-warning'}">
                    ${c.status}
                  </span>
                </td>
                <td>
                  <span class="badge badge-info">${c.obligations.length} Active</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btn-inspect-deviation').addEventListener('click', () => {
    const c = state.contracts.find(item => item.id === 'CTR-603');
    const bodyHtml = `
      <div style="background: var(--slate-50); border: 1px solid var(--slate-200); padding: 14px; border-radius: 8px; margin-bottom: 14px;">
        <h4 style="color: var(--danger);">Clause: Indemnification & Limitation of Liability</h4>
        <p style="margin-top: 6px; font-size: 13px;">
          <strong>Standard Policy Term:</strong> Mutual aggregate liability capped at 2.0x total contract value.<br>
          <strong>Nova Precision Proposed:</strong> Liability capped at 0.5x total contract value (€90,000.00).
        </p>
      </div>
      <p style="font-size: 13px; color: var(--slate-600);">
        <strong>Legal Risk Assessment:</strong> Deviations beyond 1.0x require explicit authorization from the General Counsel and Corporate Treasurer.
      </p>
    `;
    openModal('Clause Deviation Review: CTR-603', bodyHtml, '<button class="btn btn-primary btn-sm" onclick="document.getElementById(\'modal-overlay\').classList.remove(\'open\')">Acknowledge</button>');
  });
}

// ==========================================
// 4. FINANCE & 3-WAY MATCHING WORKSPACE
// ==========================================
function renderFinanceWorkspace() {
  const matchedCount = state.invoices.filter(i => i.matchStatus === 'MATCHED').length;
  const exceptionCount = state.invoices.filter(i => i.matchStatus !== 'MATCHED').length;
  const totalLiability = state.invoices.reduce((sum, i) => sum + i.totalAmount, 0);

  contentBody.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-title">Invoices Ingested</div>
        <div class="stat-value">${state.invoices.length}</div>
        <div class="stat-desc">OCR & e-invoicing intake</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Perfect 3-Way Match</div>
        <div class="stat-value" style="color: var(--success);">${matchedCount}</div>
        <div class="stat-desc">Vouchers posted to ERP</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Exception Holds</div>
        <div class="stat-value" style="color: var(--danger);">${exceptionCount}</div>
        <div class="stat-desc">Tolerances exceeded or receipt missing</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Total AP Liability</div>
        <div class="stat-value">$${(totalLiability / 1000).toFixed(1)}k</div>
        <div class="stat-desc">Invoiced commitments</div>
      </div>
    </div>

    <div class="workspace-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Invoice Processing & 3-Way Reconciliation</h2>
          <p class="section-desc">Automated matching between PO commitment, Goods Receipt acceptance, and Invoiced rates.</p>
        </div>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Invoice # / Date</th>
              <th>PO Reference</th>
              <th>Supplier</th>
              <th>Total Amount</th>
              <th>3-Way Match Status</th>
              <th>Payment Status</th>
              <th>ERP Posting</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.invoices.map(inv => `
              <tr>
                <td>
                  <strong>${inv.invoiceNumber}</strong><br>
                  <small style="color: var(--slate-500);">${inv.invoiceDate} (Due: ${inv.dueDate})</small>
                </td>
                <td><strong>${inv.poId}</strong></td>
                <td>${inv.supplierName}</td>
                <td><strong>$${inv.totalAmount.toLocaleString()}</strong> ${inv.currency}</td>
                <td>
                  <span class="badge ${inv.matchStatus === 'MATCHED' ? 'badge-success' : inv.matchStatus === 'MISSING_RECEIPT' ? 'badge-info' : 'badge-danger'}">
                    ${inv.matchStatus}
                  </span>
                </td>
                <td>
                  <span class="badge ${inv.paymentStatus === 'Scheduled' ? 'badge-success' : inv.paymentStatus === 'Disputed' ? 'badge-danger' : 'badge-warning'}">
                    ${inv.paymentStatus}
                  </span>
                </td>
                <td>
                  ${inv.erpPosting.posted 
                    ? `<span class="badge badge-success">✓ ${inv.erpPosting.voucherId}</span>`
                    : `<span class="badge badge-neutral">Not Posted</span>`}
                </td>
                <td>
                  <button class="btn btn-outline btn-sm btn-inspect-match" data-id="${inv.id}">
                    🔍 Match Audit
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.querySelectorAll('.btn-inspect-match').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const inv = state.invoices.find(i => i.id === id);
      if (!inv) return;

      const bodyHtml = `
        <div style="background: var(--slate-50); border: 1px solid var(--slate-200); padding: 14px; border-radius: 8px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between;">
            <div>
              <strong>Invoice:</strong> ${inv.invoiceNumber}<br>
              <strong>PO Reference:</strong> ${inv.poId}<br>
              <strong>Supplier:</strong> ${inv.supplierName}
            </div>
            <div style="text-align: right;">
              <span class="badge ${inv.matchStatus === 'MATCHED' ? 'badge-success' : 'badge-danger'}" style="font-size: 12px;">
                ${inv.matchStatus}
              </span><br>
              <strong>Total: $${inv.totalAmount.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        ${inv.discrepancies.length > 0 ? `
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

        <h4 style="margin: 12px 0 6px;">Invoice Line Items & Rates</h4>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr><th>Line</th><th>SKU</th><th>Billed Qty</th><th>Billed Unit Rate</th><th>Line Total</th></tr>
            </thead>
            <tbody>
              ${inv.lines.map(l => `
                <tr>
                  <td>Line ${l.line}</td>
                  <td>${l.sku}</td>
                  <td>${l.qty}</td>
                  <td>$${l.unitPrice.toLocaleString()}</td>
                  <td>$${l.lineTotal.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      const footerHtml = `
        <button class="btn btn-outline btn-sm" id="btn-reevaluate-match">🔄 Re-evaluate Match</button>
        ${inv.matchStatus === 'MATCHED' && !inv.erpPosting.posted ? `
          <button class="btn btn-success btn-sm" id="btn-post-erp">Post to ERP (Create Voucher)</button>
        ` : ''}
      `;

      openModal(`3-Way Match Inspection: ${inv.invoiceNumber}`, bodyHtml, footerHtml);

      const reevalBtn = document.getElementById('btn-reevaluate-match');
      if (reevalBtn) {
        reevalBtn.addEventListener('click', async () => {
          try {
            await api.reevaluateInvoice(inv.id);
            showToast('3-Way Match re-calculated against latest receiving records', 'success');
            closeModal();
            await loadData();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      }

      const postBtn = document.getElementById('btn-post-erp');
      if (postBtn) {
        postBtn.addEventListener('click', async () => {
          try {
            const res = await api.postToErp(inv.id);
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

// ==========================================
// 5. INTELLIGENCE & ANALYTICS WORKSPACE
// ==========================================
function renderIntelligenceWorkspace() {
  const a = state.analytics;

  contentBody.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-title">Total Annual Spend</div>
        <div class="stat-value">$${(a.totalAnnualSpend / 1000000).toFixed(2)}M</div>
        <div class="stat-desc">Unified cross-entity spend</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Contract Coverage</div>
        <div class="stat-value" style="color: var(--success);">${a.contractCoveragePct}%</div>
        <div class="stat-desc">Spend on active agreements</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Maverick (Off-Contract)</div>
        <div class="stat-value" style="color: var(--danger);">$${(a.maverickSpendAmount / 1000000).toFixed(2)}M</div>
        <div class="stat-desc">Target for consolidation</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Realized Savings YTD</div>
        <div class="stat-value" style="color: var(--success);">$${(a.realizedSavingsYTD / 1000000).toFixed(2)}M</div>
        <div class="stat-desc">Audited financial impact</div>
      </div>
    </div>

    <!-- Category Distribution & Savings Pipeline Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <!-- Spend by Category -->
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

      <!-- 5-Stage Savings Pipeline -->
      <div class="workspace-section">
        <div class="section-header">
          <h3 class="section-title">Procurement Savings Pipeline</h3>
        </div>
        <div style="padding: 16px;">
          ${(a.savingsPipeline || []).map(pipe => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--slate-200);">
              <div>
                <strong>${pipe.stage}</strong><br>
                <small style="color: var(--slate-500);">${pipe.count} strategic projects</small>
              </div>
              <div style="text-align: right;">
                <strong style="color: var(--success);">$${(pipe.value / 1000000).toFixed(2)}M</strong>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 6. VENDOR SELF-SERVICE PORTAL
// ==========================================
function renderVendorPortal() {
  const currentSupplier = state.suppliers.find(s => s.id === state.selectedVendorId) || state.suppliers[0];
  const vendorPos = state.purchaseOrders.filter(p => p.supplierId === currentSupplier.id);
  const vendorInvoices = state.invoices.filter(i => i.supplierId === currentSupplier.id);

  contentBody.innerHTML = `
    <!-- Vendor Persona Switcher -->
    <div style="background: var(--slate-900); color: #fff; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <span class="badge badge-info" style="margin-bottom: 4px;">VENDOR PORTAL CONSOLE</span>
        <h3>${currentSupplier.name} (${currentSupplier.code})</h3>
        <p style="font-size: 12px; color: var(--slate-400); margin-top: 2px;">
          Isolated external counterparty session • Payment Terms: ${currentSupplier.paymentTerms}
        </p>
      </div>
      <div>
        <label style="font-size: 11px; text-transform: uppercase; color: var(--slate-400); display: block; margin-bottom: 4px;">Switch Vendor View:</label>
        <select id="select-vendor-persona" class="form-control" style="width: 260px;">
          ${state.suppliers.map(s => `
            <option value="${s.id}" ${s.id === currentSupplier.id ? 'selected' : ''}>${s.name}</option>
          `).join('')}
        </select>
      </div>
    </div>

    <!-- Vendor Purchase Orders -->
    <div class="workspace-section">
      <div class="section-header">
        <h3 class="section-title">Purchase Orders Acknowledged & In Fulfillment</h3>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Order Date</th>
              <th>Status</th>
              <th>Lines</th>
              <th>Total Amount</th>
              <th>Acknowledgement</th>
            </tr>
          </thead>
          <tbody>
            ${vendorPos.length === 0 ? '<tr><td colspan="6">No purchase orders assigned to this vendor.</td></tr>' : vendorPos.map(p => `
              <tr>
                <td><strong>${p.id}</strong></td>
                <td>${p.orderDate.split('T')[0]}</td>
                <td><span class="badge badge-info">${p.status}</span></td>
                <td>${p.lines.length} lines</td>
                <td><strong>$${p.totalAmount.toLocaleString()}</strong></td>
                <td><span class="badge badge-success">✓ ${p.supplierAcknowledgement}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Vendor Invoices & Payment Status -->
    <div class="workspace-section">
      <div class="section-header">
        <h3 class="section-title">Submitted Invoices & Real-Time Payment Status</h3>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Validation Status</th>
              <th>Payment Remittance</th>
            </tr>
          </thead>
          <tbody>
            ${vendorInvoices.length === 0 ? '<tr><td colspan="6">No invoices submitted.</td></tr>' : vendorInvoices.map(inv => `
              <tr>
                <td><strong>${inv.invoiceNumber}</strong></td>
                <td>${inv.invoiceDate}</td>
                <td>${inv.dueDate}</td>
                <td><strong>$${inv.totalAmount.toLocaleString()}</strong></td>
                <td>
                  <span class="badge ${inv.matchStatus === 'MATCHED' ? 'badge-success' : 'badge-warning'}">
                    ${inv.matchStatus}
                  </span>
                </td>
                <td>
                  <span class="badge ${inv.paymentStatus === 'Scheduled' ? 'badge-success' : inv.paymentStatus === 'Disputed' ? 'badge-danger' : 'badge-neutral'}">
                    ${inv.paymentStatus}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('select-vendor-persona').addEventListener('change', (e) => {
    state.selectedVendorId = e.target.value;
    renderVendorPortal();
  });
}

// ==========================================
// 7. ADMINISTRATION & AUDIT WORKSPACE
// ==========================================
function renderAdminWorkspace() {
  contentBody.innerHTML = `
    <!-- Governance & Controls Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
      <div class="workspace-section">
        <div class="section-header">
          <h3 class="section-title">Multi-Entity Corporate Architecture</h3>
        </div>
        <div style="padding: 16px;">
          ${(state.system.entities || []).map(ent => `
            <div style="padding: 10px; border: 1px solid var(--slate-200); border-radius: 6px; margin-bottom: 8px;">
              <strong>${ent.name}</strong><br>
              <small style="color: var(--slate-500);">Entity Code: ${ent.id} • Currency: ${ent.currency} • Country: ${ent.country}</small>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="workspace-section">
        <div class="section-header">
          <h3 class="section-title">Segregation of Duties (SoD) Rule Engine</h3>
        </div>
        <div style="padding: 16px; font-size: 13px;">
          <div style="margin-bottom: 10px; color: var(--success);">
            <strong>✓ Rule SoD-01 (Active):</strong> Requester cannot approve their own spend requisition.
          </div>
          <div style="margin-bottom: 10px; color: var(--success);">
            <strong>✓ Rule SoD-02 (Active):</strong> Bank account updater cannot approve AP disbursements.
          </div>
          <div style="margin-bottom: 10px; color: var(--success);">
            <strong>✓ Rule SoD-03 (Active):</strong> Sealed bids hidden until formal RFx deadline expiration.
          </div>
          <div style="color: var(--success);">
            <strong>✓ Rule SoD-04 (Active):</strong> Invoices require accepted receipt before ERP voucher creation.
          </div>
        </div>
      </div>
    </div>

    <!-- Immutable Audit Trail -->
    <div class="workspace-section">
      <div class="section-header">
        <div>
          <h2 class="section-title">Cryptographic Tamper-Evident Audit Ledger</h2>
          <p class="section-desc">SHA-256 chained transaction trail preserving complete procurement accountability.</p>
        </div>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Audit ID / Timestamp</th>
              <th>Actor</th>
              <th>Action Event</th>
              <th>Target</th>
              <th>Details</th>
              <th>Integrity</th>
            </tr>
          </thead>
          <tbody>
            ${state.auditLogs.map(log => `
              <tr>
                <td>
                  <strong>${log.id}</strong><br>
                  <small style="color: var(--slate-500);">${log.timestamp.replace('T', ' ').slice(0, 19)}</small>
                </td>
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

// ==========================================
// AI COPILOT INTERACTION
// ==========================================
function setupAiCopilot() {
  aiHeader.addEventListener('click', () => {
    aiDrawer.classList.toggle('collapsed');
    btnToggleAi.textContent = aiDrawer.classList.contains('collapsed') ? 'Expand ▲' : 'Collapse ▼';
  });

  async function handleSend(promptText, mode = 'general') {
    const text = promptText || aiInput.value.trim();
    if (!text) return;

    // Append user message
    const userMsg = document.createElement('div');
    userMsg.className = 'ai-message ai-message-user';
    userMsg.textContent = text;
    aiMessages.appendChild(userMsg);
    aiInput.value = '';

    // Append loading bot message
    const botMsg = document.createElement('div');
    botMsg.className = 'ai-message ai-message-bot';
    botMsg.innerHTML = '<em>Thinking with enterprise S2P domain knowledge...</em>';
    aiMessages.appendChild(botMsg);
    aiMessages.scrollTop = aiMessages.scrollHeight;

    try {
      const res = await api.askAi(text, mode);
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
      botMsg.innerHTML = `<span style="color: var(--danger);">Failed to query AI: ${err.message}</span>`;
    }
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }

  btnSendAi.addEventListener('click', () => handleSend());
  aiInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  document.querySelectorAll('.ai-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const prompt = e.currentTarget.dataset.prompt;
      const mode = e.currentTarget.dataset.mode;
      if (aiDrawer.classList.contains('collapsed')) {
        aiDrawer.classList.remove('collapsed');
        btnToggleAi.textContent = 'Collapse ▼';
      }
      handleSend(prompt, mode);
    });
  });
}

// Navigation event listeners
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    state.activeWorkspace = item.dataset.workspace;
    renderCurrentWorkspace();
  });
});

document.getElementById('btn-refresh').addEventListener('click', async () => {
  await loadData();
  showToast('Platform data synchronized', 'info');
});

// Boot application
loadData();
setupAiCopilot();

