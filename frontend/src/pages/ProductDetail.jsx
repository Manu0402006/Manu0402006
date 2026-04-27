import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Truck, IndianRupee, RotateCcw, ShieldCheck, Star, ChevronDown, Plus, Minus, Ruler } from "lucide-react";
import api from "../lib/api";
import { useCart } from "../context/CartContext";
import { formatINR, calcDiscountPct } from "../lib/utils-cynos";
import CountdownTimer from "../components/CountdownTimer";
import ProductCard from "../components/ProductCard";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "../components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "../components/ui/accordion";

const FAQS = [
  { q: "What's the fabric quality?", a: "240 GSM premium combed cotton, pre-shrunk and bio-washed for that lived-in feel." },
  { q: "How long does delivery take?", a: "3–6 business days across India. Free shipping on every order. COD available." },
  { q: "What's your return policy?", a: "Easy 7-day returns. Just keep tags intact. Refund processed within 5 business days." },
  { q: "How does the size run?", a: "We run true-to-size, oversized fits run 1 size larger. Refer to the size guide above." },
];

const REVIEWS = [
  { name: "Vikram J.", rating: 5, body: "Quality is unreal at this price. Already ordered my 4th tee.", img: "https://images.pexels.com/photos/19101424/pexels-photo-19101424.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=300" },
  { name: "Sneha P.", rating: 5, body: "Fits like a dream and the print quality is sharp. Delivery was fast.", img: "https://images.pexels.com/photos/9637851/pexels-photo-9637851.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=300" },
  { name: "Rohan T.", rating: 4, body: "Heavy fabric, drops perfectly. Anime print is fire.", img: "https://images.pexels.com/photos/28758240/pexels-photo-28758240.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=300" },
];

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [related, setRelated] = useState([]);
  const { addItem } = useCart();

  useEffect(() => {
    setProduct(null);
    setActiveImg(0);
    setSize("");
    api.get(`/products/${slug}`).then(({ data }) => {
      setProduct(data);
      setSize(data.sizes?.[1] || "M");
      api.get("/products", { params: { category: data.category } })
        .then(({ data: list }) => setRelated(list.filter(p => p.slug !== slug).slice(0, 4)));
    });
  }, [slug]);

  if (!product) return <div className="pt-32 px-6 font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">Loading drop...</div>;

  const pct = calcDiscountPct(product.price, product.original_price);

  const handleAddToCart = () => {
    if (!size) return;
    addItem(product, size, qty);
  };

  const handleBuyNow = () => {
    if (!size) return;
    addItem(product, size, qty);
    setTimeout(() => { window.location.href = "/checkout"; }, 100);
  };

  return (
    <div className="pt-20 pb-32 md:pb-24" data-testid="product-detail-page">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-10 px-0 md:px-8 lg:px-12">
        {/* GALLERY */}
        <div className="md:sticky md:top-24 md:self-start">
          <div className="aspect-[4/5] bg-cynos-surface overflow-hidden">
            <motion.img
              key={activeImg}
              src={product.images[activeImg]}
              alt={product.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2 px-4 md:px-0">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`aspect-[4/5] overflow-hidden border ${i === activeImg ? "border-cynos-red" : "border-white/10"}`}
                data-testid={`thumb-${i}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* INFO */}
        <div className="px-4 md:px-0 mt-8 md:mt-0">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-cynos-red">{product.category}</div>
          <h1 className="font-anton text-5xl md:text-6xl uppercase tracking-tight mt-2 leading-none">{product.name}</h1>

          <div className="flex items-center gap-2 mt-4">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < Math.round(product.rating) ? "#FF3333" : "transparent"} stroke="#FF3333" />)}
            </div>
            <span className="font-mono text-xs text-zinc-400">{product.rating} ({product.review_count} reviews)</span>
          </div>

          <div className="flex items-baseline gap-3 mt-6">
            <span className="font-anton text-4xl">{formatINR(product.price)}</span>
            {product.original_price > product.price && (
              <>
                <span className="text-zinc-500 line-through text-lg">{formatINR(product.original_price)}</span>
                <span className="bg-cynos-red text-white px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em]">-{pct}% Off</span>
              </>
            )}
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">Inclusive of all taxes</p>

          <div className="mt-4">
            <CountdownTimer />
          </div>

          {product.stock_count <= 10 && (
            <div className="mt-4 border border-cynos-red/40 bg-cynos-red/10 text-cynos-red px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em]" data-testid="stock-urgency">
              ⚡ Only {product.stock_count} left in stock — restocking unlikely
            </div>
          )}

          <p className="text-zinc-300 mt-6 leading-relaxed">{product.description}</p>

          {/* SIZE */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs uppercase tracking-[0.2em]">Select Size</span>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="font-mono text-xs uppercase tracking-[0.2em] underline underline-offset-4 inline-flex items-center gap-1 hover:text-cynos-red" data-testid="size-guide-trigger">
                    <Ruler size={12} /> Size Guide
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-cynos-card border-white/10 rounded-none max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-anton text-3xl uppercase">Size Guide</DialogTitle>
                  </DialogHeader>
                  <div className="text-sm">
                    <table className="w-full text-left border-collapse">
                      <thead className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">
                        <tr><th className="py-2 border-b border-white/10">Size</th><th className="border-b border-white/10">Chest (in)</th><th className="border-b border-white/10">Length (in)</th></tr>
                      </thead>
                      <tbody>
                        {[["S", "38", "27"], ["M", "40", "28"], ["L", "42", "29"], ["XL", "44", "30"], ["XXL", "46", "31"]].map((row) => (
                          <tr key={row[0]} className="border-b border-white/10"><td className="py-2 font-bold">{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td></tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-zinc-400 mt-4 text-xs">Measurements taken from a flat-lay. Allow ±0.5 inch tolerance.</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex gap-2 flex-wrap" data-testid="size-selector">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`min-w-[56px] py-3 px-4 border font-mono text-sm ${size === s ? "bg-white text-black border-white" : "border-white/20 hover:border-white"}`}
                  data-testid={`size-opt-${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* QTY */}
          <div className="mt-6 flex items-center gap-4">
            <span className="font-mono text-xs uppercase tracking-[0.2em]">Qty</span>
            <div className="flex items-center border border-white/20">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-3 hover:bg-white/10" aria-label="decrease"><Minus size={14} /></button>
              <span className="px-5 font-mono">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-4 py-3 hover:bg-white/10" aria-label="increase"><Plus size={14} /></button>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              onClick={handleAddToCart}
              className="border border-white text-white py-4 font-mono text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors"
              data-testid="add-to-cart-btn"
            >
              Add To Cart
            </button>
            <button
              onClick={handleBuyNow}
              className="bg-cynos-red text-white py-4 font-mono text-xs uppercase tracking-[0.2em] hover:bg-red-600 transition-colors"
              data-testid="buy-now-btn"
            >
              Buy Now
            </button>
          </div>

          {/* TRUST BADGES */}
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
            <TrustItem icon={IndianRupee} label="Cash on Delivery" />
            <TrustItem icon={Truck} label="Free Shipping" />
            <TrustItem icon={RotateCcw} label="Easy 7-Day Returns" />
            <TrustItem icon={ShieldCheck} label="Secure Checkout" />
          </div>

          {/* FAQ */}
          <div className="mt-12">
            <h3 className="font-anton text-3xl uppercase mb-4">FAQ</h3>
            <Accordion type="single" collapsible className="border-t border-white/10">
              {FAQS.map((f, i) => (
                <AccordionItem key={i} value={`f${i}`} className="border-b border-white/10">
                  <AccordionTrigger className="font-bold uppercase tracking-tight text-left text-base hover:no-underline" data-testid={`faq-${i}`}>{f.q}</AccordionTrigger>
                  <AccordionContent className="text-zinc-400 text-sm">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <section className="px-4 md:px-8 lg:px-12 mt-20" data-testid="product-reviews">
        <h2 className="font-anton text-4xl md:text-5xl uppercase mb-8">Customer Photos & Reviews</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {REVIEWS.map((r) => (
            <div key={r.name} className="bg-cynos-card border border-white/10 overflow-hidden">
              <img src={r.img} alt={r.name} className="w-full aspect-square object-cover" />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase text-sm">{r.name}</span>
                  <div className="flex gap-0.5">
                    {[...Array(r.rating)].map((_, i) => <Star key={i} size={12} fill="#FF3333" stroke="#FF3333" />)}
                  </div>
                </div>
                <p className="text-zinc-300 mt-2 text-sm">"{r.body}"</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* RELATED */}
      {related.length > 0 && (
        <section className="px-4 md:px-8 lg:px-12 mt-20" data-testid="related-products">
          <h2 className="font-anton text-4xl md:text-5xl uppercase mb-8">You Might Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* STICKY MOBILE BAR */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-black border-t border-white/10 p-3 grid grid-cols-[auto_1fr] gap-3 items-center" data-testid="sticky-mobile-bar">
        <div>
          <div className="font-anton text-xl leading-none">{formatINR(product.price)}</div>
          {product.original_price > product.price && (
            <div className="font-mono text-[10px] text-zinc-500 line-through">{formatINR(product.original_price)}</div>
          )}
        </div>
        <button onClick={handleBuyNow} className="bg-cynos-red text-white py-4 font-mono text-xs uppercase tracking-[0.2em]" data-testid="sticky-buy-now-btn">
          Buy Now · Size {size || "M"}
        </button>
      </div>
    </div>
  );
};

const TrustItem = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2">
    <Icon className="text-cynos-red" size={16} />
    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-300">{label}</span>
  </div>
);

export default ProductDetail;
