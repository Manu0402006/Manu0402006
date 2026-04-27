"""Qikink Print-on-Demand fulfilment client.

Discovered API contract (sandbox & live):
- Auth:        POST {BASE}/api/token  (form-urlencoded ClientId + client_secret) -> {"Accesstoken": "...", "expires_in": 3600}
- Create order: POST {BASE}/api/order/create  with headers: Accesstoken, ClientId, Content-Type: application/json

Body schema:
{
  "order_number":   "<external ref>",
  "qikink_shipping": 1,                       # 1 = Qikink ships ; 0 = self-ship (special perm required)
  "gateway":         "COD" | "PREPAID",
  "total_order_value": <number>,
  "line_items": [
    {
      "search_from_my_products": 1,           # 1 = SKU already in your Qikink dashboard catalog (no design fields needed)
      "sku":      "<your-qikink-sku>",
      "quantity": <int>,
      "price":    <number>
      # if search_from_my_products==0: also pass print_type_id + designs[] (custom upload flow)
    }
  ],
  "shipping_address": {
    "first_name", "last_name", "phone", "email",
    "address1", "city", "province", "zip", "country_code"   # NOT 'country' or 'state'
  }
}

This module is fail-safe: any error is logged and never raises so order creation never breaks.
"""
import os
import time
import json
import logging
from typing import Optional, Tuple

import requests

logger = logging.getLogger("cynos.qikink")

_token_cache: dict = {"value": None, "expires_at": 0}

# Map Indian state codes (province should be 2-letter ISO 3166-2:IN code or full name)
_STATE_CODES = {
    "andhra pradesh": "AP", "arunachal pradesh": "AR", "assam": "AS", "bihar": "BR",
    "chhattisgarh": "CT", "goa": "GA", "gujarat": "GJ", "haryana": "HR",
    "himachal pradesh": "HP", "jharkhand": "JH", "karnataka": "KA", "kerala": "KL",
    "madhya pradesh": "MP", "maharashtra": "MH", "manipur": "MN", "meghalaya": "ML",
    "mizoram": "MZ", "nagaland": "NL", "odisha": "OR", "punjab": "PB",
    "rajasthan": "RJ", "sikkim": "SK", "tamil nadu": "TN", "telangana": "TG",
    "tripura": "TR", "uttar pradesh": "UP", "uttarakhand": "UT", "west bengal": "WB",
    "delhi": "DL", "jammu and kashmir": "JK", "ladakh": "LA",
    "chandigarh": "CH", "dadra and nagar haveli": "DN", "daman and diu": "DD",
    "lakshadweep": "LD", "puducherry": "PY", "andaman and nicobar islands": "AN",
}


def _is_enabled() -> bool:
    return os.environ.get("QIKINK_ENABLED", "false").strip().lower() in {"1", "true", "yes"}


def _base_url() -> str:
    return os.environ.get("QIKINK_BASE_URL", "https://sandbox.qikink.com").rstrip("/")


def _credentials() -> Tuple[str, str]:
    return (
        os.environ.get("QIKINK_CLIENT_ID", "").strip(),
        os.environ.get("QIKINK_CLIENT_SECRET", "").strip(),
    )


def _normalize_province(state: str) -> str:
    s = (state or "").strip()
    if len(s) == 2:
        return s.upper()
    return _STATE_CODES.get(s.lower(), s[:2].upper() if s else "MH")


def _get_access_token(force: bool = False) -> Optional[str]:
    now = time.time()
    if not force and _token_cache["value"] and _token_cache["expires_at"] > now + 30:
        return _token_cache["value"]

    client_id, client_secret = _credentials()
    if not client_id or not client_secret:
        logger.warning("Qikink credentials missing — token fetch skipped")
        return None

    url = f"{_base_url()}/api/token"
    try:
        r = requests.post(
            url,
            data={"ClientId": client_id, "client_secret": client_secret},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=15,
        )
        if not r.ok:
            logger.error("Qikink auth %s: %s", r.status_code, r.text[:300])
            return None
        body = r.json()
        token = body.get("Accesstoken") or body.get("access_token")
        expires_in = int(body.get("expires_in", 3600))
        if not token:
            logger.error("Qikink auth: no token in response: %s", body)
            return None
        _token_cache["value"] = token
        _token_cache["expires_at"] = now + expires_in
        logger.info("Qikink token fetched, expires in %ss", expires_in)
        return token
    except Exception as e:  # noqa: BLE001
        logger.error("Qikink auth exception: %s", e)
        return None


def _build_payload(order: dict, sku_map: dict) -> dict:
    addr = order["customer"]
    line_items = []
    for it in order["items"]:
        meta = sku_map.get(it["product_id"], {})
        sku = meta.get("qikink_sku") or it["product_id"]  # falls back to internal id (will fail with "Invalid SKU")
        designs = meta.get("qikink_designs") or []

        item: dict = {
            "search_from_my_products": 0 if designs else 1,
            "sku": sku,
            "quantity": int(it["qty"]),
            "price": str(it["price"]),
        }
        if designs:
            # Custom design upload flow — caller supplies designs list with print_type_id etc.
            item["print_type_id"] = meta.get("qikink_print_type_id", 1)  # 1 = DTG (sensible default)
            item["designs"] = designs
        line_items.append(item)

    full_address = addr.get("address_line1", "")
    if addr.get("address_line2"):
        full_address += f", {addr['address_line2']}"

    name_parts = (addr.get("full_name") or "").strip().split(" ", 1)
    first = name_parts[0] or "-"
    last = name_parts[1] if len(name_parts) > 1 else "-"

    payload = {
        "order_number": order["id"][:8].upper(),
        "qikink_shipping": 1,
        "line_items": line_items,
        "shipping_address": {
            "first_name": first,
            "last_name": last,
            "email": addr["email"],
            "phone": addr["phone"],
            "address1": full_address[:120],
            "city": addr["city"],
            "province": _normalize_province(addr.get("state", "")),
            "zip": addr["pincode"],
            "country_code": "IN",
        },
        "gateway": "PREPAID" if order["payment_method"] in {"upi", "card"} else "COD",
        "total_order_value": str(order["total"]),
    }
    return payload


def push_order(order: dict, sku_map: dict) -> dict:
    """Push a Cynos order to Qikink. Always returns dict; never raises.

    Returns: {ok, qikink_order_id, status, raw, error, request_payload}
    """
    result = {"ok": False, "qikink_order_id": None, "status": None, "raw": None,
              "error": None, "request_payload": None}

    if not _is_enabled():
        result["error"] = "disabled"
        return result

    token = _get_access_token()
    if not token:
        result["error"] = "auth_failed"
        return result

    client_id, _ = _credentials()
    payload = _build_payload(order, sku_map)
    result["request_payload"] = payload

    url = f"{_base_url()}/api/order/create"
    headers = {
        "Accesstoken": token,
        "ClientId": client_id,
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    try:
        r = requests.post(url, headers=headers, data=json.dumps(payload), timeout=20)
        result["status"] = r.status_code
        try:
            result["raw"] = r.json()
        except ValueError:
            result["raw"] = r.text[:1000]

        if r.status_code == 401:
            logger.warning("Qikink 401 — refreshing token & retrying")
            token = _get_access_token(force=True)
            if token:
                headers["Accesstoken"] = token
                r = requests.post(url, headers=headers, data=json.dumps(payload), timeout=20)
                result["status"] = r.status_code
                try:
                    result["raw"] = r.json()
                except ValueError:
                    result["raw"] = r.text[:1000]

        if 200 <= r.status_code < 300:
            body = result["raw"] if isinstance(result["raw"], dict) else {}
            result["ok"] = True
            result["qikink_order_id"] = (
                body.get("qikink_order_id")
                or body.get("order_id")
                or body.get("id")
                or (body.get("data") or {}).get("order_id") if isinstance(body, dict) else None
            )
            logger.info("Qikink order pushed: cynos=%s qikink=%s", order["id"][:8], result["qikink_order_id"])
        else:
            err_msg = (result["raw"] or {}).get("error") if isinstance(result["raw"], dict) else None
            result["error"] = err_msg or f"http_{r.status_code}"
            logger.error("Qikink create-order %s: %s", r.status_code, str(result["raw"])[:400])
    except Exception as e:  # noqa: BLE001
        result["error"] = f"exception:{e}"
        logger.error("Qikink create-order exception: %s", e)

    return result
