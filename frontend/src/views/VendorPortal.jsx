import React, { useState } from 'react';

export function VendorPortal({ suppliers, orders, invoices }) {
  const [vendorId, setVendorId] = useState(suppliers[0]?.id || 'SUP-101');
  const currentSupplier = suppliers.find(s => s.id === vendorId) || suppliers[0];

  const vendorPos = orders.filter(p => p.supplierId === currentSupplier?.id);
  const vendorInvoices = invoices.filter(i => i.supplierId === currentSupplier?.id);

  return (
    <div>
      <div style={{ background: 'var(--slate-900)', color: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span className="badge badge-info" style={{ marginBottom: '4px' }}>VENDOR PORTAL CONSOLE</span>
          <h3>{currentSupplier?.name} ({currentSupplier?.code})</h3>
          <p style={{ fontSize: '12px', color: 'var(--slate-400)', marginTop: '2px' }}>
            Isolated external counterparty session • Payment Terms: {currentSupplier?.paymentTerms}
          </p>
        </div>
        <div>
          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--slate-400)', display: 'block', marginBottom: '4px' }}>Switch Vendor View:</label>
          <select className="form-control" value={vendorId} onChange={(e) => setVendorId(e.target.value)} style={{ width: '260px' }}>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="workspace-section">
        <div className="section-header">
          <h3 className="section-title">Purchase Orders Acknowledged & In Fulfillment</h3>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>PO Number</th><th>Order Date</th><th>Status</th><th>Lines</th><th>Total Amount</th><th>Acknowledgement</th></tr>
            </thead>
            <tbody>
              {vendorPos.length === 0 ? (
                <tr><td colSpan="6">No purchase orders assigned to this vendor.</td></tr>
              ) : (
                vendorPos.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.id}</strong></td>
                    <td>{p.orderDate?.split('T')[0]}</td>
                    <td><span className="badge badge-info">{p.status}</span></td>
                    <td>{p.lines?.length} lines</td>
                    <td><strong>${p.totalAmount?.toLocaleString()}</strong></td>
                    <td><span className="badge badge-success">✓ {p.supplierAcknowledgement}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="workspace-section">
        <div className="section-header">
          <h3 className="section-title">Submitted Invoices & Real-Time Payment Status</h3>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Invoice #</th><th>Date</th><th>Due Date</th><th>Amount</th><th>Validation Status</th><th>Payment Remittance</th></tr>
            </thead>
            <tbody>
              {vendorInvoices.length === 0 ? (
                <tr><td colSpan="6">No invoices submitted.</td></tr>
              ) : (
                vendorInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td><strong>{inv.invoiceNumber}</strong></td>
                    <td>{inv.invoiceDate}</td>
                    <td>{inv.dueDate}</td>
                    <td><strong>${inv.totalAmount?.toLocaleString()}</strong></td>
                    <td>
                      <span className={`badge ${inv.matchStatus === 'MATCHED' ? 'badge-success' : 'badge-warning'}`}>
                        {inv.matchStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${inv.paymentStatus === 'Scheduled' ? 'badge-success' : inv.paymentStatus === 'Disputed' ? 'badge-danger' : 'badge-neutral'}`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

