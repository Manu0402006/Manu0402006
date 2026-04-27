import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check } from "lucide-react";

const STORAGE_KEY = "cynos_exit_seen_v1";

const ExitIntentPopup = () => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    let triggered = false;
    const onMouseLeave = (e) => {
      if (triggered) return;
      if (e.clientY < 10) {
        triggered = true;
        sessionStorage.setItem(STORAGE_KEY, "1");
        setOpen(true);
      }
    };
    // Mobile fallback: trigger after 30s if not seen
    const fallback = setTimeout(() => {
      if (!triggered && !sessionStorage.getItem(STORAGE_KEY)) {
        triggered = true;
        sessionStorage.setItem(STORAGE_KEY, "1");
        setOpen(true);
      }
    }, 30000);

    document.addEventListener("mouseout", onMouseLeave);
    return () => {
      document.removeEventListener("mouseout", onMouseLeave);
      clearTimeout(fallback);
    };
  }, []);

  const copy = async () => {
    try { await navigator.clipboard.writeText("CYNOS10"); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          data-testid="exit-intent-popup"
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-cynos-card border border-white/10 max-w-md w-full p-8"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="close"
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              data-testid="exit-popup-close"
            >
              <X size={20} />
            </button>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-cynos-red">Wait. Don't go.</div>
            <h3 className="font-anton text-4xl md:text-5xl uppercase mt-3 leading-[0.95]">
              10% off<br />your first<br />drop.
            </h3>
            <p className="text-sm text-zinc-400 mt-4">
              Use this code at checkout. Valid on your first order. Stack it with Buy 2 Get 1 Free.
            </p>
            <div className="mt-6 border border-dashed border-white/30 p-4 flex items-center justify-between">
              <span className="font-anton text-2xl tracking-wider">CYNOS10</span>
              <button
                onClick={copy}
                className="bg-white text-black px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] hover:bg-zinc-200 inline-flex items-center gap-2"
                data-testid="exit-popup-copy"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-full mt-6 bg-cynos-red text-white py-4 font-mono text-xs uppercase tracking-[0.2em] hover:bg-red-600 transition-colors"
              data-testid="exit-popup-shop"
            >
              Shop With 10% Off
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentPopup;
