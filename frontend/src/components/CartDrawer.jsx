import React from "react";
import { Link } from "react-router-dom";
import { X, Trash2, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { formatINR } from "../lib/utils-cynos";

const CartDrawer = () => {
  const { open, setOpen, items, updateQty, removeItem, subtotal, discount, total } = useCart();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35 }}
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-cynos-bg border-l border-white/10 flex flex-col"
            data-testid="cart-drawer"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div>
                <h3 className="font-anton text-2xl uppercase">Your Cart</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{items.length} items</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="close" data-testid="cart-close-btn">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="text-center text-zinc-500 mt-16 font-mono text-xs uppercase tracking-[0.2em]">
                  Your cart is empty.
                </div>
              ) : (
                items.map((it) => (
                  <div key={`${it.product_id}-${it.size}`} className="flex gap-4 border border-white/10 bg-cynos-card p-3">
                    <img src={it.image} alt={it.name} className="w-20 h-24 object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold uppercase text-sm leading-tight truncate">{it.name}</h4>
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">Size: {it.size}</div>
                      <div className="font-anton text-lg mt-1">{formatINR(it.price)}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-white/20">
                          <button onClick={() => updateQty(it.product_id, it.size, it.qty - 1)} className="px-2 py-1 hover:bg-white/10" aria-label="decrease"><Minus size={12} /></button>
                          <span className="px-3 font-mono text-xs">{it.qty}</span>
                          <button onClick={() => updateQty(it.product_id, it.size, it.qty + 1)} className="px-2 py-1 hover:bg-white/10" aria-label="increase"><Plus size={12} /></button>
                        </div>
                        <button onClick={() => removeItem(it.product_id, it.size)} className="text-zinc-500 hover:text-cynos-red ml-auto" aria-label="remove">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-white/10 px-6 py-5 space-y-3 bg-cynos-bg">
              <div className="flex justify-between font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
                <span>Subtotal</span><span>{formatINR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between font-mono text-xs uppercase tracking-[0.2em] text-cynos-red">
                  <span>Buy 2 Get 1 Free</span><span>-{formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-xs uppercase tracking-[0.2em]">Total</span>
                <span className="font-anton text-2xl">{formatINR(total)}</span>
              </div>
              <Link
                to="/checkout"
                onClick={() => setOpen(false)}
                className={`block text-center w-full bg-cynos-red text-white py-4 font-mono text-xs uppercase tracking-[0.2em] hover:bg-red-600 transition-colors ${items.length === 0 ? "pointer-events-none opacity-40" : ""}`}
                data-testid="cart-checkout-btn"
              >
                Checkout
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
