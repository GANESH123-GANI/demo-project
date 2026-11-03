import React, { useState } from 'react';
import { client } from '../api/client.js';

export function ProcurementWorkspace({ requisitions, catalogs, orders, auctions, onReload, showToast, onOpenModal }) {
  const [activeTab, setActiveTab] = useState('requisitions');
  const auction = auctions?.[0];

  const handleApprovePr = async (id) => {
    try {
      await client.approveRequisition(id);
      showToast(`Requisition ${id} approved by Finance Controller`, 'success');
      onReload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleConvertPo = async (id) => {
    try {
      const res = await client.convertPrToPo(id);
      showToast(`Purchase Order ${res.purchaseOrder.id} generated!`, 'success');
      onReload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openNewPrModal = () => {
    onOpenModal(
      'Create New Purchase Requisition',
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="form-group">
          <label className="form-label">Requisition Title</label>
          <input type="text" id="new-pr-title" className="form-control" placeholder="e.g. Server Racks Refresh" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div className="form-group">
            <label className="form-label">Requisition Type</label>
            <select id="new-pr-type" className="form-control">
              <option value="Goods">Goods</option>
              <option value="Capital Expenditure">Capital Expenditure (Capex)</option>
              <option value="Service">Professional Service</option>
              <option value="Operating Expenditure">Operating Expenditure (Opex)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Budget Center Allocation</label>
            <input type="text" id="new-pr-budget" className="form-control" defaultValue="CAPEX-IT-2026-08" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Pre-Negotiated Master Catalog Item</label>
          <select id="new-pr-catalog" className="form-control">
            {catalogs.map(c => (
              <option key={c.id} value={c.id} data-price={c.unitPrice} data-desc={c.name} data-sku={c.sku}>
                {c.name} - ${c.unitPrice?.toLocaleString()} ({c.supplierName})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Quantity</label>
          <input type="number" id="new-pr-qty" className="form-control" defaultValue="5" min="1" />
        </div>
      </div>,
      <button className="btn btn-primary btn-sm" onClick={async () => {
        const title = document.getElementById('new-pr-title').value || 'Requisition Order';
        const type = document.getElementById('new-pr-type').value;
        const budgetCode = document.getElementById('new-pr-budget').value;
        const catSelect = document.getElementById('new-pr-catalog');
        const opt = catSelect.options[catSelect.selectedIndex];
        const qty = Number(document.getElementById('new-pr-qty').value) || 1;
        const unitPrice = Number(opt.dataset.price) || 1000;
        const total = qty * unitPrice;

        try {
          const res = await client.createRequisition({
            title,
            type,
            channel: 'Catalog',
            budgetCode,
            totalAmount: total,
            items: [{ line: 1, sku: opt.dataset.sku, description: opt.dataset.desc, qty, unitPrice, total }]
          });
          showToast(`Requisition ${res.requisition.id} submitted for approval`, 'success');
          onReload();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }}>Submit Requisition</button>
    );
  };

  const openReceiptModal = (po) => {
    onOpenModal(
      `Warehouse Goods Receipt (GRN): ${po.id}`,
      <div>
        <p style={{ marginBottom: '10px' }}>Record dock acceptance for <strong>{po.supplierName}</strong>:</p>
        <table className="data-table">
          <thead>
            <tr><th>Line</th><th>Description</th><th>Ordered</th><th>Received</th><th>Accept Now</th></tr>
          </thead>
          <tbody>
            {po.lines.map(l => (
              <tr key={l.line}>
                <td>Line {l.line}</td>
                <td>{l.description}</td>
                <td>{l.orderedQty}</td>
                <td>{l.receivedQty || 0}</td>
                <td>
                  <input type="number" className="form-control grn-input" data-line={l.line}
                    defaultValue={Math.max(0, l.orderedQty - (l.receivedQty || 0))}
                    style={{ width: '80px' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="form-group" style={{ marginTop: '14px' }}>
          <label className="form-label">Quality Inspection Result</label>
          <select id="grn-inspection-select" className="form-control">
            <option value="Pass">Pass - Fully verified against specifications</option>
            <option value="PartialPass">Partial Pass - Transit defect rejected</option>
          </select>
        </div>
      </div>,
      <button className="btn btn-primary btn-sm" onClick={async () => {
        const lines = [];
        document.querySelectorAll('.grn-input').forEach(input => {
          const lineNum = Number(input.dataset.line);
          const acceptedQty = Number(input.value);
          const poLine = po.lines.find(l => l.line === lineNum);
          lines.push({
            poLine: lineNum,
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
            inspectionResult: document.getElementById('grn-inspection-select').value,
            lines
          });
          showToast(`Goods Receipt (GRN) created for ${po.id}! Accepted for 3-way match.`, 'success');
          onReload();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }}>Confirm & Post Receipt</button>
    );
  };

  const openAuctionConsole = () => {
    if (!auction) return;
    onOpenModal(
      `Live Reverse Auction Console: ${auction.id}`,
      <div>
        <div style={{ background: 'var(--slate-900)', color: '#fff', padding: '16px', borderRadius: '8px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <span className="badge badge-success">LIVE EVENT</span>
              <h3 style={{ marginTop: '6px' }}>{auction.title}</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <small style={{ color: 'var(--slate-400)' }}>AUTHORITATIVE TIME</small>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#60a5fa' }}>COUNTDOWN ACTIVE</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
            <div><small>Reserve Price:</small><br /><strong>${auction.reservePrice?.toLocaleString()}</strong></div>
            <div><small>Current Winning Bid:</small><br /><strong style={{ color: '#34d399', fontSize: '16px' }}>${auction.currentLowBid?.toLocaleString()}</strong></div>
            <div><small>Min Decrement:</small><br /><strong>${auction.minDecrement?.toLocaleString()}</strong></div>
          </div>
        </div>

        <h4>Submit Competitive Bid</h4>
        <div style={{ display: 'flex', gap: '8px', margin: '10px 0 16px' }}>
          <select id="auction-bidder-select" className="form-control" style={{ width: '220px' }}>
            <option value="SUP-102">Apex Cloud & IT Solutions</option>
            <option value="SUP-101">Global Industrial Supply</option>
            <option value="SUP-103">Nova Precision Engineering</option>
          </select>
          <input type="number" id="auction-bid-amount" className="form-control"
            defaultValue={auction.currentLowBid - auction.minDecrement}
            max={auction.currentLowBid - auction.minDecrement}
            step={auction.minDecrement} />
          <button className="btn btn-primary" onClick={async () => {
            const bidderId = document.getElementById('auction-bidder-select').value;
            const amount = Number(document.getElementById('auction-bid-amount').value);
            try {
              const res = await client.submitBid(auction.id, bidderId, amount);
              showToast(`Bid of $${amount.toLocaleString()} submitted! New Rank: #${res.new_bid.rank}`, 'success');
              onReload();
            } catch (err) {
              showToast(err.message, 'error');
            }
          }}>Submit Bid</button>
        </div>

        <h4>Authoritative Bidding Ledger</h4>
        <table className="data-table">
          <thead>
            <tr><th>Rank</th><th>Bidder</th><th>Amount</th><th>Timestamp</th></tr>
          </thead>
          <tbody>
            {(auction.bids || []).map((b, i) => (
              <tr key={i}>
                <td><span className={`badge ${b.rank === 1 ? 'badge-success' : 'badge-neutral'}`}>Rank #{b.rank}</span></td>
                <td><strong>{b.bidderName}</strong></td>
                <td><strong>${b.amount?.toLocaleString()}</strong></td>
                <td><small>{b.timestamp?.split('T')[1]?.replace('Z', '')}</small></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button className="btn btn-primary" onClick={openNewPrModal}>+ Create Requisition</button>
        <button className="btn btn-outline" onClick={openAuctionConsole}>⚡ Live Reverse Auction (AUC-501)</button>
      </div>

      {/* Requisitions */}
      <div className="workspace-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Purchase Requisitions (PR)</h2>
            <p className="section-desc">Budget validation, policy checks, multi-level approvals, and PO conversion.</p>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>PR Number / Title</th>
                <th>Requester / Dept</th>
                <th>Type / Channel</th>
                <th>Budget Allocation</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requisitions.map(r => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.id}</strong><br />
                    <span>{r.title}</span>
                  </td>
                  <td>{r.requester}<br /><small style={{ color: 'var(--slate-500)' }}>{r.department}</small></td>
                  <td>
                    <span className="badge badge-neutral">{r.type}</span>{' '}
                    <span className={`badge ${r.channel === 'Catalog' ? 'badge-info' : 'badge-neutral'}`}>{r.channel}</span>
                  </td>
                  <td><code>{r.budgetCode}</code></td>
                  <td><strong>${r.totalAmount?.toLocaleString()}</strong></td>
                  <td>
                    <span className={`badge ${r.status === 'ConvertedToPO' ? 'badge-success' : r.status === 'Approved' ? 'badge-info' : 'badge-warning'}`}>
                      {r.status}
                    </span>
                    {r.convertedPoId && <><br /><small>PO: <b>{r.convertedPoId}</b></small></>}
                  </td>
                  <td>
                    {r.status === 'PendingApproval' && (
                      <button className="btn btn-success btn-sm" onClick={() => handleApprovePr(r.id)}>Approve</button>
                    )}
                    {r.status === 'Approved' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleConvertPo(r.id)}>Generate PO</button>
                    )}
                    {r.status === 'ConvertedToPO' && <span style={{ color: 'var(--slate-400)', fontSize: '11px' }}>Converted</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Orders & Receipts */}
      <div className="workspace-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Purchase Orders & Receiving Commitments</h2>
            <p className="section-desc">Line-item commitments, fulfillment tracking, and Goods Receipt (GRN) acceptance.</p>
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Lines</th>
                <th>Order Date</th>
                <th>Status</th>
                <th>Commitment</th>
                <th>Receiving Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(po => (
                <tr key={po.id}>
                  <td><strong>{po.id}</strong></td>
                  <td>{po.supplierName}</td>
                  <td>{po.lines?.length} lines</td>
                  <td>{po.orderDate?.split('T')[0]}</td>
                  <td>
                    <span className={`badge ${po.status === 'Completed' ? 'badge-success' : po.status === 'PartiallyReceived' ? 'badge-warning' : 'badge-info'}`}>
                      {po.status}
                    </span>
                  </td>
                  <td><strong>${po.totalAmount?.toLocaleString()}</strong></td>
                  <td>
                    {po.status !== 'Completed' ? (
                      <button className="btn btn-outline btn-sm" onClick={() => openReceiptModal(po)}>
                        📦 Record Receipt (GRN)
                      </button>
                    ) : (
                      <span className="badge badge-success">✓ Fully Received</span>
                    )}
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

