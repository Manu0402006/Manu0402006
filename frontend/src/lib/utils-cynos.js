export const formatINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const calcDiscountPct = (price, original) => {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
};

export const CATEGORIES = [
  { slug: "men", label: "Men" },
  { slug: "women", label: "Women" },
  { slug: "couple", label: "Couple Tees" },
  { slug: "oversized", label: "Oversized" },
  { slug: "graphic", label: "Graphic" },
  { slug: "anime", label: "Anime" },
];
