import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Truck, IndianRupee, ShieldCheck } from "lucide-react";
import api from "../lib/api";
import { useCart } from "../context/CartContext";
import { formatINR } from "../lib/utils-cynos";

const Checkout = () => {
  const { items, subtotal, discount, total, clear } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [discountCode, setDiscountCode] = useState("");

  const [form, setForm] = useState({
    full_name: "", email: "", phone: "",
    address_line1: "", address_line2: "",
    city: "", state: "", pincode: "",
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        customer: form,
        items: items.map((i) => ({
          product_id: i.product_id, name: i.name, price: i.price,
          size: i.size, qty: i.qty, image: i.image,
        })),
        payment_method: paymentMethod,
        discount_code: discountCode || null,
      };
      const { data } = await api.post("/orders", payload);
      clear();
      navigate(`/order/${data.id}`);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Could not place order. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="pt-32 px-6 max-w-lg mx-auto text-center" data-testid="checkout-empty">
        <h1 className="font-anton text-5xl uppercase">Your cart is empty.</h1>
        <p className="text-zinc-400 mt-4">Add a tee first, then come back to check out.</p>
        <button onClick={() => navigate("/shop")} className="mt-8 bg-white text-black px-8 py-4 font-mono text-xs uppercase tracking-[0.2em]" data-testid="back-to-shop-btn">
          Browse Drops
        </button>
      </div>
    );
  }

  return (
    <div className="pt-24 px-4 md:px-8 lg:px-12 pb-24" data-testid="checkout-page">
      <h1 className="font-anton text-5xl md:text-7xl uppercase mb-2">Checkout.</h1>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 mb-12">Guest checkout · No account needed</p>

      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
        <div className="space-y-10">
          {/* CONTACT */}
          <Section title="01 / Contact">
            <Field label="Full Name" required value={form.full_name} onChange={(v) => update("full_name", v)} testid="full-name" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Email" type="email" required value={form.email} onChange={(v) => update("email", v)} testid="email" />
              <Field label="Phone" type="tel" required value={form.phone} onChange={(v) => update("phone", v)} testid="phone" />
            </div>
          </Section>

          {/* ADDRESS */}
          <Section title="02 / Shipping Address">
            <Field label="Address Line 1" required value={form.address_line1} onChange={(v) => update("address_line1", v)} testid="addr1" />
            <Field label="Address Line 2 (optional)" value={form.address_line2} onChange={(v) => update("address_line2", v)} testid="addr2" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="City" required value={form.city} onChange={(v) => update("city", v)} testid="city" />
              <Field label="State" required value={form.state} onChange={(v) => update("state", v)} testid="state" />
              <Field label="Pincode" required value={form.pincode} onChange={(v) => update("pincode", v)} testid="pincode" />
            </div>
          </Section>

          {/* PAYMENT */}
          <Section title="03 / Payment">
            <div className="space-y-2" data-testid="payment-methods">
              <PayOption value="cod" current={paymentMethod} onChange={setPaymentMethod} title="Cash on Delivery" desc="Pay when it arrives. ₹0 extra fee." />
              <PayOption value="upi" current={paymentMethod} onChange={setPaymentMethod} title="UPI" desc="GPay · PhonePe · Paytm · Any UPI app" />
              <PayOption value="card" current={paymentMethod} onChange={setPaymentMethod} title="Credit / Debit Card" desc="Visa · Mastercard · Rupay · Amex" />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-3">
              Online payments are placeholder (Razorpay integration ready — provide test keys to enable).
            </p>
          </Section>
        </div>

        {/* SUMMARY */}
        <aside className="bg-cynos-card border border-white/10 p-6 h-fit lg:sticky lg:top-24" data-testid="order-summary">
          <h3 className="font-anton text-2xl uppercase mb-4">Order Summary</h3>
          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {items.map((i) => (
              <div key={`${i.product_id}-${i.size}`} className="flex gap-3 items-center">
                <div className="relative">
                  <img src={i.image} alt={i.name} className="w-14 h-16 object-cover" />
                  <span className="absolute -top-1 -right-1 bg-cynos-red text-white text-[10px] font-mono px-1">{i.qty}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold uppercase truncate">{i.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Size {i.size}</div>
                </div>
                <div className="font-anton">{formatINR(i.price * i.qty)}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <input
              type="text"
              placeholder="DISCOUNT CODE"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              className="flex-1 bg-cynos-surface border border-white/15 px-3 py-3 font-mono text-xs uppercase tracking-[0.2em]"
              data-testid="discount-input"
            />
            <button type="button" className="border border-white/30 px-4 font-mono text-xs uppercase">Apply</button>
          </div>

          <div className="mt-6 space-y-2 border-t border-white/10 pt-4 font-mono text-xs uppercase tracking-[0.2em]">
            <Line label="Subtotal" value={formatINR(subtotal)} />
            {discount > 0 && <Line label="Discount" value={`-${formatINR(discount)}`} accent />}
            <Line label="Shipping" value="Free" />
          </div>
          <div className="mt-4 flex justify-between items-baseline border-t border-white/10 pt-4">
            <span className="font-mono text-xs uppercase tracking-[0.2em]">Total</span>
            <span className="font-anton text-3xl">{formatINR(total)}</span>
          </div>

          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 inline-flex items-center gap-2">
            <Truck size={12} /> Estimated delivery: 3–6 business days
          </p>

          {error && <div className="mt-4 text-cynos-red font-mono text-xs uppercase tracking-[0.2em]">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full bg-cynos-red text-white py-5 font-mono text-xs uppercase tracking-[0.2em] hover:bg-red-600 transition-colors disabled:opacity-50"
            data-testid="place-order-btn"
          >
            {submitting ? "Placing order..." : `Place Order · ${formatINR(total)}`}
          </button>

          <div className="mt-4 grid grid-cols-3 gap-2 text-zinc-400">
            <TrustItem icon={IndianRupee} label="COD" />
            <TrustItem icon={ShieldCheck} label="Secure" />
            <TrustItem icon={Truck} label="Free Ship" />
          </div>
        </aside>
      </form>
    </div>
  );
};

const Section = ({ title, children }) => (
  <section className="bg-cynos-card border border-white/10 p-6">
    <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-cynos-red mb-4">{title}</h2>
    <div className="space-y-3">{children}</div>
  </section>
);

const Field = ({ label, type = "text", required, value, onChange, testid }) => (
  <label className="block">
    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">{label}{required && " *"}</span>
    <input
      type={type}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full bg-cynos-surface border border-white/15 px-3 py-3 text-white focus:border-white focus:outline-none transition-colors"
      data-testid={`field-${testid}`}
    />
  </label>
);

const PayOption = ({ value, current, onChange, title, desc }) => (
  <button
    type="button"
    onClick={() => onChange(value)}
    className={`w-full text-left border p-4 transition-colors ${
      current === value ? "border-white bg-cynos-surface" : "border-white/10 hover:border-white/40"
    }`}
    data-testid={`pay-${value}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="font-bold uppercase">{title}</div>
        <div className="text-xs text-zinc-400">{desc}</div>
      </div>
      <div className={`w-4 h-4 border ${current === value ? "border-cynos-red bg-cynos-red" : "border-white/30"}`} />
    </div>
  </button>
);

const Line = ({ label, value, accent }) => (
  <div className="flex justify-between">
    <span className="text-zinc-400">{label}</span>
    <span className={accent ? "text-cynos-red" : "text-white"}>{value}</span>
  </div>
);

const TrustItem = ({ icon: Icon, label }) => (
  <div className="flex flex-col items-center gap-1 border border-white/10 p-2">
    <Icon size={14} className="text-cynos-red" />
    <span className="font-mono text-[9px] uppercase tracking-[0.2em]">{label}</span>
  </div>
);

export default Checkout;
