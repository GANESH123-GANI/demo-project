/**
 * ProcureFlow API Client
 */

export const api = {
  async get(url) {
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  async post(url, data = {}) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  getSystem: () => api.get('/api/system'),
  getSuppliers: (query = '') => api.get(`/api/suppliers${query}`),
  updateSupplierStage: (id, stage) => api.post(`/api/suppliers/${id}/stage`, { stage }),
  verifySupplierBank: (id) => api.post(`/api/suppliers/${id}/verify-bank`, {}),
  
  getCatalogs: () => api.get('/api/catalogs'),
  getRequisitions: () => api.get('/api/requisitions'),
  createRequisition: (data) => api.post('/api/requisitions', data),
  approveRequisition: (id) => api.post(`/api/requisitions/${id}/approve`, {}),
  convertPrToPo: (id) => api.post(`/api/requisitions/${id}/convert-to-po`, {}),
  
  getSourcing: () => api.get('/api/sourcing'),
  getAuctions: () => api.get('/api/auctions'),
  submitBid: (auctionId, bidderId, amount) => api.post(`/api/auctions/${auctionId}/bid`, { bidderId, amount }),
  
  getContracts: () => api.get('/api/contracts'),
  getPurchaseOrders: () => api.get('/api/purchase-orders'),
  getReceipts: () => api.get('/api/receipts'),
  createReceipt: (data) => api.post('/api/receipts', data),
  
  getInvoices: () => api.get('/api/invoices'),
  createInvoice: (data) => api.post('/api/invoices', data),
  reevaluateInvoice: (id) => api.post(`/api/invoices/${id}/reevaluate`, {}),
  postToErp: (id) => api.post(`/api/invoices/${id}/post-erp`, {}),
  
  getAnalytics: () => api.get('/api/analytics'),
  getAuditLogs: (limit = 50) => api.get(`/api/audit-logs?limit=${limit}`),
  
  askAi: (prompt, mode = 'general') => api.post('/api/ai/copilot', { prompt, mode })
};

