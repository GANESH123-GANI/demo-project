"""
Deterministic 3-Way Matching Engine (Python)
Compares Purchase Order (Commitment), Goods Receipts / SES (Accepted Delivery), and Invoices (Liability)
"""
from typing import Dict, List, Any

DEFAULT_TOLERANCES = {
    "price_variance_pct": 1.0,
    "quantity_variance_pct": 0.0,
    "tax_variance_amount": 5.00
}

def execute_3way_match(invoice: Dict[str, Any], po: Dict[str, Any], receipts: List[Dict[str, Any]], tolerances: Dict[str, Any] = None) -> Dict[str, Any]:
    if tolerances is None:
        tolerances = DEFAULT_TOLERANCES

    discrepancies = []
    line_matches = []

    if not po:
        return {
            "match_status": "PO_NOT_FOUND",
            "approved_for_payment": False,
            "discrepancies": [{"code": "PO_NOT_FOUND", "detail": f"Referenced PO {invoice.get('poId')} could not be located."}],
            "line_matches": []
        }

    # 1. Header validations
    if invoice.get("supplierId") != po.get("supplierId"):
        discrepancies.append({
            "code": "SUPPLIER_MISMATCH",
            "detail": f"Invoice supplier ({invoice.get('supplierId')}) does not match PO supplier ({po.get('supplierId')})."
        })

    if invoice.get("currency") != po.get("currency"):
        discrepancies.append({
            "code": "CURRENCY_MISMATCH",
            "detail": f"Invoice currency ({invoice.get('currency')}) does not match PO currency ({po.get('currency')})."
        })

    # Map PO lines
    po_lines_map = {l["line"]: l for l in po.get("lines", [])}

    # Filter receipts for this PO
    po_receipts = [r for r in receipts if r.get("poId") == po.get("id")]
    if not po_receipts:
        discrepancies.append({
            "code": "MISSING_RECEIPT",
            "detail": f"No Goods Receipts (GRN) or Service Entry Sheets (SES) recorded for {po.get('id')}."
        })

    # Line item checks
    for inv_line in invoice.get("lines", []):
        po_line = po_lines_map.get(inv_line.get("poLine"))
        if not po_line:
            discrepancies.append({
                "code": "UNMATCHED_PO_LINE",
                "line": inv_line.get("line"),
                "detail": f"Invoice line {inv_line.get('line')} references PO line {inv_line.get('poLine')} which does not exist."
            })
            continue

        po_unit_price = float(po_line.get("unitPrice", 0))
        inv_unit_price = float(inv_line.get("unitPrice", 0))
        price_diff = inv_unit_price - po_unit_price
        price_variance_pct = (price_diff / po_unit_price * 100) if po_unit_price > 0 else 0.0

        tol_price = float(tolerances.get("price_variance_pct", 1.0))
        price_within_tolerance = -tol_price <= price_variance_pct <= tol_price

        if not price_within_tolerance:
            discrepancies.append({
                "code": "PRICE_VARIANCE",
                "line": inv_line.get("line"),
                "po_line": po_line.get("line"),
                "sku": inv_line.get("sku") or po_line.get("sku"),
                "detail": f"Unit price ${inv_unit_price:.2f} exceeds PO price ${po_unit_price:.2f} by {price_variance_pct:.2f}% (Tolerance: ±{tol_price}%)."
            })

        # Calculate total accepted quantity across receipts
        total_accepted = 0
        total_delivered = 0
        total_rejected = 0
        for r in po_receipts:
            for rl in r.get("lines", []):
                if rl.get("poLine") == po_line.get("line"):
                    total_accepted += int(rl.get("acceptedQty", 0))
                    total_delivered += int(rl.get("deliveredQty", 0))
                    total_rejected += int(rl.get("rejectedQty", 0))

        inv_qty = int(inv_line.get("qty", 0))
        is_qty_exceeded = inv_qty > total_accepted

        if po_receipts and is_qty_exceeded:
            discrepancies.append({
                "code": "QTY_EXCEEDS_ACCEPTED",
                "line": inv_line.get("line"),
                "po_line": po_line.get("line"),
                "sku": inv_line.get("sku") or po_line.get("sku"),
                "detail": f"Invoiced quantity ({inv_qty}) exceeds accepted quantity ({total_accepted}). Delivered: {total_delivered}, Rejected: {total_rejected}."
            })

        line_matches.append({
            "line": inv_line.get("line"),
            "po_line": po_line.get("line"),
            "sku": inv_line.get("sku"),
            "po_unit_price": po_unit_price,
            "inv_unit_price": inv_unit_price,
            "price_variance_pct": round(price_variance_pct, 2),
            "invoiced_qty": inv_qty,
            "total_accepted_qty": total_accepted,
            "price_match": price_within_tolerance,
            "qty_match": (not is_qty_exceeded) and len(po_receipts) > 0
        })

    # Overall Match Status
    match_status = "MATCHED"
    if any(d["code"] == "MISSING_RECEIPT" for d in discrepancies):
        match_status = "MISSING_RECEIPT"
    elif any(d["code"] == "QTY_EXCEEDS_ACCEPTED" for d in discrepancies):
        match_status = "QUANTITY_MISMATCH"
    elif any(d["code"] == "PRICE_VARIANCE" for d in discrepancies):
        match_status = "PRICE_VARIANCE"
    elif discrepancies:
        match_status = "DISCREPANCIES_FLAGGED"

    approved_for_payment = (match_status == "MATCHED") and (len(discrepancies) == 0)

    recommended_action = "Ready for automated ERP Accounts Payable voucher creation and scheduled payment."
    if match_status == "MISSING_RECEIPT":
        recommended_action = "Hold payment. Request warehouse dock or service requester to record Goods Receipt or Service Entry Sheet."
    elif match_status == "QUANTITY_MISMATCH":
        recommended_action = "Hold payment. Request credit note from vendor for rejected units, or approve partial liability for accepted units."
    elif match_status == "PRICE_VARIANCE":
        recommended_action = "Route to procurement buyer for price deviation approval or reject invoice for credit re-issuance."

    return {
        "match_status": match_status,
        "approved_for_payment": approved_for_payment,
        "discrepancies": discrepancies,
        "line_matches": line_matches,
        "recommended_action": recommended_action
    }

