"""
Domain-Specific S2P AI Synthesizer & Guardrail Service (Python)
"""
from typing import Dict, Any

def generate_ai_copilot_response(prompt: str = "", mode: str = "general") -> Dict[str, Any]:
    p = prompt.lower()

    if mode == "contract" or any(k in p for k in ["contract", "clause", "ctr-603", "liability"]):
        return {
            "agent": "Contract Intelligence Assistant",
            "recommendation": "Clause Deviation Review Flagged",
            "confidence": 0.96,
            "citations": ["CTR-603 Section 14.2 (Limitation of Liability)", "Corporate Standard Playbook 2026 §8.1"],
            "content": (
                "Contract **CTR-603** with **Nova Precision Engineering** contains a critical liability deviation:\n"
                "- **Standard Policy**: Mutual aggregate liability capped at 2.0x total contract value (€360,000.00).\n"
                "- **Vendor Proposed**: Liability capped at 0.5x total contract value (€90,000.00).\n"
                "- **Risk Governance**: Non-standard deviations require formal General Counsel and CFO sign-off.\n"
                "- **Recommended Strategy**: Offer fallback at 1.0x with carve-outs for confidentiality breaches and willful misconduct."
            )
        }

    if mode == "invoice" or any(k in p for k in ["invoice", "match", "inv-802", "variance", "discrepancy"]):
        return {
            "agent": "AP 3-Way Match Assistant",
            "recommendation": "Deterministic Discrepancy Assessment",
            "confidence": 0.99,
            "citations": ["PO-3002 Line 1", "Goods Receipt GRN-702 Inspection Note", "Invoice INV-802"],
            "content": (
                "**Deterministic Analysis of Exception on INV-802:**\n"
                "1. **Purchase Order PO-3002** authorized 10 units at $12,800.00 each ($128,000.00).\n"
                "2. **Goods Receipt GRN-702** received 10 units, but inspection accepted only **8 units**. 2 units failed diagnostic boot and were physically rejected.\n"
                "3. **Invoice INV-802** billed for the full 10 units ($128,000.00).\n"
                "4. **Actionable Resolution**:\n"
                "   - Do NOT approve voucher for $128,000.00.\n"
                "   - Request credit note from Apex Cloud for $25,600.00 (2 rejected units).\n"
                "   - Alternatively, approve partial voucher for accepted liability of $102,400.00."
            )
        }

    if mode == "supplier" or any(k in p for k in ["supplier", "risk", "biohealth", "bank"]):
        return {
            "agent": "Supplier Risk & SRM Assistant",
            "recommendation": "High Risk Alert: Dual-Control Banking Verification Required",
            "confidence": 0.98,
            "citations": ["SUP-105 Supplier Master", "Treasury Anti-Fraud Policy §4.1"],
            "content": (
                "**Risk Synthesis for BioHealth Laboratories Ltd (SUP-105):**\n"
                "- **Status**: Suspended (Risk Score: 76 / High).\n"
                "- **Trigger**: Bank account routing update submitted via vendor portal.\n"
                "- **Compliance Gate**: Bank verification is unverified. Sanctions screening requires KYC refresh.\n"
                "- **Segregation of Duties**: In accordance with Treasury controls, AP disbursements are blocked until independent voice verification is logged."
            )
        }

    return {
        "agent": "ProcureFlow AI Copilot",
        "recommendation": "Strategic Spend & S2P Guidance",
        "confidence": 0.94,
        "citations": ["ProcureFlow Knowledge Base 2026", "Enterprise Spend Taxonomy"],
        "content": (
            "I have analyzed your active procurement workspace:\n"
            "- **Active Requisitions**: PR-2026-004 is awaiting Finance Controller approval ($55,000.00).\n"
            "- **Live Auctions**: Reverse Auction AUC-501 is live with current low bid $168,000.00.\n"
            "- **3-Way Matching**: 3 invoices have open exceptions requiring AP clerk or buyer action.\n"
            "- **Contracts**: CTR-602 has volume rebate calculations due this quarter."
        )
    }

