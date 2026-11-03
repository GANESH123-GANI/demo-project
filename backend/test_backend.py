"""
ProcureFlow Python Backend Test Suite (unittest)
Tests 3-Way Matching, Auction Engine, Dual-Control Bank Verification, and ERP Gates
"""
import unittest
import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.database import db
from app.services.matching_engine import execute_3way_match
from app.services.auction_engine import process_auction_bid

class TestEnterpriseS2P(unittest.TestCase):

    def test_01_supplier_bank_verification_gate(self):
        """Supplier cannot be activated until Treasury dual-control bank verification is complete"""
        supplier = db.get_supplier_by_id("SUP-106")
        self.assertIsNotNone(supplier)

        # Attempting activation without bank verification must fail
        with self.assertRaises(ValueError) as ctx:
            db.update_supplier_stage("SUP-106", "Active", "Admin")
        self.assertIn("Bank verification is incomplete", str(ctx.exception))

        # Perform Treasury dual-control verification
        db.verify_supplier_bank("SUP-106", "Treasury Lead")
        updated_supplier = db.get_supplier_by_id("SUP-106")
        self.assertTrue(updated_supplier["bankVerified"])

        # Now activation succeeds
        activated = db.update_supplier_stage("SUP-106", "Active", "Admin")
        self.assertEqual(activated["stage"], "Active")

    def test_02_requisition_to_po_lifecycle(self):
        """PR budget check, approval flow, and conversion to PO"""
        pr_data = {
            "title": "Data Center Backup Batteries",
            "totalAmount": 15000.0,
            "currency": "USD",
            "items": [{"description": "UPS Industrial Battery Cell", "qty": 10, "unitPrice": 1500.0, "total": 15000.0}]
        }
        pr = db.create_requisition(pr_data, "Alex Lead")
        self.assertEqual(pr["status"], "PendingApproval")

        # Unapproved PR cannot be converted to PO
        with self.assertRaises(ValueError) as ctx:
            db.convert_pr_to_po(pr["id"], "Buyer")
        self.assertIn("must be in Approved status", str(ctx.exception))

        # Approve PR
        approved = db.approve_requisition(pr["id"], "Karen Controller")
        self.assertEqual(approved["status"], "Approved")

        # Convert to PO
        po = db.convert_pr_to_po(pr["id"], "Sarah Jenkins")
        self.assertEqual(po["totalAmount"], 15000.0)
        self.assertEqual(po["status"], "Dispatched")

    def test_03_deterministic_3way_matching(self):
        """Test exact match, price variance, and quantity discrepancy"""
        sample_po = {
            "id": "PO-TEST",
            "supplierId": "SUP-101",
            "currency": "USD",
            "lines": [{"line": 1, "sku": "ITEM-A", "unitPrice": 100.0, "orderedQty": 10}]
        }

        # Case A: Exact Match
        receipts = [{"poId": "PO-TEST", "lines": [{"poLine": 1, "acceptedQty": 10, "deliveredQty": 10, "rejectedQty": 0}]}]
        inv_exact = {"poId": "PO-TEST", "supplierId": "SUP-101", "currency": "USD", "lines": [{"line": 1, "poLine": 1, "sku": "ITEM-A", "qty": 10, "unitPrice": 100.0}]}
        res_exact = execute_3way_match(inv_exact, sample_po, receipts)
        self.assertEqual(res_exact["match_status"], "MATCHED")
        self.assertTrue(res_exact["approved_for_payment"])

        # Case B: Quantity Exceeded (10 billed vs 8 accepted)
        receipts_partial = [{"poId": "PO-TEST", "lines": [{"poLine": 1, "acceptedQty": 8, "deliveredQty": 10, "rejectedQty": 2}]}]
        res_qty = execute_3way_match(inv_exact, sample_po, receipts_partial)
        self.assertEqual(res_qty["match_status"], "QUANTITY_MISMATCH")
        self.assertFalse(res_qty["approved_for_payment"])

        # Case C: Price Variance (+8% exceeding 1% tolerance)
        inv_high_price = {"poId": "PO-TEST", "supplierId": "SUP-101", "currency": "USD", "lines": [{"line": 1, "poLine": 1, "sku": "ITEM-A", "qty": 10, "unitPrice": 108.0}]}
        res_price = execute_3way_match(inv_high_price, sample_po, receipts)
        self.assertEqual(res_price["match_status"], "PRICE_VARIANCE")
        self.assertFalse(res_price["approved_for_payment"])

    def test_04_live_auction_engine(self):
        """Bids must be strictly lower than current winning bid by at least minimum decrement"""
        auction = db.get_auction_by_id("AUC-501")
        initial_low = auction["currentLowBid"]

        # Higher bid rejected
        with self.assertRaises(ValueError):
            db.submit_auction_bid("AUC-501", "SUP-102", initial_low + 500)

        # Valid lower bid
        res = db.submit_auction_bid("AUC-501", "SUP-102", initial_low - 1500)
        self.assertEqual(res["auction"]["currentLowBid"], initial_low - 1500)
        self.assertEqual(res["new_bid"]["rank"], 1)

    def test_05_erp_posting_control_gate(self):
        """Only invoices in ApprovedForPayment status can generate an ERP AP Voucher"""
        inv_approved = db.post_invoice_to_erp("INV-801", "AP Clerk")
        self.assertTrue(inv_approved["erpPosting"]["posted"])

        # Unapproved invoice (INV-802 has quantity mismatch) must be rejected
        with self.assertRaises(ValueError) as ctx:
            db.post_invoice_to_erp("INV-802", "AP Clerk")
        self.assertIn("Status must be ApprovedForPayment", str(ctx.exception))

if __name__ == "__main__":
    unittest.main()

