import React from "react";
import { Link } from "react-router-dom";
import { formatINR, calcDiscountPct } from "../lib/utils-cynos";

const Badge = ({ label }) => {
  const isLimited = label.toLowerCase().includes("limited");
  return (
    <span
      className={`font-mono text-[10px] uppercase tracking-[0.2em] px-2 py-1 ${
        isLimited ? "bg-cynos-red text-white" : "bg-white text-black"
      }`}
    >
      {label}
    </span>
  );
};

const ProductCard = ({ product }) => {
  const pct = calcDiscountPct(product.price, product.original_price);
  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block bg-cynos-card border border-white/10 hover:border-white transition-colors"
      data-testid={`product-card-${product.slug}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-cynos-surface">
        <img
          src={product.images?.[0]}
          alt={product.name}
          className="w-full h-full object-cover zoom-on-hover"
          loading="lazy"
        />
        {product.images?.[1] && (
          <img
            src={product.images[1]}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            loading="lazy"
          />
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.badges?.map((b) => <Badge key={b} label={b} />)}
        </div>
        {pct > 0 && (
          <div className="absolute top-3 right-3 font-mono text-[10px] uppercase tracking-[0.2em] bg-black text-white px-2 py-1 border border-white/30">
            -{pct}%
          </div>
        )}
        {product.stock_count <= 10 && (
          <div className="absolute bottom-3 left-3 right-3 bg-black/80 backdrop-blur px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-cynos-red border border-cynos-red/40">
            Only {product.stock_count} left
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          {product.category}
        </div>
        <h3 className="mt-1 font-bold text-base md:text-lg uppercase tracking-tight">
          {product.name}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-anton text-xl">{formatINR(product.price)}</span>
          {product.original_price > product.price && (
            <span className="text-zinc-500 line-through text-sm">{formatINR(product.original_price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
