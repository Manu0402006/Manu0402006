"""SendGrid email service for Cynos order notifications.
Sends asynchronously and silently logs failures so order creation never breaks.
"""
import os
import logging
from datetime import datetime, timezone
from typing import Optional

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content

logger = logging.getLogger("cynos.email")


def _format_inr(amount: float) -> str:
    return "₹" + f"{int(round(amount)):,}".replace(",", ",")  # noqa


def _build_customer_html(order: dict) -> str:
    items_html = ""
    for it in order["items"]:
        img_html = (
            f'<img src="{it["image"]}" width="64" height="80" style="display:block;border:1px solid #27272A;background:#1A1A1A;object-fit:cover" alt="">'
            if it.get("image") else ""
        )
        items_html += f"""
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #27272A;width:80px">{img_html}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #27272A;color:#ffffff;font-family:Arial,sans-serif">
            <div style="font-weight:bold;text-transform:uppercase;letter-spacing:0.5px">{it["name"]}</div>
            <div style="color:#A1A1AA;font-size:11px;letter-spacing:1px;text-transform:uppercase;margin-top:4px">SIZE {it["size"]} · QTY {it["qty"]}</div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #27272A;color:#ffffff;font-family:Arial,sans-serif;text-align:right;font-size:18px;font-weight:bold">{_format_inr(it["price"] * it["qty"])}</td>
        </tr>
        """

    discount_row = ""
    if order.get("discount_amount", 0) > 0:
        discount_row = f"""
        <tr><td style="color:#FF3333;font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding:4px 0">Discount</td>
            <td style="color:#FF3333;font-family:Arial,sans-serif;text-align:right;padding:4px 0">-{_format_inr(order["discount_amount"])}</td></tr>
        """

    addr = order["customer"]
    address_html = f'{addr["address_line1"]}'
    if addr.get("address_line2"):
        address_html += f', {addr["address_line2"]}'
    address_html += f'<br>{addr["city"]}, {addr["state"]} {addr["pincode"]}'

    short_id = order["id"][:8].upper()

    return f"""<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#050505;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:40px 20px">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0A0A0A;border:1px solid #27272A">
      <!-- HEADER -->
      <tr><td style="padding:32px;border-bottom:1px solid #27272A">
        <div style="font-family:Arial Black,sans-serif;font-size:36px;color:#ffffff;letter-spacing:-1px;text-transform:uppercase">CYNOS<span style="color:#FF3333">.</span></div>
        <div style="color:#A1A1AA;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin-top:4px">Wear Your Attitude</div>
      </td></tr>

      <!-- HERO -->
      <tr><td style="padding:40px 32px 24px;text-align:left">
        <div style="color:#FF3333;font-size:11px;letter-spacing:3px;text-transform:uppercase">Order Confirmed</div>
        <h1 style="font-family:Arial Black,sans-serif;font-size:42px;color:#ffffff;margin:12px 0 0;line-height:1;text-transform:uppercase;letter-spacing:-1px">Thanks,<br>{addr["full_name"].split(" ")[0]}.</h1>
        <p style="color:#A1A1AA;font-size:14px;line-height:1.6;margin-top:20px">
          Your drop is locked in. We'll ship it within 1 business day. Estimated arrival: <span style="color:#ffffff;font-weight:bold">3–6 business days</span>.
        </p>
        <div style="background:#1A1A1A;border:1px solid #27272A;padding:16px;margin-top:24px">
          <div style="color:#A1A1AA;font-size:10px;letter-spacing:2px;text-transform:uppercase">Order Number</div>
          <div style="color:#ffffff;font-family:'Courier New',monospace;font-size:20px;font-weight:bold;margin-top:4px">#{short_id}</div>
        </div>
      </td></tr>

      <!-- ITEMS -->
      <tr><td style="padding:24px 32px">
        <div style="color:#A1A1AA;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px">Your Items</div>
        <table width="100%" cellpadding="0" cellspacing="0">{items_html}</table>
      </td></tr>

      <!-- TOTALS -->
      <tr><td style="padding:0 32px 24px">
        <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
          <tr><td style="color:#A1A1AA;font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding:4px 0">Subtotal</td>
              <td style="color:#ffffff;font-family:Arial,sans-serif;text-align:right;padding:4px 0">{_format_inr(order["subtotal"])}</td></tr>
          {discount_row}
          <tr><td style="color:#A1A1AA;font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding:4px 0">Shipping</td>
              <td style="color:#22C55E;font-family:Arial,sans-serif;text-align:right;padding:4px 0">FREE</td></tr>
          <tr><td colspan="2" style="border-top:1px solid #27272A;padding-top:12px"></td></tr>
          <tr><td style="color:#ffffff;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:4px 0">Total</td>
              <td style="color:#ffffff;font-family:Arial Black,sans-serif;text-align:right;padding:4px 0;font-size:28px">{_format_inr(order["total"])}</td></tr>
        </table>
        <div style="margin-top:12px;color:#A1A1AA;font-size:10px;letter-spacing:1px;text-transform:uppercase">Payment: {order["payment_method"].upper()}</div>
      </td></tr>

      <!-- ADDRESS -->
      <tr><td style="padding:24px 32px;border-top:1px solid #27272A">
        <div style="color:#A1A1AA;font-size:10px;letter-spacing:2px;text-transform:uppercase">Shipping To</div>
        <div style="color:#ffffff;font-size:14px;margin-top:8px;line-height:1.6">
          <strong>{addr["full_name"]}</strong><br>{address_html}<br>
          <span style="color:#A1A1AA">{addr["phone"]}</span>
        </div>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="padding:32px;border-top:1px solid #27272A;text-align:center">
        <div style="color:#A1A1AA;font-size:11px;line-height:1.6">
          Need help? Reply to this email or WhatsApp us at <a href="https://wa.me/919810153152" style="color:#FF3333;text-decoration:none">+91 98101 53152</a>.
        </div>
        <div style="color:#52525B;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-top:16px">
          © Cynos {datetime.now().year} · Made in India
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>
"""


def _build_admin_html(order: dict) -> str:
    addr = order["customer"]
    items_lines = "<br>".join(f"• {i['qty']}× {i['name']} (Size {i['size']}) — ₹{int(i['price']*i['qty'])}" for i in order["items"])
    short_id = order["id"][:8].upper()
    return f"""<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#050505;font-family:Arial,sans-serif;color:#ffffff">
<div style="max-width:560px;margin:32px auto;background:#0A0A0A;border:1px solid #27272A;padding:32px">
  <div style="color:#FF3333;font-size:11px;letter-spacing:3px;text-transform:uppercase">New Order</div>
  <h1 style="font-family:Arial Black,sans-serif;font-size:32px;color:#ffffff;margin:8px 0 0;text-transform:uppercase;letter-spacing:-1px">#{short_id}</h1>
  <div style="font-size:28px;color:#22C55E;margin-top:16px;font-weight:bold">{_format_inr(order["total"])} · {order["payment_method"].upper()}</div>

  <div style="margin-top:24px;padding:16px;background:#1A1A1A;border:1px solid #27272A">
    <div style="color:#A1A1AA;font-size:10px;letter-spacing:2px;text-transform:uppercase">Customer</div>
    <div style="margin-top:8px;line-height:1.6">
      <strong>{addr["full_name"]}</strong><br>
      {addr["email"]} · {addr["phone"]}<br>
      <span style="color:#A1A1AA">{addr["address_line1"]}, {addr["city"]}, {addr["state"]} {addr["pincode"]}</span>
    </div>
  </div>

  <div style="margin-top:16px;padding:16px;background:#1A1A1A;border:1px solid #27272A">
    <div style="color:#A1A1AA;font-size:10px;letter-spacing:2px;text-transform:uppercase">Items ({len(order["items"])})</div>
    <div style="margin-top:8px;line-height:1.8;font-size:13px">{items_lines}</div>
  </div>

  <div style="margin-top:24px;color:#52525B;font-size:11px">Manage in admin: /admin</div>
</div>
</body></html>
"""


def _send(to_email: str, subject: str, html: str) -> bool:
    api_key = os.environ.get("SENDGRID_API_KEY", "").strip()
    sender = os.environ.get("EMAIL_FROM", "").strip()
    sender_name = os.environ.get("EMAIL_FROM_NAME", "Cynos").strip()

    if not api_key:
        logger.warning("SENDGRID_API_KEY missing — email skipped (to=%s)", to_email)
        return False
    if not sender:
        logger.warning("EMAIL_FROM missing — email skipped")
        return False

    try:
        message = Mail(
            from_email=Email(sender, sender_name),
            to_emails=To(to_email),
            subject=subject,
            html_content=Content("text/html", html),
        )
        sg = SendGridAPIClient(api_key)
        resp = sg.send(message)
        ok = 200 <= resp.status_code < 300
        logger.info("SendGrid → %s · status=%s · subject=%s", to_email, resp.status_code, subject)
        return ok
    except Exception as e:  # noqa: BLE001
        logger.error("SendGrid send failed for %s: %s", to_email, e)
        return False


def send_order_emails(order: dict) -> dict:
    """Send customer + admin emails. Never raises."""
    short_id = order["id"][:8].upper()
    customer_subject = f"Order Confirmed · #{short_id} · Cynos"
    admin_subject = f"[CYNOS] New order #{short_id} · {_format_inr(order['total'])}"

    results = {"customer": False, "admin": False}
    try:
        results["customer"] = _send(order["customer"]["email"], customer_subject, _build_customer_html(order))
    except Exception as e:  # noqa: BLE001
        logger.error("customer email build failed: %s", e)

    admin_to = os.environ.get("EMAIL_ADMIN", "").strip()
    if admin_to:
        try:
            results["admin"] = _send(admin_to, admin_subject, _build_admin_html(order))
        except Exception as e:  # noqa: BLE001
            logger.error("admin email build failed: %s", e)
    return results
