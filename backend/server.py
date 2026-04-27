from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import uuid
import logging
import bcrypt
import jwt
from typing import List, Optional
from datetime import datetime, timezone, timedelta

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Query, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

from email_service import send_order_emails

# ---------------------------------------------------------------------------
# DB & App init
# ---------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Cynos API")
api = APIRouter(prefix="/api")

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@cynos.in")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "cynos@admin2026")

bearer_scheme = HTTPBearer(auto_error=False)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": now_utc() + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_admin(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
):
    token = None
    if creds and creds.scheme.lower() == "bearer":
        token = creds.credentials
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return user


def slugify(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return s or str(uuid.uuid4())[:8]


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    original_price: float
    category: str  # men | women | couple | oversized | graphic | anime
    images: List[str] = Field(default_factory=list)
    sizes: List[str] = Field(default_factory=lambda: ["S", "M", "L", "XL", "XXL"])
    badges: List[str] = Field(default_factory=list)  # Trending, Limited Stock, New
    stock_count: int = 25
    is_bestseller: bool = False
    rating: float = 4.7
    review_count: int = 0


class ProductIn(ProductBase):
    pass


class Product(ProductBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    created_at: datetime = Field(default_factory=now_utc)


class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    size: str
    qty: int
    image: Optional[str] = None


class CustomerInfo(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    address_line1: str
    address_line2: Optional[str] = ""
    city: str
    state: str
    pincode: str


class OrderIn(BaseModel):
    customer: CustomerInfo
    items: List[OrderItem]
    payment_method: str  # cod | upi | card
    discount_code: Optional[str] = None


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer: CustomerInfo
    items: List[OrderItem]
    payment_method: str
    discount_code: Optional[str] = None
    subtotal: float
    discount_amount: float = 0
    shipping_fee: float = 0
    total: float
    status: str = "pending"  # pending | confirmed | shipped | delivered | cancelled
    created_at: datetime = Field(default_factory=now_utc)


class OrderStatusUpdate(BaseModel):
    status: str


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@api.post("/auth/login", response_model=TokenOut)
async def login(payload: LoginIn):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], user["email"])
    public_user = {k: v for k, v in user.items() if k not in {"password_hash"}}
    return {"access_token": token, "token_type": "bearer", "user": public_user}


@api.get("/auth/me")
async def me(admin=Depends(get_current_admin)):
    return admin


# ---------------------------------------------------------------------------
# Public product routes
# ---------------------------------------------------------------------------
@api.get("/products", response_model=List[Product])
async def list_products(
    category: Optional[str] = None,
    size: Optional[str] = None,
    sort: Optional[str] = "newest",
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    bestseller: Optional[bool] = None,
):
    q = {}
    if category and category != "all":
        q["category"] = category
    if size:
        q["sizes"] = size
    if bestseller:
        q["is_bestseller"] = True
    price_q = {}
    if min_price is not None:
        price_q["$gte"] = min_price
    if max_price is not None:
        price_q["$lte"] = max_price
    if price_q:
        q["price"] = price_q

    cursor = db.products.find(q, {"_id": 0})
    if sort == "price_asc":
        cursor = cursor.sort("price", 1)
    elif sort == "price_desc":
        cursor = cursor.sort("price", -1)
    elif sort == "best_selling":
        cursor = cursor.sort([("is_bestseller", -1), ("review_count", -1)])
    else:
        cursor = cursor.sort("created_at", -1)
    items = await cursor.to_list(200)
    for it in items:
        if isinstance(it.get("created_at"), str):
            it["created_at"] = datetime.fromisoformat(it["created_at"])
    return items


@api.get("/products/bestsellers", response_model=List[Product])
async def get_bestsellers():
    items = await db.products.find({"is_bestseller": True}, {"_id": 0}).to_list(20)
    for it in items:
        if isinstance(it.get("created_at"), str):
            it["created_at"] = datetime.fromisoformat(it["created_at"])
    return items


@api.get("/products/{slug}", response_model=Product)
async def get_product(slug: str):
    p = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(p.get("created_at"), str):
        p["created_at"] = datetime.fromisoformat(p["created_at"])
    return p


# ---------------------------------------------------------------------------
# Orders (guest)
# ---------------------------------------------------------------------------
def _calculate_totals(items: List[OrderItem], discount_code: Optional[str]):
    subtotal = sum(i.price * i.qty for i in items)
    # Buy 2 Get 1 Free across cart (cheapest qty becomes free per 3 items)
    qty_total = sum(i.qty for i in items)
    free_count = qty_total // 3
    discount_amount = 0.0
    if free_count > 0:
        # Build flat unit-price list, sort ascending, free cheapest
        flat = []
        for i in items:
            flat.extend([i.price] * i.qty)
        flat.sort()
        discount_amount += sum(flat[:free_count])
    if discount_code and discount_code.upper() == "CYNOS10":
        discount_amount += subtotal * 0.10
    discount_amount = min(discount_amount, subtotal)
    shipping_fee = 0.0  # Free shipping
    total = max(0.0, subtotal - discount_amount + shipping_fee)
    return round(subtotal, 2), round(discount_amount, 2), round(shipping_fee, 2), round(total, 2)


@api.post("/orders", response_model=Order)
async def create_order(payload: OrderIn, background: BackgroundTasks):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    subtotal, discount_amount, shipping_fee, total = _calculate_totals(
        payload.items, payload.discount_code
    )
    order = Order(
        customer=payload.customer,
        items=payload.items,
        payment_method=payload.payment_method,
        discount_code=payload.discount_code,
        subtotal=subtotal,
        discount_amount=discount_amount,
        shipping_fee=shipping_fee,
        total=total,
    )
    doc = order.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.orders.insert_one(doc)

    # Fire-and-forget email notifications (never blocks/breaks the order)
    email_payload = order.model_dump()
    email_payload["customer"] = order.customer.model_dump()
    email_payload["items"] = [i.model_dump() for i in order.items]
    background.add_task(send_order_emails, email_payload)

    return order


@api.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    o = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    if isinstance(o.get("created_at"), str):
        o["created_at"] = datetime.fromisoformat(o["created_at"])
    return o


# ---------------------------------------------------------------------------
# Admin routes
# ---------------------------------------------------------------------------
@api.get("/admin/products", response_model=List[Product])
async def admin_list_products(admin=Depends(get_current_admin)):
    items = await db.products.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for it in items:
        if isinstance(it.get("created_at"), str):
            it["created_at"] = datetime.fromisoformat(it["created_at"])
    return items


@api.post("/admin/products", response_model=Product)
async def admin_create_product(payload: ProductIn, admin=Depends(get_current_admin)):
    slug = slugify(payload.name)
    exists = await db.products.find_one({"slug": slug}, {"_id": 0})
    if exists:
        slug = f"{slug}-{str(uuid.uuid4())[:6]}"
    product = Product(slug=slug, **payload.model_dump())
    doc = product.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.products.insert_one(doc)
    return product


@api.put("/admin/products/{product_id}", response_model=Product)
async def admin_update_product(product_id: str, payload: ProductIn, admin=Depends(get_current_admin)):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    update = payload.model_dump()
    await db.products.update_one({"id": product_id}, {"$set": update})
    fresh = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(fresh.get("created_at"), str):
        fresh["created_at"] = datetime.fromisoformat(fresh["created_at"])
    return fresh


@api.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, admin=Depends(get_current_admin)):
    res = await db.products.delete_one({"id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


@api.get("/admin/orders", response_model=List[Order])
async def admin_list_orders(admin=Depends(get_current_admin)):
    items = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for it in items:
        if isinstance(it.get("created_at"), str):
            it["created_at"] = datetime.fromisoformat(it["created_at"])
    return items


@api.patch("/admin/orders/{order_id}", response_model=Order)
async def admin_update_order(order_id: str, payload: OrderStatusUpdate, admin=Depends(get_current_admin)):
    valid = {"pending", "confirmed", "shipped", "delivered", "cancelled"}
    if payload.status not in valid:
        raise HTTPException(status_code=400, detail="Invalid status")
    res = await db.orders.update_one({"id": order_id}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    o = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if isinstance(o.get("created_at"), str):
        o["created_at"] = datetime.fromisoformat(o["created_at"])
    return o


@api.get("/admin/stats")
async def admin_stats(admin=Depends(get_current_admin)):
    total_orders = await db.orders.count_documents({})
    total_products = await db.products.count_documents({})
    pending = await db.orders.count_documents({"status": "pending"})
    revenue_pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total"}}}]
    rev_doc = await db.orders.aggregate(revenue_pipeline).to_list(1)
    revenue = rev_doc[0]["total"] if rev_doc else 0
    return {
        "total_orders": total_orders,
        "total_products": total_products,
        "pending_orders": pending,
        "revenue": round(revenue, 2),
    }


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"app": "Cynos", "ok": True}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("cynos")


# ---------------------------------------------------------------------------
# Startup: indexes, seed admin, seed products
# ---------------------------------------------------------------------------
SAMPLE_PRODUCTS = [
    {
        "name": "Onyx Oversized Tee",
        "description": "Heavy 240 GSM premium cotton oversized tee. Drop-shoulder cut, garment-dyed for that lived-in streetwear feel. Wear it loud, wear it loose.",
        "price": 599, "original_price": 999, "category": "oversized",
        "images": [
            "https://images.pexels.com/photos/28758240/pexels-photo-28758240.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
            "https://images.pexels.com/photos/37014370/pexels-photo-37014370.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
            "https://images.unsplash.com/photo-1721352490417-3e96bbf0ba84?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHw0fHxvdmVyc2l6ZWQlMjBzdHJlZXR3ZWFyJTIwdC1zaGlydCUyMG1vZGVsJTIwZGFya3xlbnwwfHx8fDE3NzczMTQ2NTJ8MA&ixlib=rb-4.1.0&q=85",
        ],
        "badges": ["Trending"], "stock_count": 17, "is_bestseller": True,
        "rating": 4.8, "review_count": 248,
    },
    {
        "name": "Shadow Anime Tee",
        "description": "Anime-inspired graphic print on midnight black cotton. Limited drop. Once it's gone, it's gone.",
        "price": 649, "original_price": 1199, "category": "anime",
        "images": [
            "https://images.pexels.com/photos/9637851/pexels-photo-9637851.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
            "https://images.pexels.com/photos/28758240/pexels-photo-28758240.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
        ],
        "badges": ["Limited Stock"], "stock_count": 6, "is_bestseller": True,
        "rating": 4.9, "review_count": 312,
    },
    {
        "name": "Renegade Graphic Tee",
        "description": "Bold typographic statement print. 100% combed cotton. Loud loud silence.",
        "price": 549, "original_price": 999, "category": "graphic",
        "images": [
            "https://images.pexels.com/photos/37014370/pexels-photo-37014370.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
            "https://images.pexels.com/photos/28758240/pexels-photo-28758240.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
        ],
        "badges": ["Trending"], "stock_count": 28, "is_bestseller": True,
        "rating": 4.7, "review_count": 184,
    },
    {
        "name": "His & Hers Couple Tee Set",
        "description": "Matching couple tees crafted from soft 220 GSM cotton. Sold as a pair. Built for moments.",
        "price": 1099, "original_price": 1799, "category": "couple",
        "images": [
            "https://images.pexels.com/photos/11871927/pexels-photo-11871927.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
            "https://images.pexels.com/photos/28758240/pexels-photo-28758240.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
        ],
        "badges": ["Limited Stock"], "stock_count": 9, "is_bestseller": True,
        "rating": 4.9, "review_count": 156,
    },
    {
        "name": "Midnight Essential Tee",
        "description": "The black tee, perfected. Pre-shrunk premium cotton. Goes with literally everything.",
        "price": 499, "original_price": 899, "category": "men",
        "images": [
            "https://images.unsplash.com/photo-1721352490417-3e96bbf0ba84?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHw0fHxvdmVyc2l6ZWQlMjBzdHJlZXR3ZWFyJTIwdC1zaGlydCUyMG1vZGVsJTIwZGFya3xlbnwwfHx8fDE3NzczMTQ2NTJ8MA&ixlib=rb-4.1.0&q=85",
            "https://images.pexels.com/photos/28758240/pexels-photo-28758240.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
        ],
        "badges": ["New"], "stock_count": 42, "is_bestseller": True,
        "rating": 4.6, "review_count": 98,
    },
    {
        "name": "Eclipse Crop Tee",
        "description": "Boxy crop fit cut from breathable cotton. Made for the front row energy.",
        "price": 549, "original_price": 999, "category": "women",
        "images": [
            "https://images.unsplash.com/photo-1776466333828-bdf98c44eaf3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxkYXJrJTIwY2luZW1hdGljJTIwdXJiYW4lMjBmYXNoaW9uJTIwbmlnaHR8ZW58MHx8fHwxNzc3MzE0NjY2fDA&ixlib=rb-4.1.0&q=85",
            "https://images.pexels.com/photos/9637851/pexels-photo-9637851.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
        ],
        "badges": ["Trending"], "stock_count": 22, "is_bestseller": True,
        "rating": 4.8, "review_count": 211,
    },
    {
        "name": "Void Graphic Oversized",
        "description": "Heavyweight oversized fit with ink-black graphic. The kind of tee that walks into the room before you do.",
        "price": 699, "original_price": 1299, "category": "oversized",
        "images": [
            "https://images.pexels.com/photos/19101424/pexels-photo-19101424.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
            "https://images.pexels.com/photos/37014370/pexels-photo-37014370.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
        ],
        "badges": ["Limited Stock"], "stock_count": 4, "is_bestseller": True,
        "rating": 4.9, "review_count": 132,
    },
    {
        "name": "Static Mono Tee",
        "description": "Minimal mono print on washed cotton. Subtle attitude. Loud quality.",
        "price": 499, "original_price": 899, "category": "graphic",
        "images": [
            "https://images.pexels.com/photos/9637851/pexels-photo-9637851.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
            "https://images.pexels.com/photos/19101424/pexels-photo-19101424.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
        ],
        "badges": ["New"], "stock_count": 30, "is_bestseller": True,
        "rating": 4.5, "review_count": 64,
    },
]


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.products.create_index("slug", unique=True)
    await db.products.create_index("category")
    await db.orders.create_index("id", unique=True)

    # Seed admin
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Cynos Admin",
            "role": "admin",
            "created_at": now_utc().isoformat(),
        })
        logger.info(f"Seeded admin: {ADMIN_EMAIL}")
    else:
        if not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
            await db.users.update_one(
                {"email": ADMIN_EMAIL},
                {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}},
            )
            logger.info("Admin password rehashed")

    # Seed products if collection empty
    count = await db.products.count_documents({})
    if count == 0:
        for p in SAMPLE_PRODUCTS:
            slug = slugify(p["name"])
            doc = Product(slug=slug, **p).model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            await db.products.insert_one(doc)
        logger.info(f"Seeded {len(SAMPLE_PRODUCTS)} products")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
