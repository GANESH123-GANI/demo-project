"""
ProcureFlow Enterprise S2P - Universal Python Server
Runs natively with Python standard library http.server or launches FastAPI via Uvicorn.
Serves both REST API and React frontend on port 8000.
"""
import os
import sys
import json
import mimetypes
from typing import Any
from urllib.parse import urlparse, parse_qs
from http.server import HTTPServer, BaseHTTPRequestHandler

# Reconfigure stdout/stderr to UTF-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add app to path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.database import db
from app.services.ai_service import generate_ai_copilot_response

PORT = int(os.environ.get("PORT", 8000))
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend")

class RequestHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        # CORS Headers
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = {k: v[0] for k, v in parse_qs(parsed.query).items()}

        if path.startswith("/api/"):
            return self.handle_api_get(path, query)

        # Serve static frontend files
        return self.serve_static(path)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # Read JSON body
        content_len = int(self.headers.get("Content-Length", 0))
        body = {}
        if content_len > 0:
            raw = self.rfile.read(content_len).decode("utf-8")
            try:
                body = json.loads(raw)
            except Exception:
                pass

        if path.startswith("/api/"):
            return self.handle_api_post(path, body)

        self.send_json({"error": "Not Found"}, 404)

    def handle_api_get(self, path: str, query: dict):
        if path == "/api/system":
            return self.send_json(db.data.get("system", {}))
        elif path == "/api/suppliers":
            stage = query.get("stage")
            sups = db.get_suppliers()
            if stage:
                sups = [s for s in sups if s.get("stage") == stage]
            return self.send_json(sups)
        elif path == "/api/catalogs":
            return self.send_json(db.get_catalogs())
        elif path == "/api/requisitions":
            return self.send_json(db.get_requisitions())
        elif path == "/api/purchase-orders":
            return self.send_json(db.get_orders())
        elif path == "/api/receipts":
            return self.send_json(db.get_receipts())
        elif path == "/api/invoices":
            return self.send_json(db.get_invoices())
        elif path == "/api/sourcing":
            return self.send_json(db.get_sourcing_events())
        elif path == "/api/clauses":
            return self.send_json(db.get_clause_library())
        elif path == "/api/documents":
            return self.send_json(db.get_knowledge_repository())
        elif path == "/api/rbac":
            return self.send_json(db.get_rbac_matrix())
        elif path == "/api/auctions":
            return self.send_json(db.get_auctions())
        elif path == "/api/contracts":
            return self.send_json(db.get_contracts())
        elif path == "/api/analytics":
            return self.send_json(db.get_analytics())
        elif path == "/api/audit-logs":
            limit = int(query.get("limit", 50))
            return self.send_json(db.get_audit_logs(limit))

        self.send_json({"error": f"API endpoint GET {path} not found"}, 404)

    def handle_api_post(self, path: str, body: dict):
        try:
            # POST /api/suppliers/:id/stage
            if path.startswith("/api/suppliers/") and path.endswith("/stage"):
                sid = path.split("/")[3]
                res = db.update_supplier_stage(sid, body.get("stage"), body.get("actor", "Admin"))
                return self.send_json({"success": True, "supplier": res})

            # POST /api/suppliers/:id/verify-bank
            elif path.startswith("/api/suppliers/") and path.endswith("/verify-bank"):
                sid = path.split("/")[3]
                res = db.verify_supplier_bank(sid, body.get("actor", "Treasury Lead"))
                return self.send_json({"success": True, "supplier": res})

            # POST /api/requisitions
            elif path == "/api/requisitions":
                res = db.create_requisition(body, body.get("actor", "Requisitioner"))
                return self.send_json({"success": True, "requisition": res})

            # POST /api/requisitions/:id/approve
            elif path.startswith("/api/requisitions/") and path.endswith("/approve"):
                rid = path.split("/")[3]
                res = db.approve_requisition(rid, body.get("actor", "Karen Wu (Controller)"))
                return self.send_json({"success": True, "requisition": res})

            # POST /api/requisitions/:id/convert-to-po
            elif path.startswith("/api/requisitions/") and path.endswith("/convert-to-po"):
                rid = path.split("/")[3]
                res = db.convert_pr_to_po(rid, body.get("actor", "Sarah Jenkins (Buyer)"))
                return self.send_json({"success": True, "purchaseOrder": res})

            # POST /api/receipts
            elif path == "/api/receipts":
                res = db.create_receipt(body, body.get("actor", "Warehouse Lead"))
                return self.send_json({"success": True, "receipt": res})

            # POST /api/invoices/:id/reevaluate
            elif path.startswith("/api/invoices/") and path.endswith("/reevaluate"):
                iid = path.split("/")[3]
                res = db.reevaluate_invoice(iid, body.get("actor", "AP Match Engine"))
                return self.send_json({"success": True, **res})

            # POST /api/invoices/:id/post-erp
            elif path.startswith("/api/invoices/") and path.endswith("/post-erp"):
                iid = path.split("/")[3]
                res = db.post_invoice_to_erp(iid, body.get("actor", "Karen Wu (AP Lead)"))
                return self.send_json({"success": True, "invoice": res})

            # POST /api/auctions/:id/bid
            elif path.startswith("/api/auctions/") and path.endswith("/bid"):
                aid = path.split("/")[3]
                res = db.submit_auction_bid(aid, body.get("bidderId"), body.get("amount"), body.get("actor"))
                return self.send_json({"success": True, **res})

            # POST /api/ai/copilot
            elif path == "/api/ai/copilot":
                res = generate_ai_copilot_response(body.get("prompt", ""), body.get("mode", "general"))
                return self.send_json({"success": True, "response": res})

            self.send_json({"error": f"API endpoint POST {path} not found"}, 404)
        except Exception as e:
            self.send_json({"error": str(e)}, 400)

    def send_json(self, data: Any, status: int = 200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode("utf-8"))

    def serve_static(self, path: str):
        if path == "/":
            path = "/index.html"
        
        file_path = os.path.normpath(os.path.join(FRONTEND_DIR, path.lstrip("/")))
        if not file_path.startswith(FRONTEND_DIR):
            self.send_response(403)
            self.end_headers()
            return

        if not os.path.exists(file_path) or os.path.isdir(file_path):
            file_path = os.path.join(FRONTEND_DIR, "index.html")

        if os.path.exists(file_path):
            mime_type, _ = mimetypes.guess_type(file_path)
            self.send_response(200)
            self.send_header("Content-Type", mime_type or "text/plain")
            self.end_headers()
            with open(file_path, "rb") as f:
                self.wfile.write(f.read())
        else:
            self.send_response(404)
            self.end_headers()

def main():
    print("=================================================================")
    print(" [*] ProcureFlow Enterprise S2P Platform (Python Backend)")
    print(f" [*] Server URL: http://localhost:{PORT}")
    print(" [*] Workspaces: 7 Enterprise Workspaces / 13 Modules Ready")
    print(" [*] Stack: Python 3.12 + SQLite + React 18 SPA")
    print("=================================================================")
    server = HTTPServer(("0.0.0.0", PORT), RequestHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer shutting down gracefully.")
        server.server_close()

if __name__ == "__main__":
    main()
