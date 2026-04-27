import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { ShoppingBag, Menu, X, Search } from "lucide-react";
import { useCart } from "../context/CartContext";
import { CATEGORIES } from "../lib/utils-cynos";

const Navbar = () => {
  const { totalQty, setOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="navbar"
      className={`fixed top-0 inset-x-0 z-40 transition-all backdrop-blur-2xl border-b ${
        scrolled ? "bg-black/80 border-white/10" : "bg-black/30 border-transparent"
      }`}
    >
      <div className="px-4 md:px-8 lg:px-12 py-4 flex items-center justify-between">
        <button
          className="md:hidden text-white"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="menu"
          data-testid="nav-mobile-toggle"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="font-anton text-3xl md:text-4xl tracking-tight uppercase" data-testid="brand-logo">
          CYNOS<span className="text-cynos-red">.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/shop" className="text-xs uppercase tracking-[0.2em] font-mono text-white hover:text-cynos-red transition-colors" data-testid="nav-shop">
            Shop All
          </NavLink>
          {CATEGORIES.slice(0, 4).map((c) => (
            <NavLink
              key={c.slug}
              to={`/shop?category=${c.slug}`}
              className="text-xs uppercase tracking-[0.2em] font-mono text-white hover:text-cynos-red transition-colors"
              data-testid={`nav-cat-${c.slug}`}
            >
              {c.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button aria-label="search" className="hidden md:block text-white" data-testid="nav-search">
            <Search size={18} />
          </button>
          <button
            className="relative text-white"
            onClick={() => setOpen(true)}
            aria-label="cart"
            data-testid="nav-cart-btn"
          >
            <ShoppingBag size={20} />
            {totalQty > 0 && (
              <span className="absolute -top-2 -right-2 bg-cynos-red text-white text-[10px] font-mono px-1.5 py-0.5">
                {totalQty}
              </span>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-black border-t border-white/10 px-4 py-6 space-y-4">
          <Link to="/shop" onClick={() => setMobileOpen(false)} className="block text-sm uppercase tracking-[0.2em] font-mono" data-testid="mnav-shop">
            Shop All
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to={`/shop?category=${c.slug}`}
              onClick={() => setMobileOpen(false)}
              className="block text-sm uppercase tracking-[0.2em] font-mono"
              data-testid={`mnav-${c.slug}`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;
