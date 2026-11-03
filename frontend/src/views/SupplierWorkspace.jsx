import React, { useState } from 'react';
import { client } from '../api/client.js';

export function SupplierWorkspace({ suppliers, onReload, showToast, onOpenModal }) {
  const activeCount = suppliers.filter(s => s.stage === 'Active').length;
  const underReviewCount = suppliers.filter(s => s.stage === 'UnderReview' || s.stage === 'Registered').length;
  const unverifiedBankCount = suppliers.filter(s => !s.bankVerified).length;

  const handleVerifyBank = async (id) => {
    try {
      await client.verifySupplierBank(id);
      showToast(`Treasury dual-control verification recorded for ${id}`, 'success');
      onReload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const inspectSupplier = (s) => {
    onOpenModal(
      `Supplier Master: ${s.name} (${s.code})`,
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <strong>Legal Name:</strong> {s.name}<br />
            <strong>Tax Identifier:</strong> {s.taxId}<br />
            <strong>Payment Terms:</strong> {s.paymentTerms}<br />
            <strong>Contact:</strong> {s.contacts?.[0]?.name} ({s.contacts?.[0]?.email})
          </div>
          <div>
            <strong>Current Stage:</strong> {s.stage}<br />
            <strong>Bank Verification:</strong> {s.bankVerified ? 'Verified' : 'Pending Dual-Control'}<br />
            <strong>Sanctions Clearance:</strong> {s.sanctionsCheck}<br />
            <strong>Risk Score:</strong> {s.riskScore}/100 ({s.riskLevel})
          </div>
        </div>
        <h4 style={{ marginTop: '10px' }}>Compliance & Legal Documents</h4>
        <table className="data-table">
          <thead>
            <tr><th>Document</th><th>Type</th><th>Expiry</th><th>Status</th></tr>
          </thead>
          <tbody>
            {(s.documents || []).map((d, i) => (
              <tr key={i}>
                <td>{d.name}</td>
                <td>{d.type}</td>
                <td>{d.expires}</td>
                <td><span className={`badge ${d.status === 'Verified' ? 'badge-success' : 'badge-warning'}`}>{d.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
      <div style={{ display: 'flex', gap: '8px' }}>
        <select id="stage-select-modal" className="form-control" defaultValue={s.stage} style={{ width: '160px' }}>
          <option value="Registered">Stage: Registered</option>
          <option value="UnderReview">Stage: UnderReview</option>
          <option value="Qualified">Stage: Qualified</option>
          <option value="Active">Stage: Active</option>
          <option value="Suspended">Stage: Suspended</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={async () => {
          const newStage = document.getElementById('stage-select-modal').value;
          try {
            await client.updateSupplierStage(s.id, newStage);
            showToast(`Supplier stage updated to ${newStage}`, 'success');
            onReload();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }}>Save Stage</button>
      </div>
    );
  };

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Authoritative Suppliers</div>
          <div className="stat-value">{suppliers.length}</div>
          <div className="stat-desc">Master records in registry</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Active for Commitments</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{activeCount}</div>
          <div className="stat-desc">Bank verified & activated</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Under Qualification</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{underReviewCount}</div>
          <div className="stat-desc">Compliance review pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Bank Verification Required</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{unverifiedBankCount}</div>
          <div className="stat-desc">Dual-control Treasury gate</div>
        </div>
      </div>

      <div className="workspace-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Supplier Master Directory</h2>
            <p className="section-desc">Onboarding, qualification, risk scoring, and segmentation governance.</p>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
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
              {suppliers.map(s => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.name}</strong><br />
                    <small style={{ color: 'var(--slate-500)' }}>{s.code} • {s.country}</small>
                  </td>
                  <td>{s.category}</td>
                  <td>
                    <span className="badge badge-neutral">{s.tier}</span>{' '}
                    <span className={`badge ${s.segment === 'Strategic' ? 'badge-info' : s.segment === 'Restricted' ? 'badge-danger' : 'badge-neutral'}`}>{s.segment}</span>
                  </td>
                  <td>
                    <span className={`badge ${s.stage === 'Active' ? 'badge-success' : s.stage === 'Suspended' ? 'badge-danger' : 'badge-warning'}`}>
                      {s.stage}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: s.riskScore > 60 ? 'var(--danger)' : s.riskScore > 35 ? 'var(--warning)' : 'var(--success)' }}>
                      {s.riskScore}/100
                    </strong>{' '}
                    <small>({s.riskLevel})</small>
                  </td>
                  <td>
                    {s.bankVerified 
                      ? <span className="badge badge-success">✓ Verified</span>
                      : <span className="badge badge-danger">✕ Unverified</span>}
                  </td>
                  <td>
                    <span className={`badge ${s.sanctionsCheck === 'Passed' ? 'badge-success' : 'badge-warning'}`}>
                      {s.sanctionsCheck}
                    </span>
                  </td>
                  <td><strong>{s.scorecard?.onTimeDelivery ? `${s.scorecard.onTimeDelivery}%` : 'N/A'}</strong></td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {!s.bankVerified && (
                        <button className="btn btn-outline btn-sm" onClick={() => handleVerifyBank(s.id)} title="Treasury Dual-Control Verification">
                          Verify Bank
                        </button>
                      )}
                      <button className="btn btn-outline btn-sm" onClick={() => inspectSupplier(s)}>
                        Inspect
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

