"""Cynos backend API tests - products, orders, auth, admin."""
import os
import pytest
import requests
import uuid

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "https://cynos-dropship.preview.emergentagent.com"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@cynos.in"
ADMIN_PASSWORD = "cynos@admin2026"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(client):
    r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    return data["access_token"]


@pytest.fixture(scope="session")
def admin_client(client, admin_token):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"})
    return s


# ---------- Health ----------
class TestHealth:
    def test_root(self, client):
        r = client.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------- Products ----------
class TestProducts:
    def test_bestsellers_returns_7_plus(self, client):
        r = client.get(f"{API}/products/bestsellers")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 7, f"Expected >=7 bestsellers, got {len(items)}"
        for p in items:
            assert p["is_bestseller"] is True
            assert "slug" in p and "id" in p

    def test_list_products_default(self, client):
        r = client.get(f"{API}/products")
        assert r.status_code == 200
        assert len(r.json()) >= 8

    def test_filter_category(self, client):
        r = client.get(f"{API}/products", params={"category": "oversized"})
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        assert all(p["category"] == "oversized" for p in items)

    def test_filter_size(self, client):
        r = client.get(f"{API}/products", params={"size": "M"})
        assert r.status_code == 200
        assert all("M" in p["sizes"] for p in r.json())

    def test_filter_max_price(self, client):
        r = client.get(f"{API}/products", params={"max_price": 550})
        assert r.status_code == 200
        assert all(p["price"] <= 550 for p in r.json())

    def test_sort_price_asc(self, client):
        r = client.get(f"{API}/products", params={"sort": "price_asc"})
        prices = [p["price"] for p in r.json()]
        assert prices == sorted(prices)

    def test_get_product_by_slug(self, client):
        # seeded slug
        r = client.get(f"{API}/products/onyx-oversized-tee")
        assert r.status_code == 200
        assert r.json()["slug"] == "onyx-oversized-tee"

    def test_get_product_404(self, client):
        r = client.get(f"{API}/products/nonexistent-slug-xyz")
        assert r.status_code == 404


# ---------- Orders ----------
class TestOrders:
    customer = {
        "full_name": "TEST Buyer",
        "email": "test_buyer@example.com",
        "phone": "9999999999",
        "address_line1": "1 Test St",
        "city": "Mumbai",
        "state": "MH",
        "pincode": "400001",
    }

    def _get_product(self, client, slug="onyx-oversized-tee"):
        return client.get(f"{API}/products/{slug}").json()

    def test_create_order_b2g1_discount(self, client):
        # 3 items - cheapest should be free
        p1 = self._get_product(client, "onyx-oversized-tee")  # 599
        p2 = self._get_product(client, "midnight-essential-tee")  # 499 (cheapest)
        p3 = self._get_product(client, "shadow-anime-tee")  # 649
        items = [
            {"product_id": p1["id"], "name": p1["name"], "price": p1["price"], "size": "M", "qty": 1},
            {"product_id": p2["id"], "name": p2["name"], "price": p2["price"], "size": "M", "qty": 1},
            {"product_id": p3["id"], "name": p3["name"], "price": p3["price"], "size": "M", "qty": 1},
        ]
        r = client.post(f"{API}/orders", json={
            "customer": self.customer, "items": items, "payment_method": "cod"
        })
        assert r.status_code == 200, r.text
        order = r.json()
        expected_subtotal = 599 + 499 + 649
        assert order["subtotal"] == expected_subtotal
        # B2G1: cheapest price discounted = 499
        assert order["discount_amount"] == 499, f"expected 499, got {order['discount_amount']}"
        assert order["total"] == expected_subtotal - 499
        assert order["status"] == "pending"
        assert "id" in order

        # GET verify persistence
        g = client.get(f"{API}/orders/{order['id']}")
        assert g.status_code == 200
        assert g.json()["id"] == order["id"]

    def test_create_order_cynos10(self, client):
        p1 = self._get_product(client, "onyx-oversized-tee")  # 599
        items = [{"product_id": p1["id"], "name": p1["name"], "price": p1["price"], "size": "L", "qty": 1}]
        r = client.post(f"{API}/orders", json={
            "customer": self.customer, "items": items,
            "payment_method": "upi", "discount_code": "CYNOS10"
        })
        assert r.status_code == 200
        order = r.json()
        assert order["subtotal"] == 599
        assert order["discount_amount"] == round(599 * 0.10, 2)
        assert order["total"] == round(599 - 59.9, 2)

    def test_empty_cart_400(self, client):
        r = client.post(f"{API}/orders", json={
            "customer": self.customer, "items": [], "payment_method": "cod"
        })
        assert r.status_code == 400

    def test_order_not_found(self, client):
        r = client.get(f"{API}/orders/{uuid.uuid4()}")
        assert r.status_code == 404


# ---------- Auth ----------
class TestAuth:
    def test_login_success(self, client):
        r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert "access_token" in d and isinstance(d["access_token"], str)
        assert d["user"]["email"] == ADMIN_EMAIL
        assert d["user"]["role"] == "admin"

    def test_login_invalid(self, client):
        r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_without_token(self, client):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_token(self, admin_client):
        r = admin_client.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL


# ---------- Admin Products ----------
class TestAdminProducts:
    def test_list_requires_auth(self, client):
        r = client.get(f"{API}/admin/products")
        assert r.status_code == 401

    def test_admin_crud(self, admin_client):
        payload = {
            "name": f"TEST Product {uuid.uuid4().hex[:6]}",
            "description": "test desc",
            "price": 499, "original_price": 799,
            "category": "men",
            "images": ["https://example.com/a.jpg"],
            "sizes": ["M", "L"],
            "badges": ["New"],
            "stock_count": 10,
            "is_bestseller": False,
            "rating": 4.5, "review_count": 0,
        }
        # Create
        c = admin_client.post(f"{API}/admin/products", json=payload)
        assert c.status_code == 200, c.text
        prod = c.json()
        pid = prod["id"]
        assert prod["name"] == payload["name"]

        # Update
        updated = {**payload, "price": 599}
        u = admin_client.put(f"{API}/admin/products/{pid}", json=updated)
        assert u.status_code == 200
        assert u.json()["price"] == 599

        # Verify persisted via GET slug
        g = admin_client.get(f"{API}/products/{prod['slug']}")
        assert g.status_code == 200
        assert g.json()["price"] == 599

        # Delete
        d = admin_client.delete(f"{API}/admin/products/{pid}")
        assert d.status_code == 200
        # verify gone
        g2 = admin_client.get(f"{API}/products/{prod['slug']}")
        assert g2.status_code == 404


# ---------- Admin Orders ----------
class TestAdminOrders:
    def test_list_orders(self, admin_client):
        r = admin_client.get(f"{API}/admin/orders")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_update_order_status(self, client, admin_client):
        # create order first
        p = client.get(f"{API}/products/onyx-oversized-tee").json()
        items = [{"product_id": p["id"], "name": p["name"], "price": p["price"], "size": "M", "qty": 1}]
        order = client.post(f"{API}/orders", json={
            "customer": {"full_name": "TEST", "email": "t@t.com", "phone": "9999",
                         "address_line1": "x", "city": "c", "state": "s", "pincode": "400001"},
            "items": items, "payment_method": "cod"
        }).json()

        r = admin_client.patch(f"{API}/admin/orders/{order['id']}", json={"status": "confirmed"})
        assert r.status_code == 200
        assert r.json()["status"] == "confirmed"

        bad = admin_client.patch(f"{API}/admin/orders/{order['id']}", json={"status": "invalid_status"})
        assert bad.status_code == 400


# ---------- Admin Stats ----------
class TestAdminStats:
    def test_stats(self, admin_client):
        r = admin_client.get(f"{API}/admin/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ("total_orders", "total_products", "pending_orders", "revenue"):
            assert k in d
        assert d["total_products"] >= 8
