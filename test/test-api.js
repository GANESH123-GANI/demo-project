import test from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../src/store.js';

test('Store & Business Lifecycle Tests', async (t) => {
  await t.test('Supplier Bank Verification and Activation Gate', () => {
    const unverified = store.getSupplierById('SUP-106');
    assert.ok(unverified);

    // Attempt activation without bank verification should fail
    assert.throws(() => {
      store.updateSupplierStage('SUP-106', 'Active', 'Admin');
    }, /Bank verification is incomplete/);

    // Verify bank first
    store.verifySupplierBank('SUP-106', 'Treasury Lead');
    const bankVerified = store.getSupplierById('SUP-106');
    assert.equal(bankVerified.bankVerified, true);

    // Now activation should succeed
    const activated = store.updateSupplierStage('SUP-106', 'Active', 'Admin');
    assert.equal(activated.stage, 'Active');
  });

  await t.test('Requisition to Purchase Order Lifecycle', () => {
    // 1. Create PR
    const pr = store.createRequisition({
      title: 'Test Engineering Monitors Refresh',
      totalAmount: 12500.00,
      currency: 'USD',
      items: [{ description: 'Dell 32 4K Monitor', qty: 25, unitPrice: 500.00, total: 12500.00 }]
    }, 'Alex Requester');

    assert.ok(pr.id.startsWith('PR-2026-'));
    assert.equal(pr.status, 'PendingApproval');

    // 2. Cannot convert unapproved PR
    assert.throws(() => {
      store.convertPrToPo(pr.id, 'Buyer');
    }, /must be approved/);

    // 3. Approve PR
    const approvedPr = store.approveRequisition(pr.id, 'Karen Wu (Controller)');
    assert.equal(approvedPr.status, 'Approved');

    // 4. Convert PR to PO
    const po = store.convertPrToPo(pr.id, 'Sarah Jenkins');
    assert.ok(po.id.startsWith('PO-'));
    assert.equal(po.totalAmount, 12500.00);
    assert.equal(pr.status, 'ConvertedToPO');
  });

  await t.test('Live Reverse Auction Bidding Rules', () => {
    const auction = store.getAuctionById('AUC-501');
    assert.ok(auction);
    const initialLow = auction.currentLowBid;

    // Higher bid should be rejected
    assert.throws(() => {
      store.submitAuctionBid('AUC-501', 'SUP-102', initialLow + 5000);
    }, /not lower/);

    // Valid lower bid
    const validBidAmount = initialLow - 2000;
    const res = store.submitAuctionBid('AUC-501', 'SUP-102', validBidAmount, 'Apex Bidder');
    assert.equal(res.auction.currentLowBid, validBidAmount);
    assert.equal(res.newBid.rank, 1);
  });

  await t.test('ERP AP Voucher Posting Gate', () => {
    // INV-801 is ApprovedForPayment
    const invoice = store.postToErp('INV-801', 'AP Lead');
    assert.equal(invoice.erpPosting.posted, true);
    assert.ok(invoice.erpPosting.voucherId.startsWith('SAP-AP-2026-'));

    // INV-802 is UnderExceptionReview -> should throw error
    assert.throws(() => {
      store.postToErp('INV-802', 'AP Lead');
    }, /Must be in ApprovedForPayment status/);
  });
});

