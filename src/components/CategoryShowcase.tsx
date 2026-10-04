import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";

interface CategoryShowcaseProps {
  handleNavigate: (path: string) => void;
  products?: any[];
}

export const CATEGORIES_DATA = [
  {
    slug: "sarees",
    name: "Designer Sarees",
    subtitle: "Banarasi, Kanjeevaram & Festive Silks",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=80",
    count: "80+ Curated",
    href: "/category/sarees",
    match: ["saree"]
  },
  {
    slug: "kurtas",
    name: "Kurtis & Suits",
    subtitle: "Embroidered Anarkalis & Daily Wear",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=700&q=80",
    count: "70+ Curated",
    href: "/category/kurtas",
    match: ["kurta", "kurti", "suit", "anarkali"]
  },
  {
    slug: "lehengas",
    name: "Bridal Lehengas",
    subtitle: "Royal Zardozi & Wedding Ensembles",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=80",
    count: "45+ Curated",
    href: "/category/lehengas",
    match: ["lehenga", "choli", "bridal"]
  },
  {
    slug: "dresses",
    name: "Western & Fusion",
    subtitle: "Chic Maxis & Contemporary Dresses",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=700&q=80",
    count: "50+ Curated",
    href: "/category/dresses",
    match: ["dress", "maxi", "western"]
  },
  {
    slug: "jewelry",
    name: "Artisanal Jewellery",
    subtitle: "Heritage Kundan, Temple & Silver",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=80",
    count: "60+ Curated",
    href: "/category/jewelry",
    match: ["jewel", "necklace", "earring", "bangle", "choker"]
  }
];

export const CategoryShowcase: React.FC<CategoryShowcaseProps> = ({ handleNavigate, products = [] }) => {
  return (
    <section id="categories-section" className="py-12 sm:py-16 border-t border-stone-200/80 dark:border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Haute Collections</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
              Curated by Silhouette
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md">
            Browse handcrafted Indian and fusion fashion lines, each with personal styling advice, fabric notes, and trusted direct purchase destinations.
          </p>
        </div>

        {/* 5-Column Responsive Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
          {CATEGORIES_DATA.map((cat, idx) => {
            // Find live product image if available
            const matchedProduct = products.find((p: any) => {
              if (p.category && p.category.toLowerCase().includes(cat.slug)) return true;
              const text = `${p.name || ""} ${p.description || ""}`.toLowerCase();
              return cat.match.some((kw: string) => text.includes(kw));
            });
            const displayImage = matchedProduct?.url || cat.image;

            return (
              <Link
                key={cat.slug}
                to={cat.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate(cat.href);
                }}
                className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-stone-100 dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block text-inherit no-underline"
              >
                {/* Category Background Image with graceful fallback */}
                <img
                  src={displayImage}
                  alt={`${cat.name} by Renu Fashion Hub`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Styled resilient fallback if image cannot load
                    const target = e.currentTarget;
                    target.style.display = "none";
                    if (target.parentElement) {
                      target.parentElement.classList.add("bg-gradient-to-br", "from-rose-950", "via-stone-900", "to-stone-950");
                    }
                  }}
                />

                {/* Gradient Vignette for perfect text contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-950/40 to-transparent" />

                {/* Top Item Count Tag */}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-stone-900/80 backdrop-blur-xs text-[9px] font-bold text-stone-200 border border-white/10">
                  {cat.count}
                </div>

                {/* Bottom Details */}
                <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-4 text-white">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h3 className="font-serif text-sm sm:text-base font-bold text-stone-50 tracking-tight leading-tight group-hover:text-rose-300 transition-colors">
                      {cat.name}
                    </h3>
                    <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 group-hover:bg-rose-600 transition-colors">
                      <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-300/90 line-clamp-1">
                    {cat.subtitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
};
