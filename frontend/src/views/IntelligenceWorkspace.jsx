import React from 'react';

export function IntelligenceWorkspace({ analytics }) {
  const a = analytics || {};

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Annual Spend</div>
          <div className="stat-value">${((a.totalAnnualSpend || 0) / 1000000).toFixed(2)}M</div>
          <div className="stat-desc">Unified cross-entity spend</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Contract Coverage</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{a.contractCoveragePct}%</div>
          <div className="stat-desc">Spend on active agreements</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Maverick (Off-Contract)</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>${((a.maverickSpendAmount || 0) / 1000000).toFixed(2)}M</div>
          <div className="stat-desc">Target for consolidation</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Realized Savings YTD</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>${((a.realizedSavingsYTD || 0) / 1000000).toFixed(2)}M</div>
          <div className="stat-desc">Audited financial impact</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Spend by Category */}
        <div className="workspace-section">
          <div className="section-header">
            <h3 className="section-title">Spend by Category (UNSPSC Taxonomy)</h3>
          </div>
          <div style={{ padding: '16px' }}>
            {(a.spendByCategory || []).map((cat, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span><strong>{cat.category}</strong></span>
                  <span>${(cat.amount / 1000000).toFixed(2)}M ({cat.share}%)</span>
                </div>
                <div style={{ height: '8px', background: 'var(--slate-200)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cat.share}%`, background: 'var(--primary)' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Savings Pipeline */}
        <div className="workspace-section">
          <div className="section-header">
            <h3 className="section-title">Procurement Savings Pipeline</h3>
          </div>
          <div style={{ padding: '16px' }}>
            {(a.savingsPipeline || []).map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--slate-200)' }}>
                <div>
                  <strong>{p.stage}</strong><br />
                  <small style={{ color: 'var(--slate-500)' }}>{p.count} strategic projects</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: 'var(--success)' }}>${(p.value / 1000000).toFixed(2)}M</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

