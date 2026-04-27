import React from "react";
import { Truck, IndianRupee, RotateCcw, ShieldCheck } from "lucide-react";

const items = [
  { icon: IndianRupee, label: "Cash on Delivery" },
  { icon: Truck, label: "Free Shipping" },
  { icon: RotateCcw, label: "Easy 7-Day Returns" },
  { icon: ShieldCheck, label: "100% Premium Cotton" },
];

const TrustBadges = () => (
  <section className="border-y border-white/10 bg-cynos-surface" data-testid="trust-badges">
    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10 border-x border-white/10">
      {items.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-3 px-6 py-6 md:py-8">
          <Icon className="text-cynos-red shrink-0" size={22} />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white">
            {label}
          </span>
        </div>
      ))}
    </div>
  </section>
);

export default TrustBadges;
