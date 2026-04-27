import React, { useEffect, useState } from "react";

const TARGET_HOURS = 12;

const CountdownTimer = ({ label = "Sale ends in" }) => {
  const [end] = useState(() => {
    const stored = localStorage.getItem("cynos_sale_end");
    if (stored) {
      const t = parseInt(stored, 10);
      if (t > Date.now()) return t;
    }
    const t = Date.now() + TARGET_HOURS * 3600 * 1000;
    localStorage.setItem("cynos_sale_end", String(t));
    return t;
  });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  let diff = Math.max(0, end - now);
  const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
  diff %= 3600000;
  const m = String(Math.floor(diff / 60000)).padStart(2, "0");
  diff %= 60000;
  const s = String(Math.floor(diff / 1000)).padStart(2, "0");

  return (
    <div className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em]" data-testid="countdown-timer">
      <span className="text-zinc-400">{label}</span>
      <span className="text-cynos-red font-bold text-base">{h}:{m}:{s}</span>
    </div>
  );
};

export default CountdownTimer;
