import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const STORAGE_KEY = "cynos_cart_v1";

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, size, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product_id === product.id && i.size === size);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [
        ...prev,
        {
          product_id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          original_price: product.original_price,
          image: product.images?.[0],
          size,
          qty,
        },
      ];
    });
    setOpen(true);
  };

  const updateQty = (product_id, size, qty) => {
    setItems((prev) => prev.map((i) => (i.product_id === product_id && i.size === size ? { ...i, qty: Math.max(1, qty) } : i)));
  };

  const removeItem = (product_id, size) => {
    setItems((prev) => prev.filter((i) => !(i.product_id === product_id && i.size === size)));
  };

  const clear = () => setItems([]);

  const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const totalQty = items.reduce((acc, i) => acc + i.qty, 0);
  const freeCount = Math.floor(totalQty / 3);
  let discount = 0;
  if (freeCount > 0) {
    const flat = [];
    items.forEach((i) => { for (let k = 0; k < i.qty; k++) flat.push(i.price); });
    flat.sort((a, b) => a - b);
    discount = flat.slice(0, freeCount).reduce((a, b) => a + b, 0);
  }
  const total = Math.max(0, subtotal - discount);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQty, removeItem, clear, subtotal, discount, total, totalQty, open, setOpen }}
    >
      {children}
    </CartContext.Provider>
  );
};
