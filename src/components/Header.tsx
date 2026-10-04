import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Search, 
  Share2, 
  Menu, 
  X, 
  Phone, 
  ShieldCheck, 
  ChevronRight,
  Sparkles,
  ExternalLink,
  Instagram,
  Youtube,
  Facebook,
  Lock,
  UserCheck
} from "lucide-react";
import { SimpleThemeToggle } from "../theme";

interface HeaderProps {
  profileName: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  handleNavigate: (path: string) => void;
  onOpenShareModal: () => void;
  isAdminUser?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profileName,
  searchQuery,
  setSearchQuery,
  handleNavigate,
  onOpenShareModal,
  isAdminUser
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Sarees", href: "/category/sarees" },
    { label: "Kurtis & Suits", href: "/category/kurtas" },
    { label: "Lehengas", href: "/category/lehengas" },
    { label: "Dresses", href: "/category/dresses" },
    { label: "Jewellery", href: "/category/jewelry" },
    { label: "Fashion Blog", href: "/blog" },
    { label: "About Renu", href: "/about" },
    { label: "Contact", href: "/contact" }
  ];

  return (
    <header className="w-full relative z-40">
      {/* Top Luxury Announcement Bar */}
      <div className="w-full bg-stone-900 dark:bg-black text-stone-200 text-[11px] py-2 px-4 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
            <span className="font-medium tracking-wide">
              Curated Indian Haute Couture & Styling Guides by Renu Agarwal · Verified Store Links
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[10px] text-stone-400 shrink-0">
            <a 
              href="https://wa.me/917248763036" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-rose-400 transition-colors flex items-center gap-1.5"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>Personal Style Assist: +91 72487 63036</span>
            </a>
            <span className="opacity-30">|</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>100% Genuine Curations</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Luxury Navigation Bar */}
      <nav 
        className="w-full bg-[#FAF9F6]/95 dark:bg-[#0C0A09]/95 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 transition-colors duration-200"
        aria-label="Main Navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Brand Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link 
              to="/" 
              onClick={(e) => {
                e.preventDefault();
                handleNavigate("/");
              }}
              className="flex flex-col group text-inherit no-underline"
            >
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                RENU FASHION HUB
              </span>
              <span className="text-[8.5px] uppercase tracking-[0.28em] text-rose-600 dark:text-rose-400 font-bold -mt-0.5">
                HAUTE COUTURE & STYLING
              </span>
            </Link>
          </div>

          {/* Center: Desktop Navigation Links (SSR crawlable <a href>) */}
          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate(item.href);
                  }}
                  className={`text-xs font-semibold uppercase tracking-wider transition-colors relative py-1 ${
                    isActive 
                      ? "text-rose-600 dark:text-rose-400 font-bold" 
                      : "text-stone-700 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-rose-600 dark:bg-rose-400 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right: Actions Cluster (Search, Theme Toggle, Share, Admin) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Search Trigger */}
            <div className="relative">
              {isSearchOpen ? (
                <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-full px-3 py-1.5 shadow-inner">
                  <Search className="w-3.5 h-3.5 text-stone-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sarees, kurtis..."
                    className="w-32 sm:w-48 bg-transparent text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="w-9 h-9 rounded-full border border-stone-200/80 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 text-stone-700 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-900/60 transition-colors flex items-center justify-center active:scale-95 cursor-pointer shadow-xs"
                  aria-label="Open search"
                  title="Search Styles"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Simple, Lag-Free Theme Toggle */}
            <SimpleThemeToggle />

            {/* Share Button */}
            <button
              type="button"
              onClick={onOpenShareModal}
              className="w-9 h-9 rounded-full border border-stone-200/80 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 text-stone-700 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-900/60 transition-colors flex items-center justify-center active:scale-95 cursor-pointer shadow-xs"
              aria-label="Share Renu Fashion Hub"
              title="Share Page"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Admin Key / Portal Button */}
            <Link
              to="/admin"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate("/admin");
              }}
              className={`w-9 h-9 rounded-full border transition-colors flex items-center justify-center active:scale-95 shadow-xs ${
                isAdminUser 
                  ? "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400" 
                  : "border-stone-200/80 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
              title={isAdminUser ? "Admin Dashboard" : "Admin Login"}
              aria-label="Admin Portal"
            >
              {isAdminUser ? <UserCheck className="w-4 h-4 text-rose-500" /> : <Lock className="w-3.5 h-3.5" />}
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-200 dark:border-stone-800 bg-[#FAF9F6] dark:bg-[#0C0A09] px-6 py-6 space-y-6 shadow-2xl animate-fade-in-down">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-2">
                Collections & Pages
              </p>
              {navLinks.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate(item.href);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between py-2.5 text-sm font-semibold transition-colors ${
                      isActive 
                        ? "text-rose-600 dark:text-rose-400 font-bold" 
                        : "text-stone-800 dark:text-stone-200 hover:text-rose-600"
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 mb-3">
                Curator Socials
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com/renu_agarwal_vlogs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-pink-600"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com/@renuagarwalvlogs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-red-600"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a
                  href="https://www.facebook.com/share/17YfgJkGda/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-blue-600"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://wa.me/917248763036"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-emerald-600 ml-auto flex items-center gap-1.5 text-xs font-bold"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Style Advice</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
