import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Truck, Package } from "lucide-react";
import api from "../lib/api";
import { formatINR } from "../lib/utils-cynos";

const OrderSuccess = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data)).catch(() => setError("Order not found"));
  }, [id]);

  if (error) return <div className="pt-32 text-center font-mono text-cynos-red uppercase">{error}</div>;
  if (!order) return <div className="pt-32 text-center font-mono text-zinc-500 uppercase">Loading...</div>;

  return (
    <div className="pt-24 px-4 md:px-8 lg:px-12 pb-24 max-w-3xl mx-auto" data-testid="order-success-page">
      <div className="border border-white/10 bg-cynos-card p-8 md:p-12 text-center">
        <CheckCircle2 className="text-[#22C55E] mx-auto" size={56} />
        <h1 className="font-anton text-5xl md:text-6xl uppercase mt-4">Order Placed.</h1>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400 mt-2">
          Order ID: <span className="text-white">{order.id.slice(0, 8).toUpperCase()}</span>
        </p>
        <p className="text-zinc-300 mt-6 max-w-md mx-auto">
          Thanks {order.customer.full_name.split(" ")[0]}! We've received your order. A confirmation has been sent to {order.customer.email}.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 text-zinc-400 font-mono text-xs uppercase tracking-[0.2em]">
          <Truck size={14} /> Estimated delivery 3–6 business days
        </div>
      </div>

      <div className="mt-8 border border-white/10 bg-cynos-card p-6">
        <h3 className="font-anton text-2xl uppercase mb-4">Items</h3>
        <div className="space-y-3">
          {order.items.map((i, idx) => (
            <div key={idx} className="flex items-center gap-4">
              {i.image && <img src={i.image} alt={i.name} className="w-16 h-20 object-cover" />}
              <div className="flex-1">
                <div className="font-bold uppercase">{i.name}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">Size {i.size} · Qty {i.qty}</div>
              </div>
              <div className="font-anton text-lg">{formatINR(i.price * i.qty)}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 border-t border-white/10 pt-4 flex justify-between font-mono text-xs uppercase tracking-[0.2em]">
          <span>Total Paid</span><span className="text-white font-anton text-2xl">{formatINR(order.total)}</span>
        </div>
        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          Payment: {order.payment_method.toUpperCase()}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link to="/shop" className="bg-white text-black px-10 py-4 font-mono text-xs uppercase tracking-[0.2em] inline-block hover:bg-zinc-200" data-testid="continue-shopping-btn">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
