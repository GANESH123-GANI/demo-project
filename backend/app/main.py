"""
ProcureFlow Enterprise S2P - FastAPI Main Application
"""
import os
from typing import Dict, Any, Optional

try:
    from fastapi import FastAPI, HTTPException, Query, Body
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.staticfiles import StaticFiles
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False

from app.database import db
from app.services.ai_service import generate_ai_copilot_response

if FASTAPI_AVAILABLE:
    app = FastAPI(
        title="ProcureFlow Enterprise S2P API",
        version="1.0.0",
        description="RESTful API for Enterprise Source-to-Pay Platform"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/system")
    def get_system():
        return db.data.get("system", {})

    @app.get("/api/suppliers")
    def get_suppliers(stage: Optional[str] = None):
        suppliers = db.get_suppliers()
        if stage:
            suppliers = [s for s in suppliers if s.get("stage") == stage]
        return suppliers

    @app.post("/api/suppliers/{supplier_id}/stage")
    def update_supplier_stage(supplier_id: str, payload: Dict[str, Any] = Body(...)):
        try:
            res = db.update_supplier_stage(supplier_id, payload.get("stage"), payload.get("actor", "Admin"))
            return {"success": True, "supplier": res}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @app.post("/api/suppliers/{supplier_id}/verify-bank")
    def verify_supplier_bank(supplier_id: str, payload: Dict[str, Any] = Body(default={})):
        try:
            res = db.verify_supplier_bank(supplier_id, payload.get("actor", "Treasury Lead"))
            return {"success": True, "supplier": res}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @app.get("/api/catalogs")
    def get_catalogs():
        return db.get_catalogs()

    @app.get("/api/requisitions")
    def get_requisitions():
        return db.get_requisitions()

    @app.post("/api/requisitions")
    def create_requisition(payload: Dict[str, Any] = Body(...)):
        res = db.create_requisition(payload, payload.get("actor", "Requisitioner"))
        return {"success": True, "requisition": res}

    @app.post("/api/requisitions/{rid}/approve")
    def approve_requisition(rid: str, payload: Dict[str, Any] = Body(default={})):
        try:
            res = db.approve_requisition(rid, payload.get("actor", "Karen Wu (Controller)"))
            return {"success": True, "requisition": res}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @app.post("/api/requisitions/{rid}/convert-to-po")
    def convert_pr_to_po(rid: str, payload: Dict[str, Any] = Body(default={})):
        try:
            res = db.convert_pr_to_po(rid, payload.get("actor", "Sarah Jenkins (Buyer)"))
            return {"success": True, "purchaseOrder": res}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @app.get("/api/purchase-orders")
    def get_orders():
        return db.get_orders()

    @app.get("/api/receipts")
    def get_receipts():
        return db.get_receipts()

    @app.post("/api/receipts")
    def create_receipt(payload: Dict[str, Any] = Body(...)):
        try:
            res = db.create_receipt(payload, payload.get("actor", "Warehouse Lead"))
            return {"success": True, "receipt": res}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @app.get("/api/invoices")
    def get_invoices():
        return db.get_invoices()

    @app.post("/api/invoices/{inv_id}/reevaluate")
    def reevaluate_invoice(inv_id: str, payload: Dict[str, Any] = Body(default={})):
        try:
            res = db.reevaluate_invoice(inv_id, payload.get("actor", "AP Match Engine"))
            return {"success": True, **res}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @app.post("/api/invoices/{inv_id}/post-erp")
    def post_invoice_erp(inv_id: str, payload: Dict[str, Any] = Body(default={})):
        try:
            res = db.post_invoice_to_erp(inv_id, payload.get("actor", "Karen Wu (AP Lead)"))
            return {"success": True, "invoice": res}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @app.get("/api/auctions")
    def get_auctions():
        return db.get_auctions()

    @app.post("/api/auctions/{aid}/bid")
    def submit_bid(aid: str, payload: Dict[str, Any] = Body(...)):
        try:
            res = db.submit_auction_bid(aid, payload.get("bidderId"), payload.get("amount"), payload.get("actor"))
            return {"success": True, **res}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @app.get("/api/contracts")
    def get_contracts():
        return db.get_contracts()

    @app.get("/api/analytics")
    def get_analytics():
        return db.get_analytics()

    @app.get("/api/audit-logs")
    def get_audit_logs(limit: int = 50):
        return db.get_audit_logs(limit)

    @app.post("/api/ai/copilot")
    def ai_copilot(payload: Dict[str, Any] = Body(...)):
        res = generate_ai_copilot_response(payload.get("prompt", ""), payload.get("mode", "general"))
        return {"success": True, "response": res}
else:
    app = None

