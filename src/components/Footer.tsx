import React from "react";
import { Link } from "react-router-dom";
import { 
  Instagram, 
  Youtube, 
  Facebook, 
  Phone, 
  Mail, 
  Heart, 
  ShieldCheck, 
  Sparkles,
  ExternalLink 
} from "lucide-react";

interface FooterProps {
  handleNavigate: (path: string) => void;
  profileName?: string;
}

export const Footer: React.FC<FooterProps> = ({ 
  handleNavigate, 
  profileName = "Renu Agarwal" 
}) => {
  return (
    <footer className="w-full bg-[#F4F1EA] dark:bg-[#080706] text-stone-800 dark:text-stone-200 border-t border-stone-200/80 dark:border-stone-800/80 pt-16 pb-12 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-stone-300/60 dark:border-stone-800/80">
          
          {/* Column 1: Brand & Philosophy (span 4) */}
          <div className="lg:col-span-4 space-y-4">
            <Link 
              to="/" 
              onClick={(e) => {
                e.preventDefault();
                handleNavigate("/");
              }}
              className="inline-block text-inherit no-underline"
            >
              <span className="font-serif text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
                RENU FASHION HUB
              </span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-rose-600 dark:text-rose-400 font-bold block">
                HAUTE COUTURE & STYLING GUIDES
              </span>
            </Link>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed max-w-sm">
              An independent fashion destination curated by <strong className="text-stone-900 dark:text-stone-100 font-semibold">{profileName}</strong>. 
              Bridging timeless Indian traditions with contemporary elegance, offering honest styling guides and handpicked verified boutique finds.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://www.instagram.com/renu_agarwal_vlogs"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-pink-600 hover:text-white hover:bg-pink-600 transition-all flex items-center justify-center shadow-xs"
                aria-label="Instagram @renu_agarwal_vlogs"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com/@renuagarwalvlogs"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-red-600 hover:text-white hover:bg-red-600 transition-all flex items-center justify-center shadow-xs"
                aria-label="YouTube @renuagarwalvlogs"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://www.facebook.com/share/17YfgJkGda/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-blue-600 hover:text-white hover:bg-blue-600 transition-all flex items-center justify-center shadow-xs"
                aria-label="Facebook Renu Agarwal"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/917248763036"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-emerald-600 hover:text-white hover:bg-emerald-600 transition-all flex items-center justify-center shadow-xs"
                aria-label="WhatsApp Stylist Direct"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Collections (span 3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-900 dark:text-stone-100">
              Collections
            </h4>
            <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
              <li>
                <Link 
                  to="/category/sarees" 
                  onClick={(e) => { e.preventDefault(); handleNavigate("/category/sarees"); }}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Designer & Silk Sarees
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/kurtas" 
                  onClick={(e) => { e.preventDefault(); handleNavigate("/category/kurtas"); }}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Kurtis & Designer Kurta Sets
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/lehengas" 
                  onClick={(e) => { e.preventDefault(); handleNavigate("/category/lehengas"); }}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Bridal & Festive Lehengas
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/dresses" 
                  onClick={(e) => { e.preventDefault(); handleNavigate("/category/dresses"); }}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Western Dresses & Fusion Outfits
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/jewelry" 
                  onClick={(e) => { e.preventDefault(); handleNavigate("/category/jewelry"); }}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Artisanal Kundan & Temple Jewellery
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Editorial & Company (span 2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-900 dark:text-stone-100">
              Editorial
            </h4>
            <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
              <li>
                <Link 
                  to="/blog" 
                  onClick={(e) => { e.preventDefault(); handleNavigate("/blog"); }}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Fashion Blog & Guides
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  onClick={(e) => { e.preventDefault(); handleNavigate("/about"); }}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  About Renu Agarwal
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  onClick={(e) => { e.preventDefault(); handleNavigate("/contact"); }}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Contact & Styling Help
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin" 
                  onClick={(e) => { e.preventDefault(); handleNavigate("/admin"); }}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Trust (span 3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-900 dark:text-stone-100">
              Transparency & Legal
            </h4>
            <ul className="space-y-2 text-xs text-stone-600 dark:text-stone-400">
              <li>
                <Link 
                  to="/privacy-policy" 
                  onClick={(e) => { e.preventDefault(); handleNavigate("/privacy-policy"); }}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms-of-service" 
                  onClick={(e) => { e.preventDefault(); handleNavigate("/terms-of-service"); }}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  to="/disclaimer" 
                  onClick={(e) => { e.preventDefault(); handleNavigate("/disclaimer"); }}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link 
                  to="/affiliate-disclosure" 
                  onClick={(e) => { e.preventDefault(); handleNavigate("/affiliate-disclosure"); }}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Affiliate Disclosure
                </Link>
              </li>
              <li>
                <Link 
                  to="/cookie-policy" 
                  onClick={(e) => { e.preventDefault(); handleNavigate("/cookie-policy"); }}
                  className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Affiliate Statement */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500 dark:text-stone-400">
          <p>
            &copy; 2026 <strong className="font-semibold text-stone-800 dark:text-stone-200">Renu Fashion Hub</strong>. All Rights Reserved. Curated with grace by Renu Agarwal.
          </p>
          <div className="flex items-center gap-4 text-[10px]">
            <span>Verified Affiliate Partner</span>
            <span className="opacity-30">·</span>
            <span>Zero Surcharge to Shoppers</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
