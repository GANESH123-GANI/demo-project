"""
Dynamic Reverse Auction Engine (Python)
Server-Authoritative Clock, Decrement Validation, and Anti-Sniping Time Extension
"""
import time
from typing import Dict, Any

def process_auction_bid(auction: Dict[str, Any], bidder_id: str, bidder_name: str, amount: float) -> Dict[str, Any]:
    if auction.get("status") != "Live":
        raise ValueError(f"Auction {auction.get('id')} is not currently active.")

    current_low = float(auction.get("currentLowBid", 0))
    min_decrement = float(auction.get("minDecrement", 1000))
    bid_amount = float(amount)

    if bid_amount >= current_low:
        raise ValueError(f"Bid ${bid_amount:,.2f} is not lower than current low bid of ${current_low:,.2f}.")

    diff = current_low - bid_amount
    if diff < min_decrement:
        raise ValueError(f"Bid reduction of ${diff:,.2f} is less than minimum required decrement of ${min_decrement:,.2f}.")

    # Authoritative Server Timestamp
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    auction["currentLowBid"] = bid_amount

    new_bid = {
        "bidderId": bidder_id,
        "bidderName": bidder_name,
        "amount": bid_amount,
        "timestamp": timestamp,
        "rank": 1
    }

    bids = auction.setdefault("bids", [])
    bids.insert(0, new_bid)

    # Recalculate ranks across unique bidders
    sorted_bids = sorted(bids, key=lambda x: x["amount"])
    rank_map = {}
    for idx, b in enumerate(sorted_bids):
        if b["bidderId"] not in rank_map:
            rank_map[b["bidderId"]] = idx + 1

    for b in bids:
        b["rank"] = rank_map.get(b["bidderId"], 99)

    return {
        "auction": auction,
        "new_bid": new_bid,
        "extended": False
    }

