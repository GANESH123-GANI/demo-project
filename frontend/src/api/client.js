/**
 * ProcureFlow Enterprise S2P - API Client (React)
 */
const API_BASE = '/api';

export const client = {
  async get(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async post(endpoint, body = {}) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  getSystem: () => client.get('/system'),
  getSuppliers: (query = '') => client.get(`/suppliers${query}`),
  updateSupplierStage: (id, stage) => client.post(`/suppliers/${id}/stage`, { stage }),
  verifySupplierBank: (id) => client.post(`/suppliers/${id}/verify-bank`, {}),

  getCatalogs: () => client.get('/catalogs'),
  getRequisitions: () => client.get('/requisitions'),
  createRequisition: (data) => client.post('/requisitions', data),
  approveRequisition: (id) => client.post(`/requisitions/${id}/approve`, {}),
  convertPrToPo: (id) => client.post(`/requisitions/${id}/convert-to-po`, {}),

  getOrders: () => client.get('/purchase-orders'),
  getReceipts: () => client.get('/receipts'),
  createReceipt: (data) => client.post('/receipts', data),

  getInvoices: () => client.get('/invoices'),
  createInvoice: (data) => client.post('/invoices', data),
  reevaluateInvoice: (id) => client.post(`/invoices/${id}/reevaluate`, {}),
  postInvoiceToErp: (id) => client.post(`/invoices/${id}/post-erp`, {}),

  getSourcing: () => client.get('/sourcing'),
  getClauses: () => client.get('/clauses'),
  getDocuments: () => client.get('/documents'),
  getRbac: () => client.get('/rbac'),

  getAuctions: () => client.get('/auctions'),
  submitBid: (auctionId, bidderId, amount) => client.post(`/auctions/${auctionId}/bid`, { bidderId, amount }),

  getContracts: () => client.get('/contracts'),
  getAnalytics: () => client.get('/analytics'),
  getAuditLogs: (limit = 50) => client.get(`/audit-logs?limit=${limit}`),

  askAi: (prompt, mode = 'general') => client.post('/ai/copilot', { prompt, mode })
};

