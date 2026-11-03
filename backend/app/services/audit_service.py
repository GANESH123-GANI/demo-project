"""
Tamper-Evident SHA-256 Chained Audit Service (Python)
"""
import hashlib
import json
import time
from typing import Dict, Any

_last_hash = "0" * 64

def create_audit_record(actor: str, action: str, target: str, details: str) -> Dict[str, Any]:
    global _last_hash
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    record_id = f"AUD-{hex(int(time.time() * 1000))[2:].upper()}"

    payload = json.dumps({
        "id": record_id,
        "timestamp": timestamp,
        "actor": actor,
        "action": action,
        "target": target,
        "details": details,
        "prev_hash": _last_hash
    }, sort_keys=True)

    record_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    _last_hash = record_hash

    return {
        "id": record_id,
        "timestamp": timestamp,
        "actor": actor,
        "action": action,
        "target": target,
        "details": details,
        "hash": record_hash,
        "verified": True
    }

