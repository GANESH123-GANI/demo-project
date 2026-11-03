"""
Suppliers API Router
"""
from typing import Dict, Any, Optional
from app.database import db

def handle_get_suppliers(query: Dict[str, str] = None):
    suppliers = db.get_suppliers()
    if query and "stage" in query:
        suppliers = [s for s in suppliers if s.get("stage") == query["stage"]]
    return suppliers

def handle_update_stage(supplier_id: str, body: Dict[str, Any]):
    stage = body.get("stage", "")
    actor = body.get("actor", "Admin")
    return db.update_supplier_stage(supplier_id, stage, actor)

def handle_verify_bank(supplier_id: str, body: Dict[str, Any]):
    actor = body.get("actor", "Treasury Lead")
    return db.verify_supplier_bank(supplier_id, actor)

