import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../lib/api";
import ProductCard from "../components/ProductCard";
import { CATEGORIES } from "../lib/utils-cynos";

const SIZES = ["S", "M", "L", "XL", "XXL"];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "all";
  const [products, setProducts] = useState([]);
  const [size, setSize] = useState("");
  const [sort, setSort] = useState("newest");
  const [maxPrice, setMaxPrice] = useState(2000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (category && category !== "all") params.category = category;
    if (size) params.size = size;
    if (sort) params.sort = sort;
    if (maxPrice && maxPrice < 2000) params.max_price = maxPrice;
    api.get("/products", { params })
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false));
  }, [category, size, sort, maxPrice]);

  const setCategory = (c) => {
    if (c === "all") setSearchParams({});
    else setSearchParams({ category: c });
  };

  return (
    <div className="pt-24 px-4 md:px-8 lg:px-12 pb-24" data-testid="shop-page">
      <div className="mb-10 md:mb-14">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-cynos-red">Collection</span>
        <h1 className="font-anton text-6xl md:text-8xl uppercase mt-2 leading-none">
          {category === "all" ? "All Drops." : (CATEGORIES.find(c => c.slug === category)?.label || category) + "."}
        </h1>
        <p className="text-zinc-400 mt-4 max-w-xl">{products.length} products · Free shipping on every order</p>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-8 -mx-1" data-testid="cat-chips">
        <CatChip active={category === "all"} onClick={() => setCategory("all")} label="All" testid="chip-all" />
        {CATEGORIES.map((c) => (
          <CatChip key={c.slug} active={category === c.slug} onClick={() => setCategory(c.slug)} label={c.label} testid={`chip-${c.slug}`} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
        {/* FILTERS */}
        <aside className="space-y-8" data-testid="filters">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] mb-3 text-zinc-400">Size</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSize("")} className={`px-3 py-2 border font-mono text-xs ${size === "" ? "bg-white text-black border-white" : "border-white/20 hover:border-white"}`} data-testid="size-all">All</button>
              {SIZES.map((s) => (
                <button key={s} onClick={() => setSize(s)} className={`px-3 py-2 border font-mono text-xs ${size === s ? "bg-white text-black border-white" : "border-white/20 hover:border-white"}`} data-testid={`size-${s}`}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] mb-3 text-zinc-400">Max Price · ₹{maxPrice}</h3>
            <input
              type="range"
              min="299"
              max="2000"
              step="50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
              className="w-full accent-cynos-red"
              data-testid="price-slider"
            />
          </div>
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] mb-3 text-zinc-400">Sort</h3>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full bg-cynos-surface border border-white/15 px-3 py-3 text-sm uppercase font-mono"
              data-testid="sort-select"
            >
              <option value="newest">Newest</option>
              <option value="best_selling">Best Selling</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </aside>

        {/* GRID */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/5] bg-cynos-surface animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">No products found.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CatChip = ({ active, onClick, label, testid }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 border font-mono text-xs uppercase tracking-[0.2em] transition-colors ${
      active ? "bg-cynos-red text-white border-cynos-red" : "border-white/20 hover:border-white"
    }`}
    data-testid={testid}
  >
    {label}
  </button>
);

export default Shop;
