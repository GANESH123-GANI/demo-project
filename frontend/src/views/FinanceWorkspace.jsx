import React from 'react';
import { client } from '../api/client.js';

export function FinanceWorkspace({ invoices, onReload, showToast, onOpenModal }) {
  const matchedCount = invoices.filter(i => i.matchStatus === 'MATCHED').length;
  const exceptionCount = invoices.filter(i => i.matchStatus !== 'MATCHED').length;
  const totalLiability = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);

  const inspectMatch = (inv) => {
    onOpenModal(
      `3-Way Match Audit: ${inv.invoiceNumber}`,
      <div>
        <div style={{ background: 'var(--slate-50)', padding: '12px', borderRadius: '8px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <strong>Invoice:</strong> {inv.invoiceNumber}<br />
            <strong>PO Ref:</strong> {inv.poId}<br />
            <strong>Supplier:</strong> {inv.supplierName}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`badge ${inv.matchStatus === 'MATCHED' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '12px' }}>
              {inv.matchStatus}
            </span><br />
            <strong>Total: ${inv.totalAmount?.toLocaleString()}</strong>
          </div>
        </div>

        {inv.discrepancies?.length > 0 ? (
          <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', padding: '12px', borderRadius: '8px', marginBottom: '14px' }}>
            <strong style={{ color: 'var(--danger)' }}>Deterministic Discrepancies Flagged:</strong>
            <ul style={{ margin: '6px 0 0 18px', fontSize: '12px', color: 'var(--danger)' }}>
              {inv.discrepancies.map((d, i) => <li key={i}>{d.detail}</li>)}
            </ul>
          </div>
        ) : (
          <div style={{ background: 'var(--success-light)', border: '1px solid var(--success-border)', padding: '12px', borderRadius: '8px', marginBottom: '14px', color: 'var(--success)' }}>
            ✓ All lines matched within 1.0% price tolerance and 0.0% quantity tolerance.
          </div>
        )}

        <h4>Invoice Line Items & Rates</h4>
        <table className="data-table">
          <thead>
            <tr><th>Line</th><th>SKU</th><th>Billed Qty</th><th>Unit Rate</th><th>Line Total</th></tr>
          </thead>
          <tbody>
            {(inv.lines || []).map((l, i) => (
              <tr key={i}>
                <td>Line {l.line}</td>
                <td>{l.sku}</td>
                <td>{l.qty}</td>
                <td>${l.unitPrice?.toLocaleString()}</td>
                <td>${l.lineTotal?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn btn-outline btn-sm" onClick={async () => {
          try {
            await client.reevaluateInvoice(inv.id);
            showToast('3-Way Match re-calculated against receiving records', 'success');
            onReload();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }}>🔄 Re-evaluate Match</button>

        {inv.matchStatus === 'MATCHED' && !inv.erpPosting?.posted && (
          <button className="btn btn-success btn-sm" onClick={async () => {
            try {
              const res = await client.postInvoiceToErp(inv.id);
              showToast(`AP Voucher ${res.invoice.erpPosting.voucherId} posted to SAP!`, 'success');
              onReload();
            } catch (err) {
              showToast(err.message, 'error');
            }
          }}>Post to ERP (Create Voucher)</button>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Invoices Ingested</div>
          <div className="stat-value">{invoices.length}</div>
          <div className="stat-desc">OCR & e-invoicing intake</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Perfect 3-Way Match</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{matchedCount}</div>
          <div className="stat-desc">Approved for ERP disbursement</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Exception Holds</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{exceptionCount}</div>
          <div className="stat-desc">Tolerances exceeded / missing GRN</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total AP Liability</div>
          <div className="stat-value">${(totalLiability / 1000).toFixed(1)}k</div>
          <div className="stat-desc">Invoiced commitments</div>
        </div>
      </div>

      <div className="workspace-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Invoice Processing & 3-Way Reconciliation</h2>
            <p className="section-desc">Automated matching between PO commitment, Goods Receipt acceptance, and Invoiced rates.</p>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
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
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td>
                    <strong>{inv.invoiceNumber}</strong><br />
                    <small style={{ color: 'var(--slate-500)' }}>{inv.invoiceDate} (Due: {inv.dueDate})</small>
                  </td>
                  <td><strong>{inv.poId}</strong></td>
                  <td>{inv.supplierName}</td>
                  <td><strong>${inv.totalAmount?.toLocaleString()}</strong> {inv.currency}</td>
                  <td>
                    <span className={`badge ${inv.matchStatus === 'MATCHED' ? 'badge-success' : inv.matchStatus === 'MISSING_RECEIPT' ? 'badge-info' : 'badge-danger'}`}>
                      {inv.matchStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${inv.paymentStatus === 'Scheduled' ? 'badge-success' : inv.paymentStatus === 'Disputed' ? 'badge-danger' : 'badge-warning'}`}>
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td>
                    {inv.erpPosting?.posted ? (
                      <span className="badge badge-success">✓ {inv.erpPosting.voucherId}</span>
                    ) : (
                      <span className="badge badge-neutral">Not Posted</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => inspectMatch(inv)}>
                      🔍 Match Audit
                    </button>
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

