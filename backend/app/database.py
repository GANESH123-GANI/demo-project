"""
Database & Transactional State Management (Python)
Backed by SQLite and seeded with full enterprise procurement records.
"""
import json
import os
import sqlite3
from typing import Dict, List, Any, Optional
from app.services.matching_engine import execute_3way_match
from app.services.audit_service import create_audit_record
from app.services.auction_engine import process_auction_bid

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SEED_FILE = os.path.join(BASE_DIR, "seed_data.json")
DB_FILE = os.path.join(BASE_DIR, "procureflow.db")

class Database:
    def __init__(self):
        self.data: Dict[str, Any] = {}
        self.load_seed()
        self.init_sqlite()

    def load_seed(self):
        try:
            with open(SEED_FILE, "r", encoding="utf-8") as f:
                self.data = json.load(f)
        except Exception as e:
            print(f"Warning loading seed file: {e}")
            self.data = {}

    def init_sqlite(self):
        try:
            conn = sqlite3.connect(DB_FILE)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT,
                    actor TEXT,
                    action TEXT,
                    target TEXT,
                    details TEXT,
                    hash TEXT,
                    verified INTEGER
                )
            """)
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"SQLite initialization note: {e}")

    def log_audit(self, actor: str, action: str, target: str, details: str) -> Dict[str, Any]:
        record = create_audit_record(actor, action, target, details)
        logs = self.data.setdefault("auditLogs", [])
        logs.insert(0, record)
        try:
            conn = sqlite3.connect(DB_FILE)
            cur = conn.cursor()
            cur.execute(
                "INSERT OR REPLACE INTO audit_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (record["id"], record["timestamp"], record["actor"], record["action"],
                 record["target"], record["details"], record["hash"], 1)
            )
            conn.commit()
            conn.close()
        except Exception:
            pass
        return record

    # Suppliers
    def get_suppliers(self) -> List[Dict[str, Any]]:
        return self.data.get("suppliers", [])

    def get_supplier_by_id(self, sid: str) -> Optional[Dict[str, Any]]:
        for s in self.get_suppliers():
            if s.get("id") == sid:
                return s
        return None

    def update_supplier_stage(self, sid: str, stage: str, actor: str = "Admin") -> Dict[str, Any]:
        s = self.get_supplier_by_id(sid)
        if not s:
            raise ValueError(f"Supplier {sid} not found")
        if stage == "Active" and not s.get("bankVerified"):
            raise ValueError(f"Cannot activate supplier {sid}: Bank verification is incomplete (Dual-control required).")
        old_stage = s.get("stage")
        s["stage"] = stage
        self.log_audit(actor, "SUPPLIER_STAGE_UPDATED", sid, f"Stage updated from {old_stage} to {stage}")
        return s

    def verify_supplier_bank(self, sid: str, actor: str = "Treasury Lead") -> Dict[str, Any]:
        s = self.get_supplier_by_id(sid)
        if not s:
            raise ValueError(f"Supplier {sid} not found")
        s["bankVerified"] = True
        s["riskScore"] = max(10, s.get("riskScore", 50) - 15)
        self.log_audit(actor, "SUPPLIER_BANK_VERIFIED", sid, "Bank routing numbers verified under dual-control authorization.")
        return s

    # Catalogs
    def get_catalogs(self) -> List[Dict[str, Any]]:
        return self.data.get("catalogs", [])

    # Requisitions
    def get_requisitions(self) -> List[Dict[str, Any]]:
        return self.data.get("requisitions", [])

    def get_requisition_by_id(self, rid: str) -> Optional[Dict[str, Any]]:
        for r in self.get_requisitions():
            if r.get("id") == rid:
                return r
        return None

    def create_requisition(self, req_data: Dict[str, Any], actor: str = "Requisitioner") -> Dict[str, Any]:
        count = len(self.get_requisitions()) + 1
        new_id = f"PR-2026-{str(count).zfill(3)}"
        total_amount = float(req_data.get("totalAmount", 0))

        new_pr = {
            "id": new_id,
            "title": req_data.get("title", "New Requisition"),
            "requester": req_data.get("requester", actor),
            "department": req_data.get("department", "Procurement Operations"),
            "type": req_data.get("type", "Goods"),
            "channel": req_data.get("channel", "Catalog"),
            "budgetCode": req_data.get("budgetCode", "OPEX-GEN-2026"),
            "allocatedBudget": total_amount * 1.25,
            "totalAmount": total_amount,
            "currency": req_data.get("currency", "USD"),
            "status": "PendingApproval",
            "convertedPoId": None,
            "items": req_data.get("items", [])
        }
        self.data.setdefault("requisitions", []).insert(0, new_pr)
        self.log_audit(actor, "PR_CREATED", new_id, f"Requisition created for ${total_amount:,.2f} against budget {new_pr['budgetCode']}")
        return new_pr

    def approve_requisition(self, rid: str, actor: str = "Karen Wu (Finance Controller)") -> Dict[str, Any]:
        pr = self.get_requisition_by_id(rid)
        if not pr:
            raise ValueError(f"Requisition {rid} not found")
        pr["status"] = "Approved"
        self.log_audit(actor, "PR_APPROVED", rid, "Requisition approved and budget reserved.")
        return pr

    def convert_pr_to_po(self, rid: str, actor: str = "Sarah Jenkins (Buyer)") -> Dict[str, Any]:
        pr = self.get_requisition_by_id(rid)
        if not pr:
            raise ValueError(f"Requisition {rid} not found")
        if pr.get("status") != "Approved":
            raise ValueError(f"Requisition {rid} must be in Approved status to convert to PO.")

        po_count = len(self.get_orders()) + 1
        po_id = f"PO-{3000 + po_count}"
        supplier = next((s for s in self.get_suppliers() if s.get("stage") == "Active"), self.get_suppliers()[0])

        new_po = {
            "id": po_id,
            "requisitionId": pr["id"],
            "supplierId": supplier["id"],
            "supplierName": supplier["name"],
            "orderDate": "2026-11-02T21:00:00Z",
            "status": "Dispatched",
            "supplierAcknowledgement": "Accepted",
            "totalAmount": pr["totalAmount"],
            "currency": pr["currency"],
            "lines": [
                {
                    "line": idx + 1,
                    "sku": item.get("sku", f"SKU-{idx+1}"),
                    "description": item.get("description", "Purchased item"),
                    "orderedQty": item.get("qty", 1),
                    "receivedQty": 0,
                    "invoicedQty": 0,
                    "unitPrice": item.get("unitPrice", 0),
                    "lineTotal": item.get("total", 0)
                } for idx, item in enumerate(pr.get("items", []))
            ]
        }

        self.data.setdefault("purchaseOrders", []).insert(0, new_po)
        pr["status"] = "ConvertedToPO"
        pr["convertedPoId"] = po_id
        self.log_audit(actor, "PO_GENERATED", po_id, f"Purchase order generated from {rid} for supplier {supplier['name']}")
        return new_po

    # Orders & Receipts
    def get_orders(self) -> List[Dict[str, Any]]:
        return self.data.get("purchaseOrders", [])

    def get_order_by_id(self, poid: str) -> Optional[Dict[str, Any]]:
        for po in self.get_orders():
            if po.get("id") == poid:
                return po
        return None

    def get_receipts(self) -> List[Dict[str, Any]]:
        return self.data.get("receipts", [])

    def create_receipt(self, receipt_data: Dict[str, Any], actor: str = "Warehouse Lead") -> Dict[str, Any]:
        po_id = receipt_data.get("poId")
        po = self.get_order_by_id(po_id)
        if not po:
            raise ValueError(f"Purchase order {po_id} not found")

        r_type = receipt_data.get("type", "GoodsReceipt")
        count = len(self.get_receipts()) + 1
        prefix = "SES" if r_type == "ServiceEntrySheet" else "GRN"
        new_id = f"{prefix}-70{count}"

        new_receipt = {
            "id": new_id,
            "type": r_type,
            "poId": po_id,
            "supplierId": po.get("supplierId"),
            "receiptDate": "2026-11-02T21:00:00Z",
            "inspectionResult": receipt_data.get("inspectionResult", "Pass"),
            "status": "Accepted",
            "lines": receipt_data.get("lines", [])
        }

        # Update PO received quantities
        for r_line in new_receipt["lines"]:
            for po_line in po.get("lines", []):
                if po_line.get("line") == r_line.get("poLine"):
                    po_line["receivedQty"] = min(
                        po_line.get("orderedQty", 0),
                        po_line.get("receivedQty", 0) + int(r_line.get("acceptedQty", 0))
                    )

        if all(l.get("receivedQty", 0) >= l.get("orderedQty", 0) for l in po.get("lines", [])):
            po["status"] = "Completed"
        else:
            po["status"] = "PartiallyReceived"

        self.data.setdefault("receipts", []).insert(0, new_receipt)
        self.log_audit(actor, "RECEIPT_POSTED", new_id, f"{r_type} posted for {po_id}. Inspection: {new_receipt['inspectionResult']}")
        return new_receipt

    # Invoices & 3-Way Matching
    def get_invoices(self) -> List[Dict[str, Any]]:
        return self.data.get("invoices", [])

    def get_invoice_by_id(self, inv_id: str) -> Optional[Dict[str, Any]]:
        for i in self.get_invoices():
            if i.get("id") == inv_id:
                return i
        return None

    def post_invoice_to_erp(self, inv_id: str, actor: str = "Karen Wu (AP Lead)") -> Dict[str, Any]:
        inv = self.get_invoice_by_id(inv_id)
        if not inv:
            raise ValueError(f"Invoice {inv_id} not found")
        if inv.get("status") != "ApprovedForPayment":
            raise ValueError(f"Cannot post invoice {inv_id} to ERP: Status must be ApprovedForPayment (was {inv.get('status')}).")

        voucher_id = f"SAP-AP-2026-{1000 + len(self.get_invoices()) * 37}"
        inv["erpPosting"] = {"posted": True, "voucherId": voucher_id}
        inv["paymentStatus"] = "Scheduled"
        self.log_audit(actor, "ERP_VOUCHER_POSTED", inv_id, f"AP voucher created: {voucher_id} in SAP.")
        return inv

    def reevaluate_invoice(self, inv_id: str, actor: str = "AP Match Engine") -> Dict[str, Any]:
        inv = self.get_invoice_by_id(inv_id)
        if not inv:
            raise ValueError(f"Invoice {inv_id} not found")
        po = self.get_order_by_id(inv.get("poId"))
        match_result = execute_3way_match(inv, po, self.get_receipts())
        inv["matchStatus"] = match_result["match_status"]
        inv["discrepancies"] = match_result["discrepancies"]
        if match_result["approved_for_payment"]:
            inv["status"] = "ApprovedForPayment"
            inv["paymentStatus"] = "Scheduled"
        self.log_audit(actor, "3WAY_MATCH_REEVALUATED", inv_id, f"Evaluated status: {inv['matchStatus']}")
        return {"invoice": inv, "match_result": match_result}

    # Auctions
    def get_auctions(self) -> List[Dict[str, Any]]:
        return self.data.get("auctions", [])

    def get_auction_by_id(self, aid: str) -> Optional[Dict[str, Any]]:
        for a in self.get_auctions():
            if a.get("id") == aid:
                return a
        return None

    def submit_auction_bid(self, aid: str, bidder_id: str, amount: float, actor: str = None) -> Dict[str, Any]:
        auction = self.get_auction_by_id(aid)
        if not auction:
            raise ValueError(f"Auction {aid} not found")
        bidder = self.get_supplier_by_id(bidder_id)
        bidder_name = bidder["name"] if bidder else bidder_id
        result = process_auction_bid(auction, bidder_id, bidder_name, amount)
        self.log_audit(actor or bidder_name, "AUCTION_BID_SUBMITTED", aid, f"Bid received: ${amount:,.2f}")
        return result

    # Sourcing & RFx
    def get_sourcing_events(self) -> List[Dict[str, Any]]:
        return self.data.get("sourcingEvents", [])

    # Clause Library & Legal Playbooks
    def get_clause_library(self) -> List[Dict[str, Any]]:
        return self.data.get("clauseLibrary", [])

    # Knowledge & Document Repository (Module 11)
    def get_knowledge_repository(self) -> List[Dict[str, Any]]:
        return self.data.get("knowledgeRepository", [])

    # RBAC Matrix
    def get_rbac_matrix(self) -> List[Dict[str, Any]]:
        return self.data.get("rbacMatrix", [])

    # Contracts & Analytics
    def get_contracts(self) -> List[Dict[str, Any]]:
        return self.data.get("contracts", [])

    def get_analytics(self) -> Dict[str, Any]:
        return self.data.get("spendAnalytics", {})

    def get_audit_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.data.get("auditLogs", [])[:limit]

db = Database()

