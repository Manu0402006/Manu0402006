import React from "react";
import Marquee from "react-fast-marquee";

const OfferMarquee = () => (
  <div className="bg-cynos-red text-white py-2 border-y border-white/10" data-testid="top-offer-marquee">
    <Marquee gradient={false} speed={45} className="font-mono text-xs uppercase tracking-[0.2em]">
      <span className="mx-8">Buy 2 Get 1 Free · Use code CYNOS10 for extra 10% off · Free shipping pan-India · Cash on Delivery available · Easy 7-day returns ·</span>
      <span className="mx-8">Buy 2 Get 1 Free · Use code CYNOS10 for extra 10% off · Free shipping pan-India · Cash on Delivery available · Easy 7-day returns ·</span>
    </Marquee>
  </div>
);

export default OfferMarquee;
