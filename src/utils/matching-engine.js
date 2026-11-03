/**
 * Deterministic 3-Way Matching Engine
 * Compares Purchase Orders (Commitment), Goods Receipts / SES (Accepted Delivery), and Invoices (Liability)
 */

export const DEFAULT_TOLERANCES = {
  priceVariancePct: 1.0, // Maximum allowed unit price variance percentage (e.g. 1.0%)
  quantityVariancePct: 0.0, // Invoiced qty cannot exceed accepted qty
  taxVarianceAmount: 5.00 // Maximum rounding variance on total tax
};

/**
 * Runs deterministic 3-way match
 * @param {Object} invoice
 * @param {Object} po
 * @param {Array} receipts
 * @param {Object} tolerances
 * @returns {Object} matchResult
 */
export function execute3WayMatch(invoice, po, receipts = [], tolerances = DEFAULT_TOLERANCES) {
  const discrepancies = [];
  const lineMatches = [];

  if (!po) {
    return {
      matchStatus: 'PO_NOT_FOUND',
      approvedForPayment: false,
      discrepancies: [{ code: 'PO_NOT_FOUND', detail: `Referenced PO ${invoice.poId} could not be located.` }],
      lineMatches: []
    };
  }

  // 1. Header validations
  if (invoice.supplierId !== po.supplierId) {
    discrepancies.push({
      code: 'SUPPLIER_MISMATCH',
      detail: `Invoice supplier (${invoice.supplierId}) does not match PO supplier (${po.supplierId}).`
    });
  }

  if (invoice.currency !== po.currency) {
    discrepancies.push({
      code: 'CURRENCY_MISMATCH',
      detail: `Invoice currency (${invoice.currency}) does not match PO currency (${po.currency}).`
    });
  }

  // 2. Line-item matching
  const poLinesMap = new Map();
  for (const pol of (po.lines || [])) {
    poLinesMap.set(pol.line, pol);
  }

  // Find relevant receipts for this PO
  const poReceipts = receipts.filter(r => r.poId === po.id);

  if (poReceipts.length === 0) {
    discrepancies.push({
      code: 'MISSING_RECEIPT',
      detail: `No Goods Receipts (GRN) or Service Entry Sheets (SES) recorded for ${po.id}.`
    });
  }

  for (const invLine of (invoice.lines || [])) {
    const poLine = poLinesMap.get(invLine.poLine);

    if (!poLine) {
      discrepancies.push({
        code: 'UNMATCHED_PO_LINE',
        line: invLine.line,
        detail: `Invoice line ${invLine.line} references PO line ${invLine.poLine} which does not exist.`
      });
      continue;
    }

    // A. Price Variance Check
    const poUnitPrice = Number(poLine.unitPrice);
    const invUnitPrice = Number(invLine.unitPrice);
    const priceDiff = invUnitPrice - poUnitPrice;
    const priceVariancePct = poUnitPrice > 0 ? (priceDiff / poUnitPrice) * 100 : 0;

    const priceWithinTolerance = priceVariancePct <= tolerances.priceVariancePct && priceVariancePct >= -tolerances.priceVariancePct;

    if (!priceWithinTolerance) {
      discrepancies.push({
        code: 'PRICE_VARIANCE',
        line: invLine.line,
        poLine: poLine.line,
        sku: invLine.sku || poLine.sku,
        detail: `Unit price ${invUnitPrice.toFixed(2)} exceeds PO contracted price ${poUnitPrice.toFixed(2)} by ${priceVariancePct.toFixed(2)}% (Tolerance: ±${tolerances.priceVariancePct}%).`
      });
    }

    // B. Accepted Quantity Check across all receipts
    let totalAcceptedQty = 0;
    let totalDeliveredQty = 0;
    let totalRejectedQty = 0;

    for (const receipt of poReceipts) {
      const matchReceiptLine = (receipt.lines || []).find(rl => rl.poLine === poLine.line);
      if (matchReceiptLine) {
        totalAcceptedQty += Number(matchReceiptLine.acceptedQty || 0);
        totalDeliveredQty += Number(matchReceiptLine.deliveredQty || 0);
        totalRejectedQty += Number(matchReceiptLine.rejectedQty || 0);
      }
    }

    const invoicedQty = Number(invLine.qty);
    const isQtyExceeded = invoicedQty > totalAcceptedQty;

    if (poReceipts.length > 0 && isQtyExceeded) {
      discrepancies.push({
        code: 'QTY_EXCEEDS_ACCEPTED',
        line: invLine.line,
        poLine: poLine.line,
        sku: invLine.sku || poLine.sku,
        detail: `Invoiced quantity (${invoicedQty}) exceeds total accepted quantity (${totalAcceptedQty}). Delivered: ${totalDeliveredQty}, Rejected: ${totalRejectedQty}.`
      });
    }

    lineMatches.push({
      line: invLine.line,
      poLine: poLine.line,
      sku: invLine.sku,
      poUnitPrice,
      invUnitPrice,
      priceVariancePct: Number(priceVariancePct.toFixed(2)),
      invoicedQty,
      totalAcceptedQty,
      priceMatch: priceWithinTolerance,
      qtyMatch: !isQtyExceeded && poReceipts.length > 0
    });
  }

  // 3. Determine Overall Status
  let matchStatus = 'MATCHED';
  if (discrepancies.some(d => d.code === 'MISSING_RECEIPT')) {
    matchStatus = 'MISSING_RECEIPT';
  } else if (discrepancies.some(d => d.code === 'QTY_EXCEEDS_ACCEPTED')) {
    matchStatus = 'QUANTITY_MISMATCH';
  } else if (discrepancies.some(d => d.code === 'PRICE_VARIANCE')) {
    matchStatus = 'PRICE_VARIANCE';
  } else if (discrepancies.length > 0) {
    matchStatus = 'DISCREPANCIES_FLAGGED';
  }

  const approvedForPayment = matchStatus === 'MATCHED' && discrepancies.length === 0;

  let recommendedAction = 'Ready for automated ERP Accounts Payable voucher creation and scheduled payment.';
  if (matchStatus === 'MISSING_RECEIPT') {
    recommendedAction = 'Hold payment. Notify warehouse dock / service requester to submit Goods Receipt (GRN) or Service Entry Sheet (SES).';
  } else if (matchStatus === 'QUANTITY_MISMATCH') {
    recommendedAction = 'Hold payment. Request credit note from vendor for rejected/undelivered units, or post partial invoice matching accepted quantities.';
  } else if (matchStatus === 'PRICE_VARIANCE') {
    recommendedAction = 'Route to procurement buyer and contract owner for approval of rate deviation, or reject invoice for credit re-issuance.';
  }

  return {
    matchStatus,
    approvedForPayment,
    discrepancies,
    lineMatches,
    recommendedAction,
    evaluatedAt: new Date().toISOString()
  };
}

