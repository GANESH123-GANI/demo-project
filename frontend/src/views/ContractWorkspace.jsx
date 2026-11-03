import React from 'react';

export function ContractWorkspace({ contracts, onOpenModal }) {
  const activeCount = contracts.filter(c => c.status === 'Active').length;

  const inspectDeviation = () => {
    onOpenModal(
      'Clause Deviation Review: CTR-603',
      <div style={{ background: 'var(--slate-50)', padding: '14px', borderRadius: '8px' }}>
        <h4 style={{ color: 'var(--danger)' }}>Clause: Limitation of Liability & Indemnification</h4>
        <p style={{ marginTop: '8px', fontSize: '13px' }}>
          <strong>Corporate Standard:</strong> Mutual aggregate liability capped at 2.0x contract value (€360,000.00).<br />
          <strong>Nova Precision Proposed:</strong> Liability capped at 0.5x contract value (€90,000.00).
        </p>
        <p style={{ marginTop: '10px', fontSize: '13px', color: 'var(--slate-600)' }}>
          <strong>Legal Risk:</strong> Non-standard liability caps require written authorization from the General Counsel and Corporate Risk Officer prior to signature.
        </p>
      </div>
    );
  };

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Active Agreements</div>
          <div className="stat-value">{activeCount}</div>
          <div className="stat-desc">Governed by rate cards</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Committed Contract Value</div>
          <div className="stat-value">$2.28M</div>
          <div className="stat-desc">Multi-year agreements</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Clause Deviations</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>1</div>
          <div className="stat-desc">Flagged for legal review</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Active Obligations</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>5</div>
          <div className="stat-desc">Monitored SLAs & compliance</div>
        </div>
      </div>

      {/* Clause Deviation Alert Banner */}
      <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning-border)', padding: '14px 18px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <strong style={{ color: 'var(--warning)' }}>⚠️ AI Clause Deviation Detected on CTR-603:</strong>
          <span style={{ fontSize: '13px', color: 'var(--slate-700)', marginLeft: '8px' }}>
            Vendor proposed 0.5x liability cap vs standard 2.0x policy in Draft SOW.
          </span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={inspectDeviation}>Inspect Deviation</button>
      </div>

      <div className="workspace-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Enterprise Contract Repository</h2>
            <p className="section-desc">Lifecycle management, clause playbooks, e-signature tracking, and obligation enforcement.</p>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
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
              {contracts.map(c => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.id}</strong><br />
                    <span>{c.title}</span>
                  </td>
                  <td>{c.supplierName}</td>
                  <td><span className="badge badge-neutral">{c.type}</span></td>
                  <td><strong>${c.totalValue?.toLocaleString()}</strong> {c.currency}</td>
                  <td>{c.noticePeriodDays} days before expiry</td>
                  <td>
                    <span className={`badge ${c.eSignatureStatus === 'Executed' ? 'badge-success' : 'badge-warning'}`}>
                      {c.eSignatureStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${c.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td><span className="badge badge-info">{c.obligations?.length || 0} Monitored</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

