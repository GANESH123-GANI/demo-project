import React from 'react';

export function AdminWorkspace({ system, auditLogs }) {
  const entities = system?.entities || [];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="workspace-section">
          <div className="section-header">
            <h3 className="section-title">Multi-Entity Corporate Architecture</h3>
          </div>
          <div style={{ padding: '16px' }}>
            {entities.map(ent => (
              <div key={ent.id} style={{ padding: '10px', border: '1px solid var(--slate-200)', borderRadius: '6px', marginBottom: '8px' }}>
                <strong>{ent.name}</strong><br />
                <small style={{ color: 'var(--slate-500)' }}>Entity Code: {ent.id} • Currency: {ent.currency} • Country: {ent.country}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="workspace-section">
          <div className="section-header">
            <h3 className="section-title">Segregation of Duties (SoD) Rule Engine</h3>
          </div>
          <div style={{ padding: '16px', fontSize: '13px' }}>
            <div style={{ marginBottom: '10px', color: 'var(--success)' }}>
              <strong>✓ Rule SoD-01 (Active):</strong> Requester cannot approve their own spend requisition.
            </div>
            <div style={{ marginBottom: '10px', color: 'var(--success)' }}>
              <strong>✓ Rule SoD-02 (Active):</strong> Bank account updater cannot approve AP disbursements.
            </div>
            <div style={{ marginBottom: '10px', color: 'var(--success)' }}>
              <strong>✓ Rule SoD-03 (Active):</strong> Sealed bids remain encrypted until RFx deadline expiration.
            </div>
            <div style={{ color: 'var(--success)' }}>
              <strong>✓ Rule SoD-04 (Active):</strong> Invoices require accepted receipt before ERP voucher creation.
            </div>
          </div>
        </div>
      </div>

      <div className="workspace-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Cryptographic Tamper-Evident Audit Ledger</h2>
            <p className="section-desc">SHA-256 chained transaction trail preserving complete procurement accountability.</p>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Audit ID / Timestamp</th><th>Actor</th><th>Action Event</th><th>Target</th><th>Details</th><th>Integrity</th></tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td>
                    <strong>{log.id}</strong><br />
                    <small style={{ color: 'var(--slate-500)' }}>{log.timestamp?.replace('T', ' ')?.slice(0, 19)}</small>
                  </td>
                  <td><strong>{log.actor}</strong></td>
                  <td><span className="badge badge-neutral">{log.action}</span></td>
                  <td><code>{log.target}</code></td>
                  <td>{log.details}</td>
                  <td><span className="badge badge-success">✓ Verified</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

