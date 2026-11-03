import React, { useState, useEffect } from 'react';
import { client } from './api/client.js';
import { SupplierWorkspace } from './views/SupplierWorkspace.jsx';
import { ProcurementWorkspace } from './views/ProcurementWorkspace.jsx';
import { ContractWorkspace } from './views/ContractWorkspace.jsx';
import { FinanceWorkspace } from './views/FinanceWorkspace.jsx';
import { IntelligenceWorkspace } from './views/IntelligenceWorkspace.jsx';
import { VendorPortal } from './views/VendorPortal.jsx';
import { AdminWorkspace } from './views/AdminWorkspace.jsx';
import { AiCopilot } from './components/AiCopilot.jsx';

export default function App() {
  const [activeWorkspace, setActiveWorkspace] = useState('supplier');
  const [system, setSystem] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);

  // Toast
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Modal
  const [modal, setModal] = useState({ open: false, title: '', content: null, actions: null });
  const openModal = (title, content, actions = null) => {
    setModal({ open: true, title, content, actions });
  };
  const closeModal = () => {
    setModal({ open: false, title: '', content: null, actions: null });
  };

  const loadData = async () => {
    try {
      const [sys, sups, cats, reqs, ords, rcpts, invs, aucs, ctrs, anl, logs] = await Promise.all([
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
        client.getAuditLogs(50)
      ]);

      setSystem(sys);
      setSuppliers(sups);
      setCatalogs(cats);
      setRequisitions(reqs);
      setOrders(ords);
      setReceipts(rcpts);
      setInvoices(invs);
      setAuctions(aucs);
      setContracts(ctrs);
      setAnalytics(anl);
      setAuditLogs(logs);
    } catch (err) {
      showToast(`Data load error: ${err.message}`, 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const titles = {
    supplier: 'Supplier Management & SRM Workspace',
    procurement: 'Procurement, Sourcing & Purchase Orders',
    contract: 'Contract Lifecycle Management (CLM)',
    finance: 'Finance & 3-Way Invoice Matching',
    intelligence: 'Spend Analytics & Savings Intelligence',
    'vendor-portal': 'Vendor Self-Service Portal (External View)',
    admin: 'Administration, Governance & Audit Trail'
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-icon">⚡</div>
          <div>
            <div className="brand-title">ProcureFlow</div>
            <div className="brand-subtitle">Source-to-Pay S2P</div>
          </div>
        </div>

        <ul className="nav-menu">
          <li className="nav-section-title">Core Workspaces</li>
          <li className={`nav-item ${activeWorkspace === 'supplier' ? 'active' : ''}`} onClick={() => setActiveWorkspace('supplier')}>
            <span className="nav-icon">🏢</span>
            <span>1. Suppliers & SRM</span>
            <span className="nav-badge">{suppliers.length}</span>
          </li>
          <li className={`nav-item ${activeWorkspace === 'procurement' ? 'active' : ''}`} onClick={() => setActiveWorkspace('procurement')}>
            <span className="nav-icon">🛒</span>
            <span>2. Procurement & PO</span>
            <span className="nav-badge">{requisitions.filter(r => r.status === 'PendingApproval').length}</span>
          </li>
          <li className={`nav-item ${activeWorkspace === 'contract' ? 'active' : ''}`} onClick={() => setActiveWorkspace('contract')}>
            <span className="nav-icon">📜</span>
            <span>3. Contract CLM</span>
            <span className="nav-badge">{contracts.length}</span>
          </li>
          <li className={`nav-item ${activeWorkspace === 'finance' ? 'active' : ''}`} onClick={() => setActiveWorkspace('finance')}>
            <span className="nav-icon">💳</span>
            <span>4. Finance & 3-Way Match</span>
            <span className="nav-badge">{invoices.filter(i => i.matchStatus !== 'MATCHED').length}</span>
          </li>
          <li className={`nav-item ${activeWorkspace === 'intelligence' ? 'active' : ''}`} onClick={() => setActiveWorkspace('intelligence')}>
            <span className="nav-icon">📊</span>
            <span>5. Spend Intelligence</span>
          </li>

          <li className="nav-section-title">External Portal</li>
          <li className={`nav-item ${activeWorkspace === 'vendor-portal' ? 'active' : ''}`} onClick={() => setActiveWorkspace('vendor-portal')}>
            <span className="nav-icon">🌐</span>
            <span>6. Vendor Self-Service</span>
          </li>

          <li className="nav-section-title">Platform Governance</li>
          <li className={`nav-item ${activeWorkspace === 'admin' ? 'active' : ''}`} onClick={() => setActiveWorkspace('admin')}>
            <span className="nav-icon">⚙️</span>
            <span>7. Administration & SoD</span>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div className="user-badge">
            <div className="user-avatar">SJ</div>
            <div className="user-info">
              <div className="user-name">Sarah Jenkins</div>
              <div className="user-role">Procurement Director (Admin)</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">{titles[activeWorkspace]}</h1>
          </div>
          <div className="topbar-right">
            <span className="pill-badge pill-godmode">⚡ GOD MODE ACTIVE</span>
            <span className="pill-badge pill-entity">🏢 Global Holdings USA Inc. (USD)</span>
            <button className="btn btn-outline btn-sm" onClick={() => { loadData(); showToast('Platform synchronized', 'info'); }}>
              🔄 Refresh
            </button>
          </div>
        </header>

        <main className="content-body">
          {activeWorkspace === 'supplier' && (
            <SupplierWorkspace suppliers={suppliers} onReload={loadData} showToast={showToast} onOpenModal={openModal} />
          )}
          {activeWorkspace === 'procurement' && (
            <ProcurementWorkspace requisitions={requisitions} catalogs={catalogs} orders={orders} auctions={auctions} onReload={loadData} showToast={showToast} onOpenModal={openModal} />
          )}
          {activeWorkspace === 'contract' && (
            <ContractWorkspace contracts={contracts} onOpenModal={openModal} />
          )}
          {activeWorkspace === 'finance' && (
            <FinanceWorkspace invoices={invoices} onReload={loadData} showToast={showToast} onOpenModal={openModal} />
          )}
          {activeWorkspace === 'intelligence' && (
            <IntelligenceWorkspace analytics={analytics} />
          )}
          {activeWorkspace === 'vendor-portal' && (
            <VendorPortal suppliers={suppliers} orders={orders} invoices={invoices} />
          )}
          {activeWorkspace === 'admin' && (
            <AdminWorkspace system={system} auditLogs={auditLogs} />
          )}
        </main>
      </div>

      {/* AI Copilot Floating Drawer */}
      <AiCopilot />

      {/* Modal Dialog */}
      {modal.open && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') closeModal(); }}>
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">{modal.title}</h3>
              <button className="btn btn-outline btn-sm" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">{modal.content}</div>
            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={closeModal}>Close</button>
              {modal.actions}
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '⚠️' : 'ℹ️'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

