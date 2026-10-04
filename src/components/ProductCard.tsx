import React from "react";
import { Link } from "react-router-dom";
import { Star, ExternalLink, ArrowRight, Sparkles } from "lucide-react";

interface ProductCardProps {
  product: any;
  navigate: (path: string) => void;
  isMobile?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  navigate,
  isMobile
}) => {
  const hasDiscount = Boolean(product.originalPrice && Number(product.originalPrice) > Number(product.price));
  const discountPercent = hasDiscount 
    ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
    : null;

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-[#12100E] border border-stone-200/80 dark:border-stone-800/80 hover:border-rose-400/50 dark:hover:border-rose-500/40 shadow-xs hover:shadow-xl transition-all duration-300">
      
      {/* 3:4 Aspect Image Frame */}
      <a
        href={`/product/${product.id}`}
        onClick={(e) => {
          e.preventDefault();
          navigate(`/product/${product.id}`);
        }}
        className="block relative aspect-[3/4] overflow-hidden bg-stone-100 dark:bg-stone-800/50 text-inherit no-underline cursor-pointer"
      >
        <img
          src={product.url}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            if (target.parentElement) {
              target.parentElement.classList.add("bg-gradient-to-br", "from-rose-950", "via-stone-900", "to-stone-950", "flex", "items-center", "justify-center");
            }
          }}
        />

        {/* Origin / Partner Tag */}
        {product.originTag && (
          <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-stone-900/80 backdrop-blur-xs text-[9px] font-bold text-amber-300 uppercase tracking-wider border border-amber-400/20">
            {product.originTag}
          </div>
        )}

        {/* Discount Badge */}
        {discountPercent && discountPercent > 0 && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
            {discountPercent}% OFF
          </div>
        )}

        {/* Overlay hover CTA */}
        <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 pointer-events-none">
          <span className="w-full py-2 rounded-xl bg-white/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 text-[10px] font-bold uppercase tracking-wider text-center shadow-lg backdrop-blur-xs">
            Quick View →
          </span>
        </div>
      </a>

      {/* Product Content Details */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Category & Star Rating */}
          <div className="flex items-center justify-between gap-2 text-[10px] text-stone-500 dark:text-stone-400 mb-1">
            <span className="uppercase tracking-widest font-semibold text-rose-600 dark:text-rose-400">
              {product.category || "Couture Pick"}
            </span>
            <span className="flex items-center gap-0.5 text-amber-500 font-bold">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>{product.rating || "4.8"}</span>
            </span>
          </div>

          {/* Product Title */}
          <a
            href={`/product/${product.id}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/product/${product.id}`);
            }}
            className="block text-inherit no-underline"
          >
            <h3 className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              {product.name}
            </h3>
          </a>
        </div>

        {/* Price & Action Row */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800/60 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-sm sm:text-base text-stone-950 dark:text-stone-50">
              ₹{product.price}
            </span>
            {hasDiscount && (
              <span className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500 line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          {product.buyUrl ? (
            <a
              href={product.buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
              title="Buy from verified partner store"
            >
              <span>Shop</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <button
              type="button"
              onClick={() => navigate(`/product/${product.id}`)}
              className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-0.5"
            >
              <span>Details</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
});
