import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { LogOut, Plus, Edit, Trash2, Package, ShoppingBag, IndianRupee, Clock } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { formatINR, CATEGORIES } from "../lib/utils-cynos";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const AdminDashboard = () => {
  const { admin, checking, logout } = useAuth();
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);

  const refresh = async () => {
    const [o, p, s] = await Promise.all([
      api.get("/admin/orders"),
      api.get("/admin/products"),
      api.get("/admin/stats"),
    ]);
    setOrders(o.data); setProducts(p.data); setStats(s.data);
  };

  useEffect(() => { if (admin) refresh(); }, [admin]);

  if (checking) return <div className="pt-32 text-center font-mono text-zinc-500 uppercase">Authenticating...</div>;
  if (!admin) return <Navigate to="/admin/login" replace />;

  const updateOrderStatus = async (id, status) => {
    await api.patch(`/admin/orders/${id}`, { status });
    refresh();
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    await api.delete(`/admin/products/${id}`);
    refresh();
  };

  return (
    <div className="min-h-screen bg-cynos-bg" data-testid="admin-dashboard">
      <header className="border-b border-white/10 bg-black px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-anton text-2xl uppercase">CYNOS<span className="text-cynos-red">.</span></Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs hidden md:inline">{admin.email}</span>
          <button onClick={logout} className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] hover:text-cynos-red" data-testid="admin-logout">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <div className="px-4 md:px-8 py-8">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8" data-testid="admin-stats">
            <Stat icon={ShoppingBag} label="Orders" value={stats.total_orders} />
            <Stat icon={Clock} label="Pending" value={stats.pending_orders} accent />
            <Stat icon={Package} label="Products" value={stats.total_products} />
            <Stat icon={IndianRupee} label="Revenue" value={formatINR(stats.revenue)} />
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <TabBtn active={tab === "orders"} onClick={() => setTab("orders")} testid="tab-orders">Orders</TabBtn>
          <TabBtn active={tab === "products"} onClick={() => setTab("products")} testid="tab-products">Products</TabBtn>
        </div>

        {tab === "orders" ? (
          <OrdersTable orders={orders} onStatusChange={updateOrderStatus} />
        ) : (
          <ProductsTable products={products} onDelete={deleteProduct} onSaved={refresh} />
        )}
      </div>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value, accent }) => (
  <div className={`bg-cynos-card border p-5 ${accent ? "border-cynos-red/40" : "border-white/10"}`}>
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">{label}</span>
      <Icon size={16} className={accent ? "text-cynos-red" : "text-zinc-500"} />
    </div>
    <div className="font-anton text-3xl mt-2">{value}</div>
  </div>
);

const TabBtn = ({ active, onClick, children, testid }) => (
  <button onClick={onClick} className={`px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] border ${active ? "bg-white text-black border-white" : "border-white/15 hover:border-white"}`} data-testid={testid}>
    {children}
  </button>
);

const OrdersTable = ({ orders, onStatusChange }) => (
  <div className="bg-cynos-card border border-white/10 overflow-x-auto" data-testid="orders-table">
    <table className="w-full text-sm">
      <thead className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 border-b border-white/10">
        <tr>
          <th className="text-left p-4">Order</th>
          <th className="text-left p-4">Customer</th>
          <th className="text-left p-4">Items</th>
          <th className="text-left p-4">Total</th>
          <th className="text-left p-4">Payment</th>
          <th className="text-left p-4">Status</th>
        </tr>
      </thead>
      <tbody>
        {orders.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-zinc-500 font-mono text-xs uppercase tracking-[0.2em]">No orders yet</td></tr>}
        {orders.map((o) => (
          <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.03]">
            <td className="p-4 font-mono text-xs uppercase">{o.id.slice(0, 8)}</td>
            <td className="p-4">
              <div className="font-bold">{o.customer.full_name}</div>
              <div className="text-xs text-zinc-400">{o.customer.city}, {o.customer.state}</div>
            </td>
            <td className="p-4">{o.items.length}</td>
            <td className="p-4 font-anton text-lg">{formatINR(o.total)}</td>
            <td className="p-4 font-mono text-xs uppercase">{o.payment_method}</td>
            <td className="p-4">
              <Select value={o.status} onValueChange={(v) => onStatusChange(o.id, v)}>
                <SelectTrigger className="w-[140px] bg-cynos-surface border-white/15 rounded-none" data-testid={`status-${o.id.slice(0,8)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-cynos-card border-white/15 rounded-none">
                  {STATUSES.map((s) => <SelectItem key={s} value={s} className="uppercase font-mono text-xs">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const emptyProduct = {
  name: "", description: "", price: 599, original_price: 999,
  category: "men", images: [""], sizes: ["S","M","L","XL","XXL"], badges: [], stock_count: 25,
  is_bestseller: false, rating: 4.7, review_count: 0,
};

const ProductsTable = ({ products, onDelete, onSaved }) => {
  const [editing, setEditing] = useState(null); // null | {} | product

  return (
    <div className="space-y-4" data-testid="products-table">
      <div className="flex justify-end">
        <button
          onClick={() => setEditing(emptyProduct)}
          className="bg-cynos-red text-white px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] inline-flex items-center gap-2 hover:bg-red-600"
          data-testid="add-product-btn"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>
      <div className="bg-cynos-card border border-white/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 border-b border-white/10">
            <tr>
              <th className="text-left p-4">Image</th>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Price</th>
              <th className="text-left p-4">Stock</th>
              <th className="text-left p-4">Bestseller</th>
              <th className="text-left p-4"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-white/5">
                <td className="p-4"><img src={p.images?.[0]} alt="" className="w-12 h-14 object-cover" /></td>
                <td className="p-4 font-bold uppercase">{p.name}</td>
                <td className="p-4 uppercase font-mono text-xs">{p.category}</td>
                <td className="p-4 font-anton">{formatINR(p.price)}</td>
                <td className="p-4 font-mono text-xs">{p.stock_count}</td>
                <td className="p-4 font-mono text-xs">{p.is_bestseller ? "YES" : "—"}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => setEditing(p)} className="border border-white/20 p-2 hover:border-white" data-testid={`edit-${p.slug}`}><Edit size={14} /></button>
                  <button onClick={() => onDelete(p.id)} className="border border-cynos-red/40 text-cynos-red p-2 hover:border-cynos-red" data-testid={`delete-${p.slug}`}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); onSaved(); }}
        />
      )}
    </div>
  );
};

const ProductDialog = ({ initial, onClose, onSaved }) => {
  const [data, setData] = useState({ ...initial, images: initial.images || [""] });
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial.id;
  const update = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: data.name, description: data.description,
        price: Number(data.price), original_price: Number(data.original_price),
        category: data.category,
        images: data.images.filter(Boolean),
        sizes: data.sizes,
        badges: data.badges,
        stock_count: Number(data.stock_count),
        is_bestseller: !!data.is_bestseller,
        rating: Number(data.rating || 4.7),
        review_count: Number(data.review_count || 0),
        qikink_sku: data.qikink_sku || "",
        qikink_designs: data.qikink_designs || [],
      };
      if (isEdit) await api.put(`/admin/products/${initial.id}`, payload);
      else await api.post("/admin/products", payload);
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-cynos-card border-white/10 rounded-none max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-anton text-3xl uppercase">{isEdit ? "Edit" : "New"} Product</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input label="Name" value={data.name} onChange={(v) => update("name", v)} testid="prod-name" />
          <Textarea label="Description" value={data.description} onChange={(v) => update("description", v)} testid="prod-desc" />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Price (₹)" type="number" value={data.price} onChange={(v) => update("price", v)} testid="prod-price" />
            <Input label="Original (₹)" type="number" value={data.original_price} onChange={(v) => update("original_price", v)} testid="prod-orig" />
            <Input label="Stock" type="number" value={data.stock_count} onChange={(v) => update("stock_count", v)} testid="prod-stock" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">Category</span>
            <select value={data.category} onChange={(e) => update("category", e.target.value)} className="mt-1 w-full bg-cynos-surface border border-white/15 px-3 py-3" data-testid="prod-cat">
              {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">Image URLs (one per line)</span>
            <textarea
              value={data.images.join("\n")}
              onChange={(e) => update("images", e.target.value.split("\n"))}
              rows={3}
              className="mt-1 w-full bg-cynos-surface border border-white/15 px-3 py-3 font-mono text-xs"
              data-testid="prod-images"
            />
          </div>
          <Input label="Badges (comma-separated, e.g. Trending, Limited Stock)" value={data.badges.join(", ")} onChange={(v) => update("badges", v.split(",").map(s => s.trim()).filter(Boolean))} testid="prod-badges" />
          <div className="border-t border-white/10 pt-3 mt-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cynos-red mb-2">Qikink Fulfilment</div>
            <Input label="Qikink SKU (from your Qikink dashboard catalog)" value={data.qikink_sku || ""} onChange={(v) => update("qikink_sku", v)} testid="prod-qikink-sku" />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">
              Leave empty to skip Qikink for this product. Add the SKU once you've created the product in dashboard.qikink.com.
            </p>
          </div>
          <label className="flex items-center gap-2 mt-2">
            <input type="checkbox" checked={!!data.is_bestseller} onChange={(e) => update("is_bestseller", e.target.checked)} className="accent-cynos-red w-4 h-4" data-testid="prod-bestseller" />
            <span className="font-mono text-xs uppercase tracking-[0.2em]">Mark as bestseller</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="border border-white/20 px-5 py-3 font-mono text-xs uppercase tracking-[0.2em]" data-testid="prod-cancel">Cancel</button>
          <button onClick={save} disabled={saving} className="bg-cynos-red text-white px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] hover:bg-red-600 disabled:opacity-50" data-testid="prod-save">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Input = ({ label, value, onChange, type = "text", testid }) => (
  <label className="block">
    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">{label}</span>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full bg-cynos-surface border border-white/15 px-3 py-3 outline-none focus:border-white" data-testid={testid} />
  </label>
);

const Textarea = ({ label, value, onChange, testid }) => (
  <label className="block">
    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">{label}</span>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="mt-1 w-full bg-cynos-surface border border-white/15 px-3 py-3 outline-none focus:border-white" data-testid={testid} />
  </label>
);

export default AdminDashboard;
