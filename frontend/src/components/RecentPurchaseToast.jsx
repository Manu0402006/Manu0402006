import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const NAMES = ["Rahul from Delhi", "Priya from Mumbai", "Aarav from Bengaluru", "Sneha from Pune", "Karan from Hyderabad", "Ananya from Kolkata", "Vikram from Jaipur", "Meera from Chennai"];
const PRODUCTS = ["Onyx Oversized Tee", "Shadow Anime Tee", "Renegade Graphic Tee", "Couple Tee Set", "Midnight Essential Tee", "Eclipse Crop Tee"];

const RecentPurchaseToast = () => {
  const [visible, setVisible] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let timeout;
    const cycle = () => {
      setVisible(true);
      timeout = setTimeout(() => {
        setVisible(false);
        setIdx((i) => i + 1);
        setTimeout(cycle, 8000);
      }, 5000);
    };
    const initial = setTimeout(cycle, 6000);
    return () => { clearTimeout(initial); clearTimeout(timeout); };
  }, []);

  const name = NAMES[idx % NAMES.length];
  const product = PRODUCTS[idx % PRODUCTS.length];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30, x: -10 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-6 left-4 z-30 bg-cynos-card border border-white/10 max-w-xs hidden md:flex items-center gap-3 p-3 pr-10"
          data-testid="recent-purchase-toast"
        >
          <div className="w-12 h-12 bg-cynos-surface flex items-center justify-center font-anton text-2xl text-cynos-red">
            {name[0]}
          </div>
          <div className="flex-1">
            <div className="text-xs text-white">
              <span className="font-bold">{name}</span> just bought
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 mt-0.5 truncate">
              {product}
            </div>
          </div>
          <button onClick={() => setVisible(false)} className="absolute top-2 right-2 text-zinc-500 hover:text-white">
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RecentPurchaseToast;
