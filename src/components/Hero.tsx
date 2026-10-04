import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, ShieldCheck, Star, Heart, CheckCircle2 } from "lucide-react";

interface HeroProps {
  handleNavigate: (path: string) => void;
  featuredProduct?: any;
  profileAvatar?: string;
  profileName?: string;
}

export const Hero: React.FC<HeroProps> = ({
  handleNavigate,
  featuredProduct,
  profileAvatar,
  profileName = "Renu Agarwal"
}) => {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            {/* Editorial Kicker */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-[11px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Spring / Festive 2026 Haute Couture</span>
            </div>

            {/* Main Display Headline */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-stone-900 dark:text-stone-50 leading-[1.12]">
              The Art of Indian Elegance, <span className="italic font-normal text-rose-600 dark:text-rose-400">Handpicked</span> for You.
            </h1>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
              Curated by fashion stylist and creator <strong className="text-stone-900 dark:text-stone-100 font-bold">{profileName}</strong>. 
              Discover handcrafted Banarasi sarees, embroidered festive kurtis, bridal lehengas, and heirloom jewellery — paired with authentic reviews and direct verified boutique links.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
              <a
                href="#collections-grid"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("collections-grid")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-600/20 active:scale-95 flex items-center gap-2 group cursor-pointer"
              >
                <span>Explore Curated Styles</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>

              <Link
                to="/blog"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigate("/blog");
                }}
                className="px-6 py-3.5 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-800 font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
              >
                Read Styling Guides
              </Link>
            </div>

            {/* Stylist Curator Byline & Trust Pillars */}
            <div className="pt-4 border-t border-stone-200/80 dark:border-stone-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {profileAvatar && (
                  <img 
                    src={profileAvatar} 
                    alt={profileName} 
                    className="w-11 h-11 rounded-full object-cover border-2 border-rose-500 shadow-sm"
                  />
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{profileName}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20" />
                  </div>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                    Verified Fashion Creator & Stylist
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>4.9 / 5.0 Styling Trust</span>
                </span>
                <span className="opacity-30">·</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified Purchase Links</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Featured Hero Editorial Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm sm:max-w-md lg:max-w-none">
              {/* Decorative luxury frame backdrop */}
              <div className="absolute -inset-3 bg-gradient-to-tr from-rose-500/10 via-amber-500/10 to-transparent rounded-[2.5rem] blur-xl opacity-70 pointer-events-none" />

              <div className="relative rounded-[2rem] overflow-hidden border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl">
                {/* Hero Feature Visual */}
                <div className="aspect-[4/5] relative overflow-hidden bg-stone-100 dark:bg-stone-800">
                  <img
                    src={featuredProduct?.url || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80"}
                    alt={featuredProduct?.name || "Handcrafted Indian Bridal Silk Saree by Renu Agarwal"}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    loading="eager"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                      if (target.parentElement) {
                        target.parentElement.classList.add("bg-gradient-to-br", "from-rose-950", "via-stone-900", "to-stone-950");
                      }
                    }}
                  />
                  
                  {/* Floating luxury tag */}
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-stone-900/85 backdrop-blur-md text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/30">
                    Curator's Choice
                  </div>

                  {/* Quick style badge */}
                  <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-white/40 dark:border-stone-800 shadow-xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-0.5">
                      {featuredProduct?.category || "Festive Saree"}
                    </p>
                    <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate mb-1">
                      {featuredProduct?.name || "Pure Katan Banarasi Silk Handwoven Saree"}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                        {featuredProduct?.price ? `₹${featuredProduct.price}` : "Featured Style"}
                      </span>
                      {featuredProduct?.id && (
                        <Link
                          to={`/product/${featuredProduct.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavigate(`/product/${featuredProduct.id}`);
                          }}
                          className="text-[10px] font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 hover:text-rose-600 flex items-center gap-1 group"
                        >
                          <span>View Detail</span>
                          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
