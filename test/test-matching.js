import test from 'node:test';
import assert from 'node:assert/strict';
import { execute3WayMatch } from '../src/utils/matching-engine.js';

test('3-Way Matching Engine Tests', async (t) => {
  const samplePo = {
    id: 'PO-TEST-1',
    supplierId: 'SUP-101',
    currency: 'USD',
    lines: [
      { line: 1, sku: 'TEST-SKU-1', unitPrice: 100.00, orderedQty: 10 }
    ]
  };

  await t.test('Case 1: Perfect 3-Way Match (Same Price & Accepted Qty)', () => {
    const receipts = [
      {
        poId: 'PO-TEST-1',
        lines: [{ poLine: 1, deliveredQty: 10, acceptedQty: 10, rejectedQty: 0 }]
      }
    ];

    const invoice = {
      poId: 'PO-TEST-1',
      supplierId: 'SUP-101',
      currency: 'USD',
      lines: [{ line: 1, poLine: 1, sku: 'TEST-SKU-1', qty: 10, unitPrice: 100.00 }]
    };

    const result = execute3WayMatch(invoice, samplePo, receipts);
    assert.equal(result.matchStatus, 'MATCHED');
    assert.equal(result.approvedForPayment, true);
    assert.equal(result.discrepancies.length, 0);
  });

  await t.test('Case 2: Quantity Discrepancy (Invoiced Qty > Accepted Qty)', () => {
    const receipts = [
      {
        poId: 'PO-TEST-1',
        lines: [{ poLine: 1, deliveredQty: 10, acceptedQty: 8, rejectedQty: 2 }]
      }
    ];

    const invoice = {
      poId: 'PO-TEST-1',
      supplierId: 'SUP-101',
      currency: 'USD',
      lines: [{ line: 1, poLine: 1, sku: 'TEST-SKU-1', qty: 10, unitPrice: 100.00 }]
    };

    const result = execute3WayMatch(invoice, samplePo, receipts);
    assert.equal(result.matchStatus, 'QUANTITY_MISMATCH');
    assert.equal(result.approvedForPayment, false);
    assert.ok(result.discrepancies.some(d => d.code === 'QTY_EXCEEDS_ACCEPTED'));
  });

  await t.test('Case 3: Price Variance Exceeding 1% Tolerance', () => {
    const receipts = [
      {
        poId: 'PO-TEST-1',
        lines: [{ poLine: 1, deliveredQty: 10, acceptedQty: 10, rejectedQty: 0 }]
      }
    ];

    const invoice = {
      poId: 'PO-TEST-1',
      supplierId: 'SUP-101',
      currency: 'USD',
      lines: [{ line: 1, poLine: 1, sku: 'TEST-SKU-1', qty: 10, unitPrice: 108.00 }] // +8%
    };

    const result = execute3WayMatch(invoice, samplePo, receipts);
    assert.equal(result.matchStatus, 'PRICE_VARIANCE');
    assert.equal(result.approvedForPayment, false);
    assert.ok(result.discrepancies.some(d => d.code === 'PRICE_VARIANCE'));
  });

  await t.test('Case 4: Missing Goods Receipt / SES', () => {
    const receipts = []; // No receipts recorded

    const invoice = {
      poId: 'PO-TEST-1',
      supplierId: 'SUP-101',
      currency: 'USD',
      lines: [{ line: 1, poLine: 1, sku: 'TEST-SKU-1', qty: 10, unitPrice: 100.00 }]
    };

    const result = execute3WayMatch(invoice, samplePo, receipts);
    assert.equal(result.matchStatus, 'MISSING_RECEIPT');
    assert.equal(result.approvedForPayment, false);
    assert.ok(result.discrepancies.some(d => d.code === 'MISSING_RECEIPT'));
  });
});

