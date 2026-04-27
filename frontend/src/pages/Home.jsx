import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import api from "../lib/api";
import ProductCard from "../components/ProductCard";
import TrustBadges from "../components/TrustBadges";
import OfferMarquee from "../components/OfferMarquee";
import { CATEGORIES } from "../lib/utils-cynos";

const HERO_IMG = "https://images.unsplash.com/photo-1763750581767-b367bcd6c117?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwxfHxvdmVyc2l6ZWQlMjBzdHJlZXR3ZWFyJTIwdC1zaGlydCUyMG1vZGVsJTIwZGFya3xlbnwwfHx8fDE3NzczMTQ2NTJ8MA&ixlib=rb-4.1.0&q=85";

const CATEGORY_IMAGES = {
  men: "https://images.unsplash.com/photo-1721352490417-3e96bbf0ba84?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHw0fHxvdmVyc2l6ZWQlMjBzdHJlZXR3ZWFyJTIwdC1zaGlydCUyMG1vZGVsJTIwZGFya3xlbnwwfHx8fDE3NzczMTQ2NTJ8MA&ixlib=rb-4.1.0&q=85",
  women: "https://images.unsplash.com/photo-1776466333828-bdf98c44eaf3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxkYXJrJTIwY2luZW1hdGljJTIwdXJiYW4lMjBmYXNoaW9uJTIwbmlnaHR8ZW58MHx8fHwxNzc3MzE0NjY2fDA&ixlib=rb-4.1.0&q=85",
  couple: "https://images.pexels.com/photos/11871927/pexels-photo-11871927.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
  oversized: "https://images.pexels.com/photos/28758240/pexels-photo-28758240.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
  graphic: "https://images.pexels.com/photos/37014370/pexels-photo-37014370.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
  anime: "https://images.pexels.com/photos/9637851/pexels-photo-9637851.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=900&w=940",
};

const GALLERY_IMGS = [
  "https://images.pexels.com/photos/19101424/pexels-photo-19101424.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=600&w=600",
  "https://images.pexels.com/photos/28758240/pexels-photo-28758240.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=600&w=600",
  "https://images.pexels.com/photos/9637851/pexels-photo-9637851.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=600&w=600",
  "https://images.pexels.com/photos/37014370/pexels-photo-37014370.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=600&w=600",
  "https://images.pexels.com/photos/11871927/pexels-photo-11871927.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=600&w=600",
  "https://images.unsplash.com/photo-1721352490417-3e96bbf0ba84?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHw0fHxvdmVyc2l6ZWQlMjBzdHJlZXR3ZWFyJTIwdC1zaGlydCUyMG1vZGVsJTIwZGFya3xlbnwwfHx8fDE3NzczMTQ2NTJ8MA&ixlib=rb-4.1.0&q=85",
];

const REVIEWS = [
  { name: "Aarav Sharma", city: "Mumbai", rating: 5, body: "The fabric is insanely thick. Feels like a ₹2000 tee. Already ordered 3 more.", img: "https://images.pexels.com/photos/28758240/pexels-photo-28758240.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=300" },
  { name: "Priya Mehta", city: "Bangalore", rating: 5, body: "Loved the oversized fit. Finally a brand that gets streetwear right.", img: "https://images.pexels.com/photos/19101424/pexels-photo-19101424.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=300" },
  { name: "Karan Singh", city: "Delhi", rating: 5, body: "COD worked perfectly. Delivered in 3 days. Crazy quality at this price.", img: "https://images.pexels.com/photos/9637851/pexels-photo-9637851.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=300&w=300" },
];

const Home = () => {
  const [bestsellers, setBestsellers] = useState([]);

  useEffect(() => {
    api.get("/products/bestsellers").then(({ data }) => setBestsellers(data)).catch(() => {});
  }, []);

  return (
    <div data-testid="home-page" className="pt-16">
      <OfferMarquee />

      {/* HERO */}
      <section className="relative min-h-[90vh] md:min-h-[100vh] flex items-end overflow-hidden">
        <img src={HERO_IMG} alt="Cynos hero" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black" />
        <div className="absolute inset-0 grain" />
        <div className="relative z-10 px-4 md:px-8 lg:px-12 pb-16 md:pb-24 w-full">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-cynos-red">Drop 01 / Live Now</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="font-anton text-[18vw] md:text-[14vw] lg:text-[12rem] leading-[0.85] uppercase tracking-tighter mt-4"
          >
            Wear<br />
            <span className="text-cynos-red">Your</span><br />
            Attitude.
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 max-w-xl"
          >
            <p className="text-zinc-300 text-base md:text-lg">
              Premium 240 GSM cotton tees · Cash on Delivery · Free shipping pan-India
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link
                to="/shop"
                className="bg-white text-black px-10 py-5 font-mono text-xs uppercase tracking-[0.2em] hover:bg-zinc-200 transition-colors inline-flex items-center justify-center gap-2 group"
                data-testid="hero-shop-button"
              >
                Shop Now <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/shop?category=anime"
                className="border border-white/30 text-white px-10 py-5 font-mono text-xs uppercase tracking-[0.2em] hover:border-white transition-colors inline-flex items-center justify-center gap-2"
                data-testid="hero-anime-button"
              >
                Anime Drop
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <TrustBadges />

      {/* BESTSELLERS */}
      <section className="px-4 md:px-8 lg:px-12 py-24 md:py-32" data-testid="bestsellers-section">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-cynos-red">Bestsellers</span>
            <h2 className="font-anton text-5xl md:text-7xl uppercase tracking-tight mt-2">Most Wanted.</h2>
          </div>
          <Link to="/shop" className="hidden md:inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] hover:text-cynos-red">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {bestsellers.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* CATEGORIES BENTO */}
      <section className="px-4 md:px-8 lg:px-12 pb-24" data-testid="categories-section">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-cynos-red">Shop By</span>
            <h2 className="font-anton text-5xl md:text-7xl uppercase mt-2">Categories.</h2>
          </div>
        </div>
        <div className="grid grid-cols-6 grid-rows-2 gap-3 md:gap-4 h-[600px] md:h-[560px]">
          <CategoryTile cat={CATEGORIES[3]} img={CATEGORY_IMAGES.oversized} className="col-span-6 md:col-span-3 row-span-2" big />
          <CategoryTile cat={CATEGORIES[0]} img={CATEGORY_IMAGES.men} className="col-span-3 md:col-span-2 row-span-1" />
          <CategoryTile cat={CATEGORIES[5]} img={CATEGORY_IMAGES.anime} className="col-span-3 md:col-span-1 row-span-1" />
          <CategoryTile cat={CATEGORIES[1]} img={CATEGORY_IMAGES.women} className="col-span-3 md:col-span-1 row-span-1" />
          <CategoryTile cat={CATEGORIES[2]} img={CATEGORY_IMAGES.couple} className="col-span-3 md:col-span-2 row-span-1" />
        </div>
      </section>

      {/* OFFER BANNER */}
      <section className="relative overflow-hidden border-y border-white/10" data-testid="offer-banner">
        <div className="bg-cynos-red py-20 md:py-28 relative">
          <div className="absolute inset-0 grain" />
          <div className="relative z-10 px-4 md:px-8 lg:px-12 text-center">
            <div className="font-mono text-xs uppercase tracking-[0.3em] opacity-80">Limited Time</div>
            <h2 className="font-anton text-7xl md:text-[10rem] leading-[0.85] uppercase mt-3">
              Buy 2.<br />Get 1 Free.
            </h2>
            <p className="mt-6 max-w-md mx-auto text-sm md:text-base">
              Stack any 3 tees. The cheapest one's on us. No code needed. Auto-applies at cart.
            </p>
            <Link to="/shop" className="inline-block mt-8 bg-black text-white px-10 py-5 font-mono text-xs uppercase tracking-[0.2em] hover:bg-zinc-900" data-testid="offer-shop-btn">
              Stack Up Now
            </Link>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="px-4 md:px-8 lg:px-12 py-24 md:py-32" data-testid="reviews-section">
        <div className="mb-12">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-cynos-red">Real Reviews</span>
          <h2 className="font-anton text-5xl md:text-7xl uppercase mt-2">From Our Tribe.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {REVIEWS.map((r) => (
            <div key={r.name} className="bg-cynos-card border border-white/10 p-6">
              <div className="flex items-center gap-3">
                <img src={r.img} alt={r.name} className="w-14 h-14 object-cover" />
                <div>
                  <div className="font-bold uppercase text-sm">{r.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{r.city}</div>
                </div>
              </div>
              <div className="flex gap-0.5 mt-4">
                {[...Array(r.rating)].map((_, i) => <Star key={i} size={14} fill="#FF3333" stroke="#FF3333" />)}
              </div>
              <p className="text-zinc-300 mt-3 text-sm leading-relaxed">"{r.body}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* INSTAGRAM GALLERY */}
      <section className="px-4 md:px-8 lg:px-12 pb-24" data-testid="instagram-gallery">
        <div className="mb-10">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-cynos-red">@cynos.in</span>
          <h2 className="font-anton text-5xl md:text-7xl uppercase mt-2">Tagged In Cynos.</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3">
          {GALLERY_IMGS.map((src, i) => (
            <a key={i} href="https://instagram.com" target="_blank" rel="noreferrer" className="block aspect-square bg-cynos-surface overflow-hidden group">
              <img src={src} alt="" className="w-full h-full object-cover zoom-on-hover" loading="lazy" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};

const CategoryTile = ({ cat, img, className = "", big = false }) => (
  <Link to={`/shop?category=${cat.slug}`} className={`relative overflow-hidden bg-cynos-surface border border-white/10 group ${className}`} data-testid={`cat-tile-${cat.slug}`}>
    <img src={img} alt={cat.label} className="absolute inset-0 w-full h-full object-cover zoom-on-hover" loading="lazy" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    <div className="absolute bottom-0 left-0 p-5">
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-cynos-red">Shop</span>
      <div className={`font-anton uppercase mt-1 leading-none ${big ? "text-6xl md:text-8xl" : "text-3xl md:text-5xl"}`}>{cat.label}</div>
    </div>
  </Link>
);

export default Home;
