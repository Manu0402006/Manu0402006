import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Youtube } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-white/10 bg-black mt-32 px-4 md:px-8 lg:px-12 py-16" data-testid="footer">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
      <div className="col-span-2">
        <div className="font-anton text-5xl md:text-6xl uppercase">CYNOS<span className="text-cynos-red">.</span></div>
        <p className="text-zinc-400 mt-4 max-w-md text-sm">
          Premium streetwear tees built for the bold. Designed in India, dropped in limited runs. Wear your attitude.
        </p>
        <div className="flex gap-4 mt-6">
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-white hover:text-cynos-red" data-testid="footer-instagram"><Instagram size={20} /></a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-white hover:text-cynos-red" data-testid="footer-twitter"><Twitter size={20} /></a>
          <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-white hover:text-cynos-red" data-testid="footer-youtube"><Youtube size={20} /></a>
        </div>
      </div>
      <div>
        <h4 className="font-mono text-xs uppercase tracking-[0.2em] mb-4 text-white">Shop</h4>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li><Link to="/shop?category=men" className="hover:text-white">Men</Link></li>
          <li><Link to="/shop?category=women" className="hover:text-white">Women</Link></li>
          <li><Link to="/shop?category=couple" className="hover:text-white">Couple Tees</Link></li>
          <li><Link to="/shop?category=oversized" className="hover:text-white">Oversized</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-mono text-xs uppercase tracking-[0.2em] mb-4 text-white">Help</h4>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>Shipping & Returns</li>
          <li>Size Guide</li>
          <li>Track Order</li>
          <li>Contact Us</li>
        </ul>
      </div>
    </div>
    <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between gap-3 text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
      <span>© {new Date().getFullYear()} Cynos. All rights reserved.</span>
      <span>Made in India · Free shipping pan-India</span>
    </div>
  </footer>
);

export default Footer;
