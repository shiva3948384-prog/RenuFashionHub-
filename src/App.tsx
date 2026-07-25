/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, FormEvent, ChangeEvent, useEffect, useMemo, useCallback } from "react";
import { Routes, Route, Link, useNavigate, useParams, useLocation, Navigate } from "react-router-dom";
import { get, set } from "idb-keyval";
import { motion, AnimatePresence } from "motion/react";
import { 
  Instagram, 
  Youtube, 
  Facebook,
  Globe, 
  Mail, 
  ExternalLink, 
  CheckCircle2,
  Share2,
  MoreHorizontal,
  ShoppingBag,
  Image as ImageIcon,
  Layers,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Settings,
  Plus,
  Trash2,
  Save,
  BookOpen,
  Bold,
  Italic,
  Underline,
  Link2,
  LogOut,
  User,
  X,
  Check,
  Tag,
  MessageSquare,
  Phone,
  RefreshCw,
  Loader2,
  ChevronLeft,
  Volume2,
  VolumeX,
  Twitter,
  Linkedin,
  Send,
  Copy,
  QrCode,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Star,
  Search,
  Sparkles,
  ArrowUpDown,
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  Clock,
  MapPin,
  Edit,
  Download
} from "lucide-react";

// Initial Mock Data
const INITIAL_SOCIAL_LINKS = [
  { icon: Instagram, href: "https://www.instagram.com/renu_agarwal_vlogs?igsh=djdnMGZ2dGY4d3Y3", label: "Instagram", followers: "1.2M", handle: "@renu_agarwal_vlogs", color: "text-pink-500" },
  { icon: Youtube, href: "https://youtube.com/@renuagarwalvlogs?si=wX0iLDVP5O_in8z8", label: "YouTube", followers: "666K", handle: "@renuagarwalvlogs", color: "text-red-500" },
  { icon: Facebook, href: "https://www.facebook.com/share/17YfgJkGda/", label: "Facebook", followers: "50K", handle: "Renu Fashion Hub", color: "text-blue-500" },
];

const INITIAL_TABS = [
  { id: "shop", label: "Shop All", icon: ShoppingBag },
  { id: "post", label: "Post", icon: ImageIcon },
  { id: "products", label: "Products", icon: Tag },
];

const MediaImage = React.memo(({ url, className, alt, fallback, onReady, ...props }: { url: string | File | Blob; className?: string; alt?: string; fallback?: React.ReactNode; onReady?: () => void; [key: string]: any }) => {
  const [mediaUrl, setMediaUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    setError(false);
    if (!url) {
      setMediaUrl(null);
      onReady?.();
      return;
    }

    if (typeof url === "string") {
      setMediaUrl(url);
      return;
    }

    if (url instanceof Blob || (url as any) instanceof File) {
      const objectUrl = URL.createObjectURL(url);
      setMediaUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [url]);

  if (!mediaUrl || error) {
    if (error) onReady?.();
    return <>{fallback || null}</>;
  }
  return (
    <img 
      src={mediaUrl} 
      className={className} 
      alt={alt} 
      referrerPolicy="no-referrer" 
      onError={() => { setError(true); onReady?.(); }}
      onLoad={() => onReady?.()}
      {...props} 
    />
  );
});

const VideoEmbed = React.memo(({ url, isMuted = true, minimal = false, isPlaying = true, onReady }: { url: string | File | Blob; isMuted?: boolean; minimal?: boolean; isPlaying?: boolean; onReady?: () => void }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = React.useState(false);
  const [mediaUrl, setMediaUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!url) {
      setMediaUrl(null);
      onReady?.();
      return;
    }

    if (typeof url === "string") {
      setMediaUrl(url);
      return;
    }

    if (url instanceof Blob || (url as any) instanceof File) {
      const objectUrl = URL.createObjectURL(url);
      setMediaUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [url]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { 
        threshold: 0.1,
        rootMargin: "50px" // Start loading slightly before it enters the viewport
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (videoRef.current && mediaUrl) {
      if (isInView && isPlaying) {
        // Ensure video is muted for reliable auto-play
        videoRef.current.muted = isMuted;
        videoRef.current.play().catch(e => {
          // Only log if it's not a standard browser policy rejection
          if (e.name !== "NotAllowedError") {
            console.error("Auto-play failed", e);
          }
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isInView, mediaUrl, isMuted, isPlaying]);

  const isProfileUrl = (url: any) => {
    if (typeof url !== "string") return false;
    if (url.includes("instagram.com") && !url.includes("/p/") && !url.includes("/reels/") && !url.includes("/tv/")) return true;
    if (url.includes("facebook.com") && !url.includes("/videos/") && !url.includes("/watch/") && !url.includes("/posts/")) return true;
    if (url.includes("youtube.com") && (url.includes("/@") || url.includes("/channel/") || url.includes("/user/"))) return true;
    return false;
  };

  const getEmbedUrl = (url: any) => {
    if (typeof url !== "string") return null;
    try {
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        if (isProfileUrl(url)) return null;
        let id = "";
        if (url.includes("v=")) {
          id = url.split("v=")[1].split("&")[0];
        } else if (url.includes("youtu.be/")) {
          id = url.split("youtu.be/")[1].split("?")[0];
        } else if (url.includes("youtube.com/embed/")) {
          id = url.split("youtube.com/embed/")[1].split("?")[0];
        } else if (url.includes("youtube.com/shorts/")) {
          id = url.split("youtube.com/shorts/")[1].split("?")[0];
        } else {
          id = url.split("/").pop()?.split("?")[0] || "";
        }
        // Add autoplay and mute params for youtube
        return `https://www.youtube.com/embed/${id}?autoplay=${(isInView && isPlaying) ? 1 : 0}&mute=${isMuted ? 1 : 0}&loop=1&playlist=${id}&controls=0&modestbranding=1&rel=0`;
      }
      if (url.includes("instagram.com")) {
        if (isProfileUrl(url)) return null;
        const cleanUrl = url.split("?")[0];
        return `${cleanUrl}${cleanUrl.endsWith("/") ? "" : "/"}embed`;
      }
      if (url.includes("facebook.com")) {
        if (isProfileUrl(url)) return null;
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=560&autoplay=${isInView && isPlaying}&mute=${isMuted}`;
      }
    } catch (e) {
      console.error("Error parsing video URL", e);
    }
    return null;
  };

  const embedUrl = getEmbedUrl(url);
  const isDirectVideo = React.useMemo(() => {
    if ((url as any) instanceof File || url instanceof Blob) return true;
    if (typeof url !== "string") return false;
    if (url.startsWith("data:video/")) return true;
    
    // Check for common video extensions even with query params
    const cleanUrl = url.split("?")[0].toLowerCase();
    return cleanUrl.endsWith(".mp4") || 
           cleanUrl.endsWith(".webm") || 
           cleanUrl.endsWith(".ogg") || 
           cleanUrl.endsWith(".mov") ||
           url.includes("firebasestorage.googleapis.com"); // Common for Firebase videos
  }, [url]);

  const isProfile = isProfileUrl(url);

  const [shouldRenderIframe, setShouldRenderIframe] = React.useState(false);

  React.useEffect(() => {
    if (isInView && !isProfile) {
      const timer = setTimeout(() => {
        setShouldRenderIframe(true);
      }, 100); // Small delay to allow scroll to settle
      return () => clearTimeout(timer);
    } else {
      setShouldRenderIframe(false);
    }
  }, [isInView, isProfile]);

  const handleRipple = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    window.dispatchEvent(new CustomEvent("custom-ripple", { detail: { x: clientX, y: clientY } }));
  };

  if (isDirectVideo) {
    return (
      <div 
        className={`relative w-full h-full bg-black overflow-hidden ${minimal ? 'pointer-events-none' : ''}`} 
        ref={containerRef}
        onMouseDown={handleRipple}
        onTouchStart={handleRipple}
      >
        {/* Blurred Background for Premium Feel - Only in non-minimal mode and non-mobile */}
        {!minimal && mediaUrl && (
          <video 
            src={mediaUrl} 
            className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-40 scale-110 pointer-events-none hidden md:block"
            muted
            playsInline
            autoPlay={isInView}
            loop
          />
        )}
        {mediaUrl && (
          <video 
            ref={videoRef}
            key={mediaUrl}
            src={mediaUrl} 
            className="relative w-full h-full object-contain z-10"
            playsInline
            muted={isMuted}
            loop
            preload="metadata"
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            onMouseDown={handleRipple}
            onTouchStart={handleRipple}
            onLoadedData={() => onReady?.()}
            onCanPlay={() => onReady?.()}
            onError={() => onReady?.()}
          />
        )}
        {/* Subtle Watermark */}
        {!minimal && (
          <div className="absolute bottom-24 right-6 z-20 pointer-events-none">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              className="text-[10px] font-black text-white tracking-[0.4em] uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
            >
              renufashionhub.in
            </motion.p>
          </div>
        )}
      </div>
    );
  }

  if (isProfile) {
    return (
      <div className="w-full h-full bg-white/5 flex flex-col items-center justify-center p-6 text-center" ref={(el) => { if (el) { containerRef.current = el; onReady?.(); } }}>
        <div className="p-4 rounded-full bg-white/5 border border-white/10 mb-4">
          <Globe className="w-8 h-8 text-white/20" />
        </div>
        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Profile Link</p>
        <a 
          href={url as string} 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
        >
          View Profile
        </a>
      </div>
    );
  }

  return (
    <div 
      className={`w-full h-full bg-black/20 relative ${minimal ? 'pointer-events-none' : ''}`} 
      ref={containerRef}
      onMouseDown={handleRipple}
      onTouchStart={handleRipple}
    >
      {shouldRenderIframe && embedUrl ? (
        <>
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            loading="lazy"
          />
          {/* Transparent overlay to catch clicks for ripples without blocking iframe (using pointer-events: none is not enough, so we use a small delay or just accept it) */}
          {/* Actually, if we want ripples, we need to catch the click. 
              We'll use a transparent div that dispatches ripple and then becomes pointer-events: none for a moment? 
              No, that's too complex. Let's just use a div that dispatches ripple and the iframe is behind it.
              But then the user can't click play.
              Wait! If we use a custom play button, we can handle everything.
          */}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Play className="w-8 h-8 text-white/20 animate-pulse" />
        </div>
      )}
    </div>
  );
});

const CustomCursor = ({ theme, isMobile }: { theme: string, isMobile: boolean }) => {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const currentDotPos = useRef<{ x: number, y: number }>({ x: -100, y: -100 });
  const addRippleRef = useRef<(x: number, y: number) => void>(() => {});

  useEffect(() => {
    const addRipple = (x: number, y: number) => {
      const id = Date.now() + Math.random();
      setRipples((prev) => [...prev, { id, x, y }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    };
    addRippleRef.current = addRipple;
  }, []);

  useEffect(() => {
    if (isMobile) return;
    let targetX = -100;
    let targetY = -100;
    let dotX = -100;
    let dotY = -100;
    let ringX = -100;
    let ringY = -100;
    let isPointer = false;
    let isClicking = false;
    let requestRef: number;
    let lastScrollRippleTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      currentDotPos.current = { x: targetX, y: targetY };
      
      const target = e.target as HTMLElement;
      isPointer = window.getComputedStyle(target).cursor === "pointer" || 
                  target.tagName === "BUTTON" || 
                  target.tagName === "A" ||
                  !!target.closest("button") || 
                  !!target.closest("a");
    };

    const handleMouseDown = () => {
      isClicking = true;
    };

    const handleMouseUp = () => {
      isClicking = false;
    };

    // Scroll triggers for ripples removed as requested

    const tick = () => {
      const dotEase = 0.25;
      const ringEase = 0.12;
      
      dotX += (targetX - dotX) * dotEase;
      dotY += (targetY - dotY) * dotEase;
      
      ringX += (targetX - ringX) * ringEase;
      ringY += (targetY - ringY) * ringEase;

      currentDotPos.current = { x: dotX, y: dotY };

      if (targetX === -100) {
        if (dotRef.current) dotRef.current.style.opacity = "0";
        if (ringRef.current) ringRef.current.style.opacity = "0";
      } else {
        if (dotRef.current) dotRef.current.style.opacity = "1";
        if (ringRef.current) ringRef.current.style.opacity = "1";
      }

      let dotScale = 1;
      let ringScale = 1;
      let borderW = "2px";

      if (isClicking) {
        dotScale = 0.5;
        ringScale = 1.3;
      } else if (isPointer) {
        dotScale = 1.4;
        ringScale = 1.8;
        borderW = "1px";
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotX - 6}px, ${dotY - 6}px, 0) scale(${dotScale})`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX - 20}px, ${ringY - 20}px, 0) scale(${ringScale})`;
        ringRef.current.style.borderWidth = borderW;
      }

      requestRef = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    
    // Scroll and wheel listeners for ripples removed as requested

    requestRef = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      // Scroll cleanups removed
      cancelAnimationFrame(requestRef);
    };
  }, [isMobile]);

  useEffect(() => {
    const handleMouseDownGlobal = (e: MouseEvent) => {
      const { x, y } = currentDotPos.current;
      if (x !== -100 && y !== -100) {
        addRippleRef.current(x, y);
      } else {
        addRippleRef.current(e.clientX, e.clientY);
      }
    };

    const handleCustomRippleGlobal = (e: any) => {
      if (e.detail) {
        addRippleRef.current(e.detail.x, e.detail.y);
      }
    };

    window.addEventListener("mousedown", handleMouseDownGlobal, { passive: true });
    window.addEventListener("custom-ripple", handleCustomRippleGlobal);

    return () => {
      window.removeEventListener("mousedown", handleMouseDownGlobal);
      window.removeEventListener("custom-ripple", handleCustomRippleGlobal);
    };
  }, []);

  return (
    <>
      {!isMobile && (
        <div className="hidden md:block pointer-events-none fixed inset-0 z-[100000]">
          <div
            ref={dotRef}
            style={{ opacity: 0, position: 'fixed', left: 0, top: 0, width: '12px', height: '12px' }}
            className="bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-[opacity] duration-150 ease-out gpu-accelerated"
          />
          <div
            ref={ringRef}
            style={{ opacity: 0, position: 'fixed', left: 0, top: 0, width: '40px', height: '40px' }}
            className="border-2 border-amber-500/40 rounded-full transition-[opacity] duration-200 ease-out gpu-accelerated"
          />
        </div>
      )}

      {/* Ripple Effect (Desktop & Mobile) */}
      <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              initial={{ opacity: 0.8, scale: 0 }}
              animate={{ opacity: 0, scale: isMobile ? 4 : 6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute w-12 h-12 border-4 border-amber-500 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.6)] gpu-accelerated"
              style={{ 
                left: ripple.x,
                top: ripple.y,
                marginLeft: '-24px',
                marginTop: '-24px'
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

const PremiumButton = ({ children, onClick, className = "", variant = "primary", icon: Icon }: { children: React.ReactNode, onClick?: (e?: any) => void, className?: string, variant?: "primary" | "secondary", icon?: any }) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover="hover"
      whileTap="tap"
      initial="initial"
      className={`group relative overflow-hidden px-6 py-4 rounded-2xl font-black text-sm transition-all duration-500 will-change-transform ${className} ${
        variant === "primary" 
          ? "border-2 border-amber-500 text-amber-500" 
          : "border-2 border-white/20 text-white"
      }`}
    >
      <motion.div
        variants={{
          initial: { y: "100%" },
          hover: { y: 0 },
          tap: { scale: 0.95 }
        }}
        transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
        className={`absolute inset-0 -z-10 ${variant === "primary" ? "bg-amber-500" : "bg-white"}`}
      />
      <motion.div
        variants={{
          initial: { color: variant === "primary" ? "#f59e0b" : "#ffffff" },
          hover: { color: variant === "primary" ? "#0b1512" : "#000000" }
        }}
        transition={{ duration: 0.3 }}
        className="relative z-10 flex items-center justify-center gap-3"
      >
        {Icon && <Icon className="w-5 h-5 transition-colors duration-300" />}
        {children}
      </motion.div>
    </motion.button>
  );
};

const InteractiveStarRating = ({ rating, onChange, theme, triggerSuccess }: { rating: number; onChange: (rating: number) => void; theme: string; triggerSuccess?: boolean }) => {
  const [activeRating, setActiveRating] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointer = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const starWidth = width / 5;
    const newRating = Math.ceil(x / starWidth);
    const clampedRating = Math.max(1, Math.min(5, newRating));
    
    setActiveRating(clampedRating);
    onChange(clampedRating);
  };

  return (
    <div 
      ref={containerRef}
      className="flex gap-4 py-6 cursor-pointer touch-none select-none items-center justify-center"
      onPointerDown={(e) => {
        containerRef.current?.setPointerCapture(e.pointerId);
        handlePointer(e);
      }}
      onPointerMove={(e) => {
        if (containerRef.current?.hasPointerCapture(e.pointerId)) {
          handlePointer(e);
        }
      }}
      onPointerUp={(e) => {
        containerRef.current?.releasePointerCapture(e.pointerId);
        setActiveRating(null);
      }}
      onPointerCancel={(e) => {
        containerRef.current?.releasePointerCapture(e.pointerId);
        setActiveRating(null);
      }}
    >
      {[1, 2, 3, 4, 5].map((star, idx) => {
        const isActive = star <= (activeRating ?? rating);
        const isCurrentActive = star === activeRating;
        
        return (
          <motion.div
            key={star}
            animate={triggerSuccess ? {
              scale: [1, 1.4, 1.1, 1],
              rotate: [0, 15, -15, 0],
              color: "#eab308"
            } : { 
              scale: isCurrentActive ? 1.8 : 1,
              y: isCurrentActive ? -12 : 0,
              color: isActive ? "#eab308" : (theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")
            }}
            transition={triggerSuccess ? {
              duration: 0.5,
              delay: idx * 0.05,
              ease: "easeInOut"
            } : { type: "spring", stiffness: 500, damping: 30 }}
            className="relative"
          >
            <Star 
              className={`w-10 h-10 ${isActive ? "fill-current" : ""}`} 
            />
            {isCurrentActive && (
              <motion.div 
                layoutId="star-glow"
                className="absolute inset-0 bg-yellow-500/40 blur-3xl rounded-full -z-10"
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

const PageNotFoundPage = ({ theme, navigate }: { theme: string; navigate: any }) => {
  useEffect(() => {
    document.title = "404 Not Found - Renu Fashion Hub";
  }, []);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center overflow-hidden relative ${
      theme === "dark" ? "gold-grain-dark text-stone-100" : "gold-grain-light text-stone-900"
    }`}>
      {/* luxury background visual elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full relative z-10 flex flex-col items-center p-8 rounded-3xl border border-amber-500/15 bg-white/[0.02] dark:bg-white/[0.04] backdrop-blur-xl shadow-2xl"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <span className="text-[11px] uppercase tracking-[0.25em] font-black text-amber-600 dark:text-amber-400 mb-2 select-none">
          RENU FASHION HUB
        </span>

        {/* Big 404 display */}
        <motion.h1 
          className="text-5xl font-sans font-black tracking-tight text-amber-950 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-amber-400 dark:to-yellow-200 mb-3 select-none 404-not-found-text"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        >
          404 Not Found
        </motion.h1>

        <div className="h-0.5 w-16 bg-amber-500/30 mb-4" />

        <p className="text-stone-500 dark:text-stone-300 font-sans text-sm leading-relaxed tracking-wide mb-8">
          The requested page does not exist on this website. Please return to Renu Fashion Hub's homepage to explore the boutique creations!
        </p>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/")}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-sans font-black text-xs uppercase tracking-widest shadow-[0_10px_25px_rgba(217,119,6,0.3)] hover:from-amber-500 hover:to-amber-400 transition-all cursor-pointer"
          id="notfound-back-home-btn"
        >
          Back To Homepage ✨
        </motion.button>
      </motion.div>
    </div>
  );
};

const ContactSupportAndFaq = ({ theme }: { theme: string }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "How can I schedule an elite styling session with Renu Agarwal Studio?",
      a: "Simply write to us using the inquiry form above with your styling preferences, or send an email directly to support@renufashionhub.in. Our consultation concierge coordinates custom online or in-studio style audits within 12 to 24 hours."
    },
    {
      q: "What elements are essential for Google to index a boutique contact page successfully?",
      a: "Search engines like Google index a contact page when it possesses structured contact metadata (JSON-LD schema), crawlable text links, rapid loading speeds, clean responsive styling, and dynamic meta elements (page titles & index/follow meta tags). Our systems have implemented all these core SEO parameters to ensure prompt indexation."
    },
    {
      q: "What services are offered in the Styling Consultant Lounge?",
      a: "We specialize in personalized premium styling curation, collection auditing, lookbook curation, custom fitting consultations, event wardrobe design, and direct style matching."
    },
    {
      q: "Is there any registration fee for custom couture styling inquiries?",
      a: "No, submitting an inquiry through our styling consultant form or support email is completely free. Dedicated multi-hour custom curations are calculated following your initial free styling advice."
    }
  ];

  return (
    <div className="space-y-6 mt-8">
      {/* Support Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`p-6 rounded-3xl border text-center relative overflow-hidden ${
          theme === "dark" 
            ? "bg-white/[0.03] border-white/10 text-stone-200" 
            : "bg-white border-amber-500/15 text-stone-700 shadow-sm"
        } transition-all duration-300`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black tracking-[0.25em] text-amber-600 dark:text-amber-400 block mb-1">
              Direct Mail Boutique Support
            </span>
            <span className="text-xs text-stone-400 block mb-2">
              Have complex styling questions or high-priority couture orders? Email us directly:
            </span>
            <a 
              href="mailto:support@renufashionhub.in"
              className="text-lg font-serif font-bold text-amber-800 dark:text-amber-100 hover:text-amber-500 dark:hover:text-amber-300 transition-colors inline-block"
              id="contact-support-email-badge"
            >
              support@renufashionhub.in
            </a>
          </div>
        </div>
      </motion.div>

      {/* FAQ Label */}
      <div className="pt-4 pb-2 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/15 text-[10px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Consultation Lounge FAQs</span>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-4 max-w-3xl mx-auto w-full">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
              className={`rounded-2xl border transition-all duration-300 shadow-xs overflow-hidden ${
                theme === "dark" 
                  ? isOpen 
                    ? "bg-[#0E1F1A] border-amber-500/35 shadow-md"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                  : isOpen
                    ? "bg-amber-50/40 border-amber-500/30 shadow-md"
                    : "bg-white border-stone-200 hover:bg-stone-50/60 hover:border-amber-500/20"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full text-left px-5 py-4.5 sm:px-6 sm:py-5 flex items-center justify-between gap-4 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500/30 rounded-t-2xl"
              >
                <span className={`text-sm sm:text-base font-sans font-bold tracking-tight leading-snug transition-colors duration-200 ${
                  theme === "dark" 
                    ? isOpen ? "text-amber-300" : "text-amber-100 hover:text-amber-300" 
                    : isOpen ? "text-amber-950 font-extrabold" : "text-stone-900 hover:text-amber-900"
                }`}>
                  {faq.q}
                </span>
                <ChevronDown 
                  className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                    theme === "dark" 
                      ? isOpen ? "text-amber-300 rotate-180" : "text-amber-400"
                      : isOpen ? "text-amber-700 rotate-180" : "text-amber-600"
                  }`} 
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <div className={`px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm leading-relaxed border-t pt-4 ${
                      theme === "dark" 
                        ? "text-stone-200 bg-stone-950/20 border-white/5" 
                        : "text-stone-700 bg-stone-50/40 border-amber-500/10"
                    }`}>
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const ProductDetailPage = ({ products, theme, navigate, isLoaded }: { products: any[]; theme: string; navigate: any; isLoaded: boolean }) => {
  const { id } = useParams();
  const product = products.find(p => p.id.toString() === id || p.docId === id);
  const [newReview, setNewReview] = useState({ user: "", rating: 5, comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [triggerSuccessStars, setTriggerSuccessStars] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const reviewsContainerRef = useRef<HTMLDivElement>(null);

  if (!product) {
    if (!isLoaded) {
      return <PageLoader theme={theme} />;
    }
    return (
      <div className={`min-h-screen ${theme === "dark" ? "bg-[#0B1512] text-amber-50" : "bg-[#FDFBF7] text-[#1C1B18]"} flex items-center justify-center p-6`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <button onClick={() => navigate("/")} className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 rounded-xl text-stone-950 font-bold hover:opacity-90">Back to Home</button>
        </div>
      </div>
    );
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.user || !newReview.comment) return;
    setIsSubmittingReview(true);
    try {
      const response = await fetch(`/api/products/${product.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newReview)
      });

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      const result = await response.json();
      const review = result.review;

      // Update product's reviews in local state so it displays immediately
      product.reviews = [...(product.reviews || []), review];
      
      setNewReview({ user: "", rating: 5, comment: "" });

      // Animate star rating components
      setTriggerSuccessStars(true);
      setTimeout(() => {
        setTriggerSuccessStars(false);
      }, 1500);

      // Smooth scroll to the top of the reviews section once submitted
      setTimeout(() => {
        reviewsContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);

    } catch (error) {
      console.error("Error adding review:", error);
      alert("Failed to add review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCopyProductLink = () => {
    const linkToCopy = product.buyUrl || window.location.href;
    navigator.clipboard.writeText(linkToCopy)
      .then(() => {
        setShowCopiedToast(true);
        setTimeout(() => {
          setShowCopiedToast(false);
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy link: ", err);
      });
  };  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen ${theme === "dark" ? "bg-[#0B1512] text-amber-50" : "bg-[#FDFBF7] text-[#1C1B18]"} p-4 sm:p-6 pb-24`}
    >
      <div className="max-w-4xl lg:max-w-6xl mx-auto">
        <button 
          onClick={() => navigate("/")} 
          className={`mb-6 p-2.5 rounded-xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border flex items-center gap-2 group transition-all hover:bg-amber-500/10 hover:border-amber-500/50 w-fit cursor-pointer`}
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          <span className="text-xs font-bold uppercase tracking-wider">Back to Showcase</span>
        </button>

        {/* Responsive Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-start">
          
          {/* Image Left Column - sticky on desktop to prevent visual emptiness */}
          <div className="md:col-span-5 md:sticky md:top-6">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-xl relative group">
              <MediaImage url={product.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Details Right Column */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Header info */}
            <div className={`p-6 rounded-2xl ${theme === "dark" ? "bg-white/[0.02] border-white/5" : "bg-white border-stone-150"} border shadow-sm space-y-2`}>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                Premium Apparel Curation
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight leading-tight">{product.name}</h1>
              <div className="flex items-center gap-3 pt-2">
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">₹{product.price}</p>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  In stock
                </span>
              </div>
            </div>

            {/* Description Card */}
            {product.description && (
              <div className={`p-6 rounded-2xl ${theme === "dark" ? "bg-white/[0.02] border-white/5" : "bg-white border-stone-150"} border shadow-sm`}>
                <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">Editor's Note</h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${theme === "dark" ? "text-stone-300" : "text-stone-700"} whitespace-pre-wrap`}>
                  {product.description}
                </p>
              </div>
            )}

            {/* CTA action card */}
            <div className={`p-4 rounded-2xl ${theme === "dark" ? "bg-amber-500/[0.01] border-amber-500/10" : "bg-amber-500/[0.03] border-amber-500/15"} border shadow-sm flex flex-col sm:flex-row gap-3`}>
              {product.buyUrl && (
                <PremiumButton
                  onClick={() => window.open(product.buyUrl, "_blank")}
                  className="flex-[2] py-3.5"
                  icon={ShoppingBag}
                >
                  Buy Now
                </PremiumButton>
              )}
              <button
                onClick={() => setShowShareModal(true)}
                className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-95 ${
                  theme === "dark" 
                    ? "bg-white/5 hover:bg-white/10 border-white/10 text-amber-50" 
                    : "bg-black/5 hover:bg-black/10 border-black/10 text-[#1C1B18]"
                } ${product.buyUrl ? 'flex-1' : 'w-full'} cursor-pointer`}
                title="Share & Copy Link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </button>
            </div>

            {/* Reviews Block */}
            <div ref={reviewsContainerRef} className="space-y-6 pt-2 scroll-mt-24">
              <div className="flex items-center justify-between border-b border-amber-500/10 pb-3">
                <h3 className="text-base font-black uppercase tracking-wider font-serif">Customer Reviews</h3>
                <div className="flex items-center gap-1.5 bg-yellow-500/5 px-2.5 py-1 rounded-lg border border-yellow-500/10">
                  <motion.div
                    animate={triggerSuccessStars ? {
                      scale: [1, 1.5, 1],
                      rotate: [0, 360],
                    } : {}}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  </motion.div>
                  <span className="text-sm font-bold text-yellow-500">
                    {product.reviews?.length > 0 
                      ? (product.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / product.reviews.length).toFixed(1)
                      : "0.0"}
                  </span>
                  <span className="text-xs opacity-40">({product.reviews?.length || 0})</span>
                </div>
              </div>

              {/* Grid layout for Reviews content to optimize space usage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Write a layout block (card 1) */}
                <form onSubmit={handleReviewSubmit} className={`p-5 rounded-2xl ${theme === "dark" ? "bg-white/[0.01] border-white/5" : "bg-stone-50/50 border-stone-150"} border space-y-3.5 h-fit`}>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-40">Post Feedback</p>
                  <InteractiveStarRating 
                    rating={newReview.rating} 
                    onChange={(r) => setNewReview({ ...newReview, rating: r })} 
                    theme={theme}
                    triggerSuccess={triggerSuccessStars}
                  />
                  <input 
                    type="text"
                    placeholder="Your Name"
                    required
                    value={newReview.user}
                    onChange={(e) => setNewReview({ ...newReview, user: e.target.value })}
                    className={`w-full text-xs ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-stone-200"} border rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500/50`}
                  />
                  <textarea 
                    placeholder="Describe your styling experience..."
                    required
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    rows={2}
                    className={`w-full text-xs ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-stone-200"} border rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500/50 resize-none`}
                  />
                  <button 
                    type="submit"
                    disabled={isSubmittingReview || !newReview.user || !newReview.comment}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-[#09100E] font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingReview ? "Submitting..." : "Submit"}
                  </button>
                </form>

                {/* Reviews list scrollable container (card 2) */}
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>
                    {product.reviews?.length > 0 ? (
                      [...product.reviews].reverse().map((review: any, idx: number) => (
                        <motion.div 
                          key={review.id || idx} 
                          initial={{ opacity: 0, y: 15, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.35, ease: "easeOut" }}
                          className={`p-4 rounded-xl ${theme === "dark" ? "bg-white/[0.02] border-white/5" : "bg-white border-stone-150"} border shadow-sm`}
                        >
                          <div className="flex justify-between items-start mb-1.5">
                            <div>
                              <p className="text-xs font-bold text-stone-900 dark:text-amber-50 leading-none">{review.user}</p>
                              <div className="flex gap-0.5 mt-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star key={s} className={`w-2.5 h-2.5 ${s <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-white/10"}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-[9px] opacity-40">{new Date(review.date).toLocaleDateString()}</p>
                          </div>
                          <p className={`text-xs leading-relaxed ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>{review.comment}</p>
                        </motion.div>
                      ))
                    ) : (
                      <div className={`p-8 text-center rounded-xl border ${theme === "dark" ? "bg-white/[0.01] border-white/5" : "bg-stone-50 border-stone-150"} border-dashed flex flex-col items-center justify-center`}>
                        <Star className="w-8 h-8 text-yellow-500/20 mb-2" />
                        <p className="text-xs opacity-45 italic">No reviews yet. Be the first to share your thoughts!</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Copy Link Toast Notification */}
      <AnimatePresence>
        {showCopiedToast && (
          <motion.div 
            initial={{ opacity: 0, y: 55, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] px-6 py-3.5 rounded-full ${
              theme === "dark" 
                ? "bg-amber-500 text-stone-950 shadow-amber-500/20 border border-amber-400/20" 
                : "bg-stone-900 text-stone-50 shadow-black/20 border border-stone-800"
            } font-extrabold text-xs tracking-wider uppercase flex items-center gap-2 shadow-2xl transition-all`}
          >
            <Check className="w-4 h-4 animate-bounce" />
            Link Copied!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            profileName={product.name}
            customUrl={`http://renufashionhub.in/product/${product.id}`}
            customTitle={`Renu Fashion Hub - Check out ${product.name}`}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const DEFAULT_PRIVACY_POLICY = `Last Updated: June 2026

Welcome to Renu Fashion Hub ("we," "our," or "us"). We value your privacy and are committed to protecting the information of our visitors. This Privacy Policy explains how information is collected, used, and protected when you visit our website.

By using this website, you agree to the terms outlined in this Privacy Policy.

1. About Our Website

Renu Fashion Hub is an informational and affiliate-based website that publishes fashion-related content, product recommendations, reviews, buying guides, comparisons, and promotional content.

Our goal is to help users discover products and make informed purchasing decisions. We do not manufacture, sell, ship, or directly provide the products listed on this website unless explicitly stated otherwise.

2. No Purchase Obligation

We do not force, pressure, or require any visitor to purchase any product or service.

Any product recommendation, review, ranking, comparison, or buying guide published on this website is provided for informational purposes only.

The final decision to purchase any product or service is entirely your own responsibility.

You are encouraged to conduct your own research before making any purchase.

3. Affiliate Disclosure

Some links on this website may be affiliate links.

This means that if you click on certain links and make a purchase, we may earn a small commission from the seller or affiliate network at no additional cost to you.

These commissions help us maintain and improve the website.

Affiliate relationships do not influence our commitment to providing honest and useful content.

4. Product Information Disclaimer

We strive to provide accurate product information, including:

Prices
Discounts
Features
Specifications
Availability
Ratings

However, product details may change at any time without notice.

Because products are managed by third-party sellers and marketplaces, we cannot guarantee that all information displayed on our website will always remain accurate or up to date.

Users should verify product details directly from the seller's website before making any purchase.

5. No Responsibility for Third-Party Purchases

When you click an external or affiliate link, you may be redirected to a third-party website.

Any transaction, purchase, payment, refund request, warranty claim, return request, delivery issue, or dispute occurs directly between you and the third-party seller.

We are not responsible for:

Product quality
Product authenticity
Delivery delays
Damaged products
Seller behavior
Refund processing
Return policies
Warranty claims
Payment issues

Any concerns regarding a purchase should be addressed directly with the seller or marketplace involved.

6. Information We Collect

We may collect limited information such as:

Information You Voluntarily Provide
Name
Email address
Contact information
Messages submitted through forms
Automatically Collected Information
Browser type
Device type
IP address
Pages visited
Time spent on pages
Referral sources
General analytics data

7. Cookies

Our website may use cookies and similar technologies to:

Improve website performance
Remember preferences
Analyze traffic
Enhance user experience
Measure marketing effectiveness

You may disable cookies through your browser settings at any time.

Some website features may not function properly if cookies are disabled.

8. Analytics Services

We may use analytics services such as:

Google Analytics
Google Search Console
Other analytics platforms

These tools help us understand website performance and visitor behavior.

Analytics providers may collect data according to their own privacy policies.

9. Advertising Services

We may display advertisements through third-party advertising partners.

Advertising partners may use cookies and similar technologies to provide relevant advertisements.

We do not control how third-party advertising providers collect or process information.

Users should review the privacy policies of those providers separately.

10. External Links

Our website may contain links to:

Fashion brands
Online stores
Affiliate partners
Blogs
Social media platforms
Third-party websites

We are not responsible for the privacy practices, security, content, policies, products, or services offered by external websites.

Visiting external websites is done at your own discretion and risk.

11. User Responsibility

By using this website, you acknowledge that:

Product recommendations are opinions and informational content.
You are responsible for your purchasing decisions.
You should independently verify information before purchasing.
You assume responsibility for any actions taken based on information found on this website.

12. No Professional Advice

The content on Renu Fashion Hub is provided for general informational purposes only.

Nothing on this website should be considered:

Legal advice
Financial advice
Tax advice
Medical advice
Professional consulting advice

Users should consult qualified professionals where appropriate.

13. Limitation of Liability

To the fullest extent permitted by law, Renu Fashion Hub shall not be liable for:

Direct damages
Indirect damages
Incidental damages
Consequential damages
Lost profits
Data loss
Purchase-related losses
Business interruptions

arising from the use of this website or reliance on any information provided herein.

14. Data Security

We take reasonable measures to protect information against unauthorized access, alteration, disclosure, or destruction.

However, no method of online transmission or storage can be guaranteed to be 100% secure.

Users acknowledge that they provide information at their own risk.

15. Children's Privacy

This website is not specifically directed toward children under the age required by applicable laws.

We do not knowingly collect personal information from children.

If such information is discovered, reasonable efforts will be made to remove it.

16. Changes to This Privacy Policy

We reserve the right to modify, update, or replace this Privacy Policy at any time without prior notice.

Any updates will be reflected by revising the "Last Updated" date at the top of this page.

Continued use of the website after changes constitutes acceptance of the updated policy.

17. Contact Us

If you have any questions regarding this Privacy Policy, please contact us:

Website: https://renufashionhub.in
Email: info@renufashionhub.in

Renu Fashion Hub is committed to transparency, responsible recommendations, and helping users make informed shopping decisions. All purchasing decisions remain solely the responsibility of the user.`;

export const DEFAULT_TERMS_OF_SERVICE = `Last Updated: June 2026

Welcome to Renu Fashion Hub. By accessing or using this website, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you should discontinue use of this website immediately.

1. Acceptance of Terms

By visiting, browsing, or using Renu Fashion Hub, you acknowledge that you have read, understood, and agreed to these Terms of Service, our Privacy Policy, Disclaimer, and any other policies published on this website.

Your continued use of this website constitutes your acceptance of these terms.

2. Purpose of the Website

Renu Fashion Hub is a fashion-focused informational and affiliate platform that may provide:

Fashion trends
Product recommendations
Buying guides
Product reviews
Fashion news
Style tips
Affiliate links
Promotional content

The information provided on this website is intended for general informational purposes only.

3. User Responsibility

By using this website, you agree that:

You are responsible for your own decisions and actions.
You will independently evaluate products before making purchases.
You will not rely solely on information provided on this website.
You use the website at your own risk.

4. No Purchase Requirement

Renu Fashion Hub does not force, require, pressure, or encourage users to purchase any product.

Any product, service, recommendation, review, ranking, comparison, or buying guide published on this website is provided solely for informational purposes.

The decision to purchase any product or service remains entirely with the user.

5. Affiliate Relationships

Some links on this website may be affiliate links.

If you click an affiliate link and complete a purchase, we may receive a commission from the merchant at no additional cost to you.

These commissions help support website operations and content creation.

Affiliate partnerships do not guarantee endorsement, warranty, or responsibility for any product.

6. Third-Party Websites

This website may contain links to third-party websites, online stores, advertisers, marketplaces, or service providers.

We do not own or control third-party websites.

We are not responsible for:

Content
Products
Services
Pricing
Security
Privacy practices
Policies
Transactions

Users access third-party websites entirely at their own risk.

7. Product Accuracy Disclaimer

We make reasonable efforts to provide accurate information.

However, we do not guarantee:

Product availability
Product pricing
Product descriptions
Product specifications
Product ratings
Product images
Product discounts

Information may change without notice.

Users should always verify information directly with the seller before making a purchase.

8. Purchases, Payments, Refunds and Returns

Renu Fashion Hub does not process payments, ship products, issue refunds, handle returns, or provide warranties for products listed through affiliate links.

All purchases are conducted between the user and the third-party seller.

Any issues regarding:

Payments
Refunds
Returns
Exchanges
Delivery
Product defects
Warranty claims

must be resolved directly with the relevant seller or platform.

9. Intellectual Property

Unless otherwise stated, all content on this website including:

Text
Graphics
Branding
Designs
Layouts
Images created by us

is protected by applicable intellectual property laws.

You may not copy, reproduce, distribute, republish, or commercially exploit our content without prior written permission.

10. Prohibited Activities

Users must not:

Attempt to hack or disrupt the website
Upload malicious software
Abuse website features
Scrape website content without permission
Engage in unlawful activities through the website
Impersonate another person or organization

Violation of these terms may result in restricted access.

11. User-Generated Content

If users submit comments, feedback, suggestions, reviews, or messages:

You grant us the right to display, moderate, edit, or remove such content.
You confirm that your content does not violate any laws or third-party rights.
We reserve the right to remove content at our discretion.

12. No Warranties

This website is provided on an "as is" and "as available" basis.

We make no guarantees regarding:

Accuracy
Reliability
Availability
Performance
Security
Error-free operation

Use of the website is entirely at your own risk.

13. Limitation of Liability

To the maximum extent permitted by law, Renu Fashion Hub, its owners, operators, affiliates, contributors, and partners shall not be liable for:

Direct damages
Indirect damages
Incidental damages
Consequential damages
Financial losses
Lost profits
Data loss
Business interruptions
Product-related losses

arising from the use of this website or reliance on its content.

14. Indemnification

You agree to defend, indemnify, and hold harmless Renu Fashion Hub from any claims, liabilities, losses, damages, costs, or expenses resulting from:

Your use of the website
Violation of these Terms
Violation of any applicable laws
Infringement of third-party rights

15. Website Availability

We reserve the right to:

Modify the website
Suspend services
Remove content
Restrict access
Discontinue features

at any time without prior notice.

16. Changes to These Terms

We may update these Terms of Service at any time.

Updated versions will be posted on this page with a revised "Last Updated" date.

Continued use of the website after changes constitutes acceptance of the revised Terms.

17. Governing Law

These Terms of Service shall be governed and interpreted in accordance with applicable laws.

Any disputes arising from the use of this website shall be subject to the jurisdiction of the appropriate courts as required by law.

18. Contact Information

For questions regarding these Terms of Service, contact:

Website: https://renufashionhub.in
Email: shiva3344a@gmail.com

By accessing or using Renu Fashion Hub, you acknowledge that you have read, understood, and agreed to these Terms of Service.`;

export const DEFAULT_DISCLAIMER = `Last Updated: June 2026

Welcome to the official digital platform of Renu Fashion Hub.

The extensive, curated information provided across all sections of this digital hub is published in absolute good faith and is intended solely for general informational, educational, and aesthetic style-guidance purposes.

By accessing, browsing, exploring, or interacting with any part of this website, you explicitly acknowledge, understand, and agree to the comprehensive terms and conditions outlined in this Disclaimer. If you do not agree with any of these statements, you should discontinue use.

1. General Information & Purpose

Renu Fashion Hub provides deeply analytical and curated digital content focusing primarily on:

• Indian Ethnic Wear and Modern Silhouette Trends
• Step-by-step styling manuals, layering rules, and bespoke aesthetic guidelines
• Independent, research-driven product curations and textile material reviews
• Guided purchase suggestions and capsule wardrobe organization layouts
• Global fashion inspirations, local boutique narratives, and runway updates
• Affiliate promotional partner channels

All materials and ideas published on Renu Fashion Hub represent the subjective opinions and critical evaluations of our style curators. They are provided solely for inspiration and educational discovery.

2. No Mandatory Purchase Obligation or Commercial Pressure

Renu Fashion Hub operates with a strictly informational, non-custodial model. We do not sell products directly, nor do we force, pressure, require, mandate, or encourage any visitor to buy any apparel, accessory, or service listed on our site.

Every recommendation, product review, ranking index, trend scorecard, or style comparison published here serves as purely educational references to assist you in navigating your shopping journey.

The ultimate, absolute decision to buy any item lies with you as the end consumer. We highly recommend that you exercise due diligence, weigh your personal financial comfort, and conduct your own independent product investigations prior to clicking any checkout button.

3. Affiliate Disclosure & Commission Policy

In full compliance with international digital advertising guidelines and honest transparency practices, Renu Fashion Hub discloses that some outbound links on our pages are affiliate links.

When you click on these links and transition to third-party marketplaces (such as Meesho, Amazon, Myntra, or trusted brand boutiques) and complete a transaction, Renu Fashion Hub may receive a small affiliate commission.

This commission is paid entirely by the partner seller or affiliate network at absolutely no additional cost to you.

These modest referral premiums are utilized entirely to support the continuous research, technical maintenance, domain registration, server scaling, and editorial efforts of our hub, enabling us to keep our styling tips and reviews entirely free to the public. Our commitment to honest curation remains uncompromised by our affiliate partners.

4. Product Information Accuracy & Pricing Disclaimer

While we invest substantial effort, time, and attention into keeping all product descriptions, pricing points, discounts, and sizing coordinates updated, we make no guarantees about their absolute accuracy.

The digital marketplace is dynamic; therefore, we cannot guarantee:

• Real-time retail Pricing fluctuations
• Specific percentage Discounts or coupon codes
• Immediate item Stock Availability
• Intricate material fabrics or Manufacturer specifications
• Overall merchant Ratings and review averages
• Official image colors or pattern representations

Sellers and retail facilitators reserve the right to alter features without prior notification, and some entries on our site may become outdated. Users are encouraged to verify all critical specs directly on the vendor checkouts.

5. Third-Party Websites & External Routing

Our platform contains various routing paths directing visitors to external fashion storefronts and social systems.

We do not own, control, moderate, or monitor these third-party platforms, and we take no liability for their:

• Material quality, shipping timelines, or refund processes
• Legal policies, cookie configurations, or local security layers
• Editorial correctness, community guidelines, or marketing practices

Any transaction, dispute, or customer assistance case you initiate is handled exclusively by that vendor, entirely outside our knowledge or system.

6. No Professional Advice or Diagnosis

The creative guides and articles on Renu Fashion Hub do not constitute professional advice. Our content must never be treated as:

• Professional legal counsel
• Financial planning or budgeting consulting
• Certifiable styling certifications
• Medical skin or dermatological textile testing

Always consult with accredited style professionals, fit models, or certified material experts when seeking specific aesthetic parameters.

7. Full Limitation of Liability

Renu Fashion Hub, including its authors, administrators, and curators, shall not be held responsible for any direct, indirect, incidental, consequential, special, or financial losses of any kind, arising from:

• Your voluntary use or trust of the platform
• Purchasing selections made at affiliate vendor sites
• Erroneous product details or typographical bugs
• Any temporary system outages or technical glitches

Browsing and relying on our materials is performed solely and fully at your own personal risk.

8. Accuracy of Information & Continuous Updates

All resources, guidelines, and articles on this platform are provided "as is" and "as available". We provide no warranties, whether express or implied, regarding the reliability or completeness of any material published on our channel.

9. Voluntary Consent to Terms

By proceeding to explore the styling cards, blogs, or products of Renu Fashion Hub, you declare that you have thoroughly read, fully comprehended, and unconditionally accepted all the disprovals detailed inside this document.

10. Contacting the Hub

If you have questions, please reach out to us at:

Website: https://renufashionhub.in
Support queries: support@renufashionhub.in
Corporate notices: info@renufashionhub.in`;

const AboutPage = ({ 
  theme, 
  navigate, 
  profile,
  products,
  blogs,
  posts,
  isProductsLoaded,
  isBlogsLoaded,
  isPostsLoaded,
  productsError,
  blogsError,
  postsError
}: { 
  theme: string; 
  navigate: any; 
  profile: any;
  products: any[];
  blogs: any[];
  posts: any[];
  isProductsLoaded: boolean;
  isBlogsLoaded: boolean;
  isPostsLoaded: boolean;
  productsError: boolean;
  blogsError: boolean;
  postsError: boolean;
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": "https://renufashionhub.in/about",
        "url": "https://renufashionhub.in/about",
        "name": "About Renu Fashion Hub | Premium Fashion Blog & Curated Style Guides",
        "description": "Discover Renu Fashion Hub, founded by Renu Agarwal. We empower fashion choices through style inspiration, fashion trends, expert product recommendations, and in-depth shopping guides.",
        "publisher": {
          "@type": "Organization",
          "name": "Renu Fashion Hub",
          "url": "https://renufashionhub.in",
          "logo": {
            "@type": "ImageObject",
            "url": "https://renufashionhub.in/logo.png"
          }
        },
        "mainEntity": {
          "@type": "Person",
          "name": "Renu Agarwal",
          "jobTitle": "Founder & Creative Director",
          "description": "Renu Agarwal is the founder of Renu Fashion Hub, with a deep passion for contemporary style, authentic recommendations, and lifestyle curation."
        }
      },
      {
        "@type": "Organization",
        "@id": "https://renufashionhub.in/#organization",
        "name": "Renu Fashion Hub",
        "url": "https://renufashionhub.in",
        "logo": "https://renufashionhub.in/logo.png",
        "founder": {
          "@type": "Person",
          "name": "Renu Agarwal"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "email": "support@renufashionhub.in",
          "contactType": "customer support"
        }
      }
    ]
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen ${theme === "dark" ? "bg-[#0B1512] text-amber-50" : "bg-[#FDFBF7] text-[#1C1B18]"} p-4 sm:p-6 pb-24 font-sans selection:bg-amber-500/30 overflow-x-hidden`}
    >
      {/* Insert JSON-LD Schema dynamically inside the document */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>

      <div className="max-w-5xl lg:max-w-6xl mx-auto">
        {/* Back button and App Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 border-b border-amber-500/10 pb-6">
          <button 
            onClick={() => navigate("/")} 
            className={`p-3 rounded-xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border flex items-center gap-2 group transition-all hover:bg-amber-500/10 hover:border-amber-500/50 w-fit cursor-pointer`}
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-bold uppercase tracking-wider">Back to Home</span>
          </button>
          
          <div className="text-right">
            <p className="text-xl font-black uppercase tracking-wider font-serif text-amber-500">
              Renu Fashion Hub
            </p>
            <p className={`text-[10px] uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} font-bold`}>
              Premium Curation & Trust
            </p>
          </div>
        </div>

        {/* 1. HERO SECTION */}
        <section className="text-center mb-16 relative">
          <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-10">
            <Sparkles className="w-48 h-48 text-amber-500 blur-sm animate-pulse" />
          </div>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/15">
              Welcome to Renu Fashion Hub
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-serif text-stone-900 dark:text-stone-50 leading-tight max-w-2xl mx-auto">
              About Renu Fashion Hub
            </h1>
            <p className={`text-sm sm:text-base max-w-xl mx-auto leading-relaxed ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>
              Renu Fashion Hub is your ultimate online fashion platform. We help style seekers discover contemporary fashion trends, timeless style inspiration, research-backed shopping guides, and curated fashion recommendations to simplify shopping and refine your personal style.
            </p>
            <div className="pt-4">
              <button
                onClick={() => navigate("/blog")}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-stone-950 font-black text-xs uppercase tracking-widest transition-all shadow-[0_10px_25px_rgba(217,119,6,0.25)] hover:shadow-[0_15px_30px_rgba(217,119,6,0.35)] active:scale-95 flex items-center gap-2 mx-auto cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                Explore Fashion Trends
              </button>
            </div>
          </motion.div>
        </section>

        {/* 2. OUR STORY SECTION */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`p-8 md:p-12 rounded-3xl ${theme === "dark" ? "bg-white/[0.02] border-white/10" : "bg-white border-stone-200"} border shadow-xl mb-12`}
        >
          <div className="flex items-center gap-3 border-b border-amber-500/25 pb-6 mb-8">
            <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-amber-500/10 text-amber-400" : "bg-amber-500/5 text-amber-600"} border border-amber-500/20`}>
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-black font-serif text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                Our Story
              </h3>
              <p className={`text-[10px] uppercase tracking-widest font-bold ${theme === "dark" ? "text-amber-400/60" : "text-amber-600/70"}`}>
                Behind Renu Fashion Hub
              </p>
            </div>
          </div>
          <div className={`space-y-6 text-sm leading-relaxed ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>
            <p>
              Renu Fashion Hub was founded by <strong>Renu Agarwal</strong> with a singular, clear vision: to establish an authoritative, transparent, and trusted destination where style seekers can cut through the clutter and discover the actual cream of contemporary fashion insights. In a fast-paced retail ecosystem where thousands of products vie for attention, finding what truly suits your lifestyle can feel overwhelming.
            </p>
            <p>
              As an expert style curator with a profound passion for aesthetics, <strong>Renu Agarwal</strong> set out to design a comprehensive space that unifies up-to-date fashion trends, structured style guides, and genuine product recommendations. Our fashion blog provides in-depth analysis, helpful styling tips, and transparent buying guides so you are equipped with verified information prior to making any shopping decision.
            </p>
            <p>
              By aligning lifestyle trends with user-focused clarity, Renu Fashion Hub is proud to serve as your daily digital stylist, fostering confidence and clarity with every single article published.
            </p>
          </div>
        </motion.section>

        {/* 3 & 4. MISSION & VISION SECTION */}
        <motion.section 
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          {/* Mission */}
          <div className={`p-8 rounded-3xl ${theme === "dark" ? "bg-white/[0.02] border-white/10" : "bg-white border-stone-200"} border shadow-md flex flex-col justify-between`}>
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-amber-500">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Our Mission</h3>
              </div>
              <h4 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
                Bringing Value, Clarity, and Artistry to Daily Fashion
              </h4>
              <p className={`text-xs sm:text-sm leading-relaxed ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>
                Our singular focus is to democratize style and provide high-fidelity, actionable trend suggestions. We strive to:
              </p>
              <ul className="space-y-2.5 pt-2">
                {[
                  "To make premium fashion trends accessible for everyone",
                  "To provide deeply researched, trustworthy fashion info",
                  "To help users make intelligent, informed purchasing decisions",
                  "To share practical fashion knowledge, layering, and style inspiration",
                  "To simplify and refine the chaotic online fashion discovery process"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs">
                    <span className="text-amber-500 mt-1">✔</span>
                    <span className={theme === "dark" ? "text-stone-300" : "text-stone-700"}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Vision */}
          <div className={`p-8 rounded-3xl ${theme === "dark" ? "bg-white/[0.02] border-white/10" : "bg-white border-stone-200"} border shadow-md flex flex-col justify-between`}>
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 text-amber-500">
                <Globe className="w-5 h-5" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Our Vision</h3>
              </div>
              <h4 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
                Setting New Standards in Fashion Education & Trust
              </h4>
              <p className={`text-xs sm:text-sm leading-relaxed ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>
                Renu Fashion Hub envisions becoming the chief premium style guide and online fashion platform trusted globally. We seek to foster lifestyle literacy by constantly upgrading our editorial practices, providing unparalleled trend breakdowns, and continuing with a strict quality-first curation.
              </p>
              <p className={`text-xs leading-relaxed italic ${theme === "dark" ? "text-amber-200/50" : "text-amber-900/60"}`}>
                "We envisage a platform where users don't just shop, but learn the core mechanics of personal branding, dressing aesthetics, and seasonal wardrobe balance."
              </p>
            </div>
          </div>
        </motion.section>

        {/* 5. WHAT WE OFFER */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <div className="text-center mb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Dynamic Deliverables</span>
            <h3 className="text-2xl font-black font-serif uppercase tracking-tight text-stone-900 dark:text-stone-200 mt-1">
              What We Offer
            </h3>
            <p className={`text-xs max-w-md mx-auto ${theme === "dark" ? "text-stone-400" : "text-stone-600"} mt-1`}>
              Every piece of our publishing framework is designed to elevate your fashion intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { title: "Fashion Trends", text: "Keeping you ahead with fresh, seasonal highlights of contemporary runway and street apparel.", icon: Sparkles },
              { title: "Style Guides", text: "Calculated look-books, structure formulas, and layout principles to perfect daily styling.", icon: BookOpen },
              { title: "Product Recs", text: "Handpicked, verified selections of fashion essentials sorted for fit and premium fabric.", icon: ShoppingBag },
              { title: "Buying Guides", text: "Thorough aesthetic and cost comparisons to help you buy what fits and lasts.", icon: CheckCircle2 },
              { title: "Fashion Inspiration", text: "Sourcing beautiful ideas, designer notes, and aesthetic pairings for visual inspiration.", icon: Sparkles },
              { title: "Seasonal Wardrobe", text: "Ensuring you transition beautifully through spring, monsoon, fall, and winter.", icon: Sun },
              { title: "Fashion News", text: "Delivering important highlights of global trends, capsule releases, and luxury releases.", icon: Layers },
              { title: "Styling Tips", text: "Essential styling tips on accessorizing, color coordinates, and smart tailoring hacks.", icon: CheckCircle2 }
            ].map((offer, idx) => (
              <motion.div 
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                key={idx} 
                className={`p-5 rounded-2xl border transition-all hover:shadow-lg ${
                  theme === "dark" ? "bg-white/[0.01] hover:bg-white/[0.03] border-white/5" : "bg-white hover:bg-stone-50/50 border-stone-200"
                }`}
              >
                <div className={`p-2 rounded-xl w-fit ${theme === "dark" ? "bg-amber-500/10 text-amber-400" : "bg-amber-500/5 text-amber-600"} border border-amber-500/10 mb-3`}>
                  <offer.icon className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-black uppercase text-stone-900 dark:text-stone-200 tracking-tight mb-1.5">{offer.title}</h4>
                <p className={`text-xs leading-relaxed ${theme === "dark" ? "text-stone-400" : "text-stone-600"}`}>{offer.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 6 & 9. WHY TRUST US & EDITORIAL STANDARDS (E-E-A-T) */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`p-8 md:p-12 rounded-3xl ${theme === "dark" ? "bg-gradient-to-br from-emerald-950/10 via-[#0B1512] to-amber-950/10 border-white/10" : "bg-white border-stone-200"} border shadow-xl mb-12`}
        >
          <div className="flex items-center gap-3 border-b border-amber-500/25 pb-6 mb-8">
            <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-amber-500/10 text-amber-400" : "bg-amber-500/5 text-amber-600"} border border-amber-500/20`}>
              <ShieldCheck className="w-6 h-6 text-amber-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-black font-serif text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                Our Editorial Standards & E-E-A-T
              </h3>
              <p className={`text-[10px] uppercase tracking-widest font-bold ${theme === "dark" ? "text-amber-400/60" : "text-amber-600/70"}`}>
                Experience, Expertise, Authoritativeness & Trustworthiness
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500">Why Trust Us?</h4>
              <p className="text-xs sm:text-sm">
                Renu Fashion Hub keeps you, the reader, at the center of everything. We do not accept sponsorship deals that compromise our integrity. Every style advice is compiled through:
              </p>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  <span><strong>User-Focused Content:</strong> Formulated solely to answer real reader questions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  <span><strong>Honest Recommendations:</strong> Unbiased evaluation of fit, craftsmanship, and materials.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  <span><strong>Research-Based Articles:</strong> Spending hours analyzing materials, user sentiment, and retail history.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  <span><strong>Affiliate disclosures:</strong> Clear, honest declarations of how platform funding operates.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4 border-t md:border-t-0 md:border-l border-amber-500/15 pt-6 md:pt-0 md:pl-8">
              <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500">Editorial Integrity</h4>
              <p className="text-xs sm:text-sm">
                Every fashion insights column, luxury trend review, and shopping guides catalog is held to severe standards. We write with close visual comparisons to assure absolute precision.
              </p>
              <p className="text-xs sm:text-sm">
                Our content focuses closely on:
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <div className="flex items-center gap-1.5 hover:scale-105 transition-transform">
                  <span>✨ Accuracy</span>
                </div>
                <div className="flex items-center gap-1.5 hover:scale-105 transition-transform">
                  <span>✨ Transparency</span>
                </div>
                <div className="flex items-center gap-1.5 hover:scale-105 transition-transform">
                  <span>✨ User Value</span>
                </div>
                <div className="flex items-center gap-1.5 hover:scale-105 transition-transform">
                  <span>✨ Style Relevance</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* 7. OUR VALUES */}
        <section className="mb-12">
          <div className="text-center mb-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Core Foundations</span>
            <h3 className="text-2xl font-black font-serif uppercase text-stone-900 dark:text-stone-100">Our Core Values</h3>
            <p className={`text-xs ${theme === "dark" ? "text-stone-400" : "text-stone-500"} mt-1 max-w-md mx-auto`}>
              The underlying pillars that govern our fashion research curation, trend reviews, and editorial excellence.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { val: "Transparency", desc: "We provide explicit disclosures and clear pricing details, empowering you to navigate choices with total clarity and confidence." },
              { val: "Trust & Authenticity", desc: "Every product critique and styling advice stands objective, resisting brand compensation or marketing pressure." },
              { val: "Quality over Volume", desc: "We curating only clothing items presenting superior fabric materials, robust stitching, and excellent silhouette design." },
              { val: "Fashion Education", desc: "We aim to teach readers about textile composition, layering coordinates, capsule structures, and styling mathematics." },
              { val: "Aesthetic Relevance", desc: "Sourcing contemporary runway insights and street silhouettes to keep your custom lookbooks updated ahead of seasons." },
              { val: "Reader Centricity", desc: "Every blog published aims to address real lifestyle questions, helping you look impeccable with zero purchase force." }
            ].map((item, i) => (
              <div 
                key={i} 
                className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${
                  theme === "dark" 
                    ? "bg-white/[0.01] hover:bg-white/[0.03] border-white/5 text-stone-300" 
                    : "bg-white hover:bg-stone-50/50 border-stone-150 text-stone-700"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-sm tracking-tight">
                    <span>✦</span>
                    <h4 className="font-serif font-bold text-stone-900 dark:text-amber-50 uppercase tracking-wide">{item.val}</h4>
                  </div>
                  <p className={`text-xs leading-relaxed ${theme === "dark" ? "text-stone-400" : "text-stone-600"}`}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. AFFILIATE TRANSPARENCY SECTION */}
        <section className={`p-8 rounded-3xl ${theme === "dark" ? "bg-amber-500/[0.02] border-amber-500/10 text-amber-100" : "bg-amber-500/5 border-amber-500/15 text-[#1C1B18]"} border shadow-inner mb-12`}>
          <div className="flex items-center gap-2.5 text-amber-500 mb-4">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Affiliate Curation & Disclaimer</h3>
          </div>
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
            <p>
              Some outbound links published across Renu Fashion Hub represent secure <strong>affiliate links</strong>. If you decide to complete a purchase through these retail networks, our platform may receive a direct commission from the merchant at no additional cost or premium to you. These relationships help keep our styling team funded and our articles completely free and accessible.
            </p>
            <div className={`p-4 rounded-2xl border ${theme === "dark" ? "bg-[#09100E] border-white/5" : "bg-white border-dashed border-amber-500/20"} space-y-3 font-semibold`}>
              <div className="flex items-start gap-2">
                <span className="text-amber-500">✦</span>
                <p>"We never force, pressure, or require users to purchase any product."</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-500">✦</span>
                <p>"The final purchase decision always belongs to the user."</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-500">✦</span>
                <p>"We encourage users to conduct their own thorough research before making any purchase."</p>
              </div>
            </div>
          </div>
        </section>

        {/* 10. MEET OUR FOUNDER */}
        <section className={`p-8 md:p-12 rounded-3xl ${theme === "dark" ? "bg-white/[0.02] border-white/10" : "bg-white border-stone-200"} border shadow-xl mb-12`}>
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="relative flex-shrink-0">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1 bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 shadow-xl overflow-hidden">
                <MediaImage 
                  url={profile.avatar} 
                  alt="Renu Agarwal" 
                  className={`w-full h-full rounded-full object-cover border-4 ${theme === "dark" ? "border-[#0B1512]" : "border-white"}`}
                  fallback={
                    <div className={`w-full h-full rounded-full ${theme === "dark" ? "bg-[#0B1512]" : "bg-[#FDFBF7]"} flex items-center justify-center`}>
                      <User className="w-16 h-16 text-amber-500" />
                    </div>
                  }
                />
              </div>
            </div>

            <div className="space-y-4 text-center md:text-left">
              <span className="inline-block text-[9px] font-black uppercase tracking-widest text-[#f5f5f4] bg-gradient-to-r from-amber-600 to-amber-500 px-3 py-1 rounded-md">Founder & Curator</span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif text-stone-900 dark:text-stone-50">Meet Our Founder: Renu Agarwal</h3>
              <p className={`text-sm leading-relaxed ${theme === "dark" ? "text-stone-300" : "text-stone-600"}`}>
                <strong>Renu Agarwal</strong> founded Renu Fashion Hub out of an uncompromised passion for styling, garment craftsmanship, and clean consumer choice. Driven by a wish to establish a premier style destination, Renu dedicates her daily schedules to evaluating fit styles, researching upcoming palettes, and organizing shopping reviews.
              </p>
              <p className={`text-xs italic ${theme === "dark" ? "text-amber-300/80" : "text-amber-700"}`}>
                "True style is not about spending; it's about smart curation, fit coordination, and dressing with ultimate authenticity." — Renu Agarwal
              </p>
            </div>
          </div>
        </section>

        {/* 11. COMPANY STATISTICS */}
        <CompanyStatisticsSection 
          theme={theme}
          productsCount={products.length}
          blogsCount={blogs.length}
          postsCount={posts.length}
          isProductsLoaded={isProductsLoaded}
          isBlogsLoaded={isBlogsLoaded}
          isPostsLoaded={isPostsLoaded}
          productsError={productsError}
          blogsError={blogsError}
          postsError={postsError}
        />

        {/* 12. FAQ SECTION */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600">Frequently Asked Inquiries</span>
            <h3 className="text-2xl font-black font-serif uppercase tracking-tight text-stone-900 dark:text-stone-200 mt-1">
              Questions & Answers
            </h3>
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            {[
              {
                q: "What is Renu Fashion Hub?",
                a: "Renu Fashion Hub is a premium fashion blog, style guide, and digital curation platform founded by Renu Agarwal. We track daily fashion trends, organize custom buying guides, share practical styling tips, and review clothing recommendations to simplify wardrobe creation."
              },
              {
                q: "How do product recommendations work?",
                a: "Our product recommendations are chosen by evaluating the premium selection of current retail trends. We evaluate clothing base fabrics, seam qualities, contemporary designs, and direct user feedback first. Only authentic, highly graded apparel enters our lists."
              },
              {
                q: "Does Renu Fashion Hub sell products directly?",
                a: "No. Renu Fashion Hub is purely an informational style guide and affiliate curation website. We never ship, store, or sell clothing directly. Instead, we link you seamlessly to trusted retail merchants where purchases can be processed securely."
              },
              {
                q: "Are affiliate links used on the website?",
                a: "Yes. When readers purchase apparel through our outbound buttons, we may earn an affiliate commission from the seller. This supports our platform content and keeps our style research totally free for our global viewers. It does not inflate item prices."
              },
              {
                q: "How can I contact Renu Fashion Hub?",
                a: "You can write back to our team directly at support@renufashionhub.in or info@renufashionhub.in. We love reviewing trend requests, community styling questions, and advertising/curation proposals!"
              }
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx} 
                  className={`border rounded-2xl transition-all duration-300 overflow-hidden shadow-sm ${
                    theme === "dark" 
                      ? "bg-[#0E1A16] border-stone-800 hover:border-amber-500/30 hover:shadow-md" 
                      : "bg-white border-stone-200 hover:border-amber-500/30 hover:shadow-md"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className={`w-full p-5 text-left flex justify-between items-center font-bold text-sm transition-colors duration-200 gap-4 focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                      theme === "dark"
                        ? "text-amber-100 hover:text-amber-400 bg-stone-900/10 hover:bg-[#12231E]/40"
                        : "text-stone-900 hover:text-amber-950 bg-stone-50/10 hover:bg-stone-50/60"
                    }`}
                  >
                    <span className="font-serif text-sm sm:text-base font-bold tracking-wide">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform duration-300 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`px-5 pb-5 text-xs sm:text-sm leading-relaxed border-t border-amber-500/10 pt-4 ${
                          theme === "dark"
                            ? "text-stone-300 bg-[#07100D]/30"
                            : "text-stone-600 bg-stone-50/30"
                        }`}
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* 13. CONTACT SECTION */}
        <section className={`p-8 rounded-3xl ${theme === "dark" ? "bg-white/[0.02] border-white/10" : "bg-white border-stone-200"} border text-center shadow-lg mb-12 max-w-2xl mx-auto`}>
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-500 mb-4 border border-amber-500/15">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-50 mb-1">Get In Touch With Renu Fashion Hub</h3>
          <p className={`text-xs max-w-sm mx-auto leading-relaxed ${theme === "dark" ? "text-stone-400" : "text-stone-600"} mb-6`}>
            Have styling questions? Do you want to submit clothing reviews, seek fashion tips, or provide feedback? Write directly to us and our support team will reply inside 24 hours.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
            <div className={`p-4 rounded-2xl border ${theme === "dark" ? "bg-black/20 border-white/5" : "bg-stone-50 border-stone-150"} space-y-1`}>
              <span className={`block text-[8px] font-black uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>Support Inquiries</span>
              <a href="mailto:support@renufashionhub.in" className="block text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline">
                support@renufashionhub.in
              </a>
            </div>
            <div className={`p-4 rounded-2xl border ${theme === "dark" ? "bg-black/20 border-white/5" : "bg-stone-50 border-stone-150"} space-y-1`}>
              <span className={`block text-[8px] font-black uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>General Information</span>
              <a href="mailto:info@renufashionhub.in" className="block text-xs sm:text-sm font-bold text-[#b45309] dark:text-amber-400 hover:underline">
                info@renufashionhub.in
              </a>
            </div>
          </div>
        </section>

        {/* 14. CALL TO ACTION & SEO PHRASE CLUSTER */}
        <section className="text-center space-y-5 py-8">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-stone-900 dark:text-stone-50 uppercase">
            Start Exploring Fashion With Confidence
          </h3>
          <p className={`text-xs max-w-sm mx-auto leading-normal ${theme === "dark" ? "text-stone-400" : "text-stone-600"}`}>
            Unleash your aesthetic flair. Discover daily look-books, compare pricing with our buying guides, and accessorize utilizing tailored clothing reviews.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3.5 rounded-xl border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/10 active:scale-95 text-xs uppercase tracking-widest transition-all cursor-pointer"
            >
              Back to Showroom
            </button>
            <button
              onClick={() => navigate("/blog")}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-[#09100E] font-black hover:scale-105 active:scale-95 text-xs uppercase tracking-widest transition-all shadow-[0_4px_16px_rgba(217,119,6,0.15)] cursor-pointer"
            >
              Browse Style Guides
            </button>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

const renderLegaleseMarkup = (text: string, theme: string, listItems: string[]) => {
  const lines = (text || "").split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={idx} className="h-2" />;
    }

    // Check for Section Headings like "1. General Information"
    const sectionHeadingRegex = /^\d+\.\s+(.+)$/;
    if (sectionHeadingRegex.test(trimmed)) {
      return (
        <motion.h3 
          key={idx} 
          initial={{ opacity: 0, x: -15 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={`text-base md:text-lg font-black uppercase tracking-wide mt-8 mb-3 pt-6 border-t first:border-0 first:pt-0 ${
            theme === "dark" ? "text-amber-400 border-white/5" : "text-amber-700 border-black/5"
          }`}
        >
          {trimmed}
        </motion.h3>
      );
    }

    // Check for "Last Updated:" Line
    if (trimmed.startsWith("Last Updated:")) {
      return (
        <motion.p 
          key={idx} 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`text-xs font-black uppercase tracking-wider mb-4 ${
            theme === "dark" ? "text-amber-400/80" : "text-amber-600/80"
          }`}
        >
          {trimmed}
        </motion.p>
      );
    }

    // Subheadings and special layout anchors
    const isSubHeading = trimmed === "Welcome to Renu Fashion Hub" || 
                         trimmed === "Information You Voluntarily Provide" || 
                         trimmed === "Automatically Collected Information" ||
                         trimmed === "Support:" ||
                         trimmed === "Information:";
                         
    if (isSubHeading) {
      return (
        <motion.h4 
          key={idx} 
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: 0.4 }}
          className={`text-sm md:text-base font-extrabold tracking-tight mt-5 mb-2 block ${
            theme === "dark" ? "text-amber-200" : "text-amber-900"
          }`}
        >
          {trimmed}
        </motion.h4>
      );
    }

    const isListItem = listItems.includes(trimmed) || trimmed.startsWith("- ") || trimmed.startsWith("• ");
    const cleanLine = trimmed.replace(/^\s*[-\u2022\u25CF]\s*/, "");

    // Parse inline bold syntax (**text**) and emails / URLs
    const boldParts = cleanLine.split('**');
    const inlineFormatted = boldParts.map((part, index) => {
      const isBold = index % 2 === 1;
      
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      
      let elements: any[] = [];
      let lastIdx = 0;
      const matches: { index: number; text: string; type: 'email' | 'url' }[] = [];
      let match;
      
      emailRegex.lastIndex = 0;
      urlRegex.lastIndex = 0;
      
      while ((match = emailRegex.exec(part)) !== null) {
        matches.push({ index: match.index, text: match[0], type: 'email' });
      }
      while ((match = urlRegex.exec(part)) !== null) {
        matches.push({ index: match.index, text: match[0], type: 'url' });
      }
      matches.sort((a, b) => a.index - b.index);
      
      for (const m of matches) {
        if (m.index < lastIdx) continue;
        if (m.index > lastIdx) {
          elements.push(part.substring(lastIdx, m.index));
        }
        if (m.type === 'email') {
          elements.push(
            <a 
              key={m.index} 
              href={`mailto:${m.text}`} 
              className="underline font-bold transition-all text-amber-500 hover:text-amber-400"
            >
              {m.text}
            </a>
          );
        } else {
          elements.push(
            <a 
              key={m.index} 
              href={m.text} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="underline font-bold transition-all text-amber-500 hover:text-amber-400"
            >
              {m.text}
            </a>
          );
        }
        lastIdx = m.index + m.text.length;
      }
      
      if (lastIdx < part.length) {
        elements.push(part.substring(lastIdx));
      }

      const content = elements.length > 0 ? elements : part;
      if (isBold) {
        return <strong key={index} className="font-extrabold text-amber-600 dark:text-amber-400">{content}</strong>;
      }
      return content;
    });

    if (isListItem) {
      return (
        <motion.div 
          key={idx} 
          initial={{ opacity: 0, x: 8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.4 }}
          className="flex items-start gap-2.5 pl-5 py-1"
        >
          <span className={`text-[12px] mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full ${theme === "dark" ? "bg-amber-400/80" : "bg-amber-600/80"}`} />
          <span className={`text-sm ${theme === "dark" ? "text-stone-300" : "text-stone-700"} font-medium`}>
            {inlineFormatted}
          </span>
        </motion.div>
      );
    }

    return (
      <motion.p 
        key={idx} 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className={`text-sm leading-relaxed ${theme === "dark" ? "text-stone-300" : "text-stone-700"} font-medium`}
      >
        {inlineFormatted}
      </motion.p>
    );
  });
};

export const DEFAULT_ABOUT_STORY = `Renu Fashion Hub was founded by **Renu Agarwal** with a singular, clear vision: to establish an authoritative, transparent, and trusted destination where style seekers can cut through the clutter and discover the actual cream of contemporary fashion insights. In a fast-paced retail ecosystem where thousands of products vie for attention, finding what truly suits your lifestyle can feel overwhelming.

As an expert style curator with a profound passion for aesthetics, **Renu Agarwal** set out to design a comprehensive space that unifies up-to-date fashion trends, structured style guides, and genuine product recommendations. Our fashion blog provides in-depth analysis, helpful styling tips, and transparent buying guides so you are equipped with verified information prior to making any shopping decision.

By aligning lifestyle trends with user-focused clarity, Renu Fashion Hub is proud to serve as your daily digital stylist, fostering confidence and clarity with every single article published.`;

const PrivacyPolicyPage = ({ profile, theme, navigate }: { profile: any; theme: string; navigate: any }) => {
  const policyText = profile.privacyPolicy || DEFAULT_PRIVACY_POLICY;

  const privacyListItems = [
    "Prices",
    "Discounts",
    "Features",
    "Specifications",
    "Availability",
    "Ratings",
    "Product quality",
    "Product authenticity",
    "Delivery delays",
    "Damaged products",
    "Seller behavior",
    "Refund processing",
    "Return policies",
    "Warranty claims",
    "Payment issues",
    "Improve website performance",
    "Remember preferences",
    "Analyze traffic",
    "Enhance user experience",
    "Measure marketing effectiveness",
    "Fashion brands",
    "Online stores",
    "Affiliate partners",
    "Blogs",
    "Social media platforms",
    "Third-party websites",
    "Product recommendations are opinions and informational content.",
    "You are responsible for your purchasing decisions.",
    "You should independently verify information before purchasing.",
    "You assume responsibility for any actions taken based on information found on this website.",
    "Legal advice",
    "Financial advice",
    "Tax advice",
    "Medical advice",
    "Professional consulting advice",
    "Direct damages",
    "Indirect damages",
    "Incidental damages",
    "Consequential damages",
    "Lost profits",
    "Data loss",
    "Purchase-related losses",
    "Business interruptions",
    "Name",
    "Email address",
    "Contact information",
    "Messages submitted through forms",
    "Browser type",
    "Device type",
    "IP address",
    "Pages visited",
    "Time spent on pages",
    "Referral sources",
    "General analytics data"
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen ${theme === "dark" ? "bg-[#0B1512]" : "bg-[#FDFBF7]"} p-6 pb-24 font-sans`}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <button 
            onClick={() => navigate("/")} 
            className={`p-3 rounded-xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border flex items-center gap-2 group transition-all hover:bg-amber-500/10 hover:border-amber-500/50 w-fit cursor-pointer`}
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-bold uppercase tracking-wider">Back to Home</span>
          </button>
          
          <div className="text-right">
            <p className="text-xl font-black uppercase tracking-wider font-serif text-amber-500">
              Renu Fashion Hub
            </p>
            <p className={`text-[10px] uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} font-bold`}>
              Official Privacy Policy
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className={`p-8 md:p-12 rounded-3xl ${theme === "dark" ? "bg-white/[0.02] border-white/10" : "bg-white border-stone-200"} border shadow-xl`}
        >
          <div className="flex items-center gap-3 border-b border-amber-500/25 pb-6 mb-8">
            <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-amber-500/10 text-amber-400" : "bg-amber-500/5 text-amber-600"} border border-amber-500/20`}>
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-serif text-amber-950 dark:text-amber-100 uppercase tracking-tight">
                Privacy Policy
              </h1>
              <p className={`text-[10.5px] uppercase tracking-widest font-bold ${theme === "dark" ? "text-amber-400/60" : "text-amber-600/70"}`}>
                Transparency & Trust Statement
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {renderLegaleseMarkup(policyText, theme, privacyListItems)}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const DisclaimerPage = ({ profile, theme, navigate }: { profile: any; theme: string; navigate: any }) => {
  const disclaimerText = profile.disclaimer || DEFAULT_DISCLAIMER;

  useEffect(() => {
    // Dynamically inject/overwrite high-quality SEO meta tags
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', 'Official disclaimer policy for Renu Fashion Hub. All content is for informational and educational use only, clarifying purchase choices and affiliate parameters.');

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', 'https://www.renufashionhub.in/disclaimer');
  }, []);

  const disclaimerListItems = [
    "Products",
    "Services",
    "Pricing",
    "Refunds",
    "Returns",
    "Delivery",
    "Product Quality",
    "Warranty Claims",
    "Fashion trends",
    "Style guides",
    "Product recommendations",
    "Buying guides",
    "Fashion inspiration",
    "Lifestyle content",
    "Affiliate marketing content",
    "Legal advice",
    "Financial advice",
    "Tax advice",
    "Medical advice",
    "Professional consulting advice"
  ];

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Disclaimer Policy - Renu Fashion Hub",
    "description": "Official legal limitations, no purchase obligations statement, and affiliate commission relationships disclosure of Renu Fashion Hub.",
    "url": "https://www.renufashionhub.in/disclaimer",
    "publisher": {
      "@type": "Organization",
      "name": "Renu Fashion Hub",
      "url": "https://renufashionhub.in"
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen ${theme === "dark" ? "bg-[#0B1512]" : "bg-[#FDFBF7]"} p-4 sm:p-6 pb-24 font-sans`}
    >
      {/* Dynamic structured JSON-LD data for maximum SEO impact */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>

      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <button 
            onClick={() => navigate("/")} 
            className={`p-3 rounded-xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border flex items-center gap-2 group transition-all hover:bg-amber-500/10 hover:border-amber-500/50 w-fit cursor-pointer`}
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-bold uppercase tracking-wider">Back to Home</span>
          </button>
          
          <div className="text-right">
            <p className="text-xl font-black uppercase tracking-wider font-serif text-amber-500">
              Renu Fashion Hub
            </p>
            <p className={`text-[10px] uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} font-bold`}>
              Official Disclaimer
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className={`p-8 md:p-12 rounded-3xl ${theme === "dark" ? "bg-white/[0.02] border-white/10" : "bg-white border-stone-200"} border shadow-xl`}
        >
          <div className="flex items-center gap-3 border-b border-amber-500/25 pb-6 mb-8">
            <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-amber-500/10 text-amber-400" : "bg-amber-500/5 text-amber-600"} border border-amber-500/20`}>
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-serif text-amber-950 dark:text-amber-100 uppercase tracking-tight">
                Disclaimer
              </h1>
              <p className={`text-[10.5px] uppercase tracking-widest font-bold ${theme === "dark" ? "text-amber-400/60" : "text-amber-600/70"}`}>
                Legal Limitations & Disclosures
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {renderLegaleseMarkup(disclaimerText, theme, disclaimerListItems)}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const TermsOfServicePage = ({ profile, theme, navigate }: { profile: any; theme: string; navigate: any }) => {
  const termsText = profile.termsOfService || DEFAULT_TERMS_OF_SERVICE;

  const tosListItems = [
    "Fashion trends",
    "Product recommendations",
    "Buying guides",
    "Product reviews",
    "Fashion news",
    "Style tips",
    "Affiliate links",
    "Promotional content",
    "You are responsible for your own decisions and actions.",
    "You will independently evaluate products before making purchases.",
    "You will not rely solely on information provided on this website.",
    "You use the website at your own risk.",
    "Content",
    "Products",
    "Services",
    "Pricing",
    "Security",
    "Privacy practices",
    "Policies",
    "Transactions",
    "Product availability",
    "Product pricing",
    "Quality of third-party products",
    "Authenticity",
    "Delivery times",
    "Damaged shipments",
    "Sellers' descriptions",
    "Returns eligibility",
    "Warranties",
    "Payment disputes",
    "Direct damages",
    "Indirect damages",
    "Incidental damages",
    "Consequential damages",
    "Lost profits",
    "Business interruption",
    "Loss of data",
    "Intellectual property infringement",
    "Unauthorized account access",
    "Legal advice",
    "Financial advice",
    "Tax advice",
    "Medical advice",
    "Professional consulting advice",
    "The website and all content are provided as is.",
    "No guarantees of website uptime or performance.",
    "The admin reserves the right to modify or terminate services without notice.",
    "The admin of Renu Fashion Hub is not a seller, broker, or agent of the products recommended.",
    "The admin is not a party to any transaction you enter into with a third-party seller.",
    "The admin cannot resolve disputes between you and a product seller."
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen ${theme === "dark" ? "bg-[#0B1512]" : "bg-[#FDFBF7]"} p-6 pb-24 font-sans`}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <button 
            onClick={() => navigate("/")} 
            className={`p-3 rounded-xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border flex items-center gap-2 group transition-all hover:bg-amber-500/10 hover:border-amber-500/50 w-fit cursor-pointer`}
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-bold uppercase tracking-wider">Back to Home</span>
          </button>
          
          <div className="text-right">
            <p className="text-xl font-black uppercase tracking-wider font-serif text-amber-500">
              Renu Fashion Hub
            </p>
            <p className={`text-[10px] uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} font-bold`}>
              Official Terms & Conditions
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className={`p-8 md:p-12 rounded-3xl ${theme === "dark" ? "bg-white/[0.02] border-white/10" : "bg-white border-stone-200"} border shadow-xl`}
        >
          <div className="flex items-center gap-3 border-b border-amber-500/25 pb-6 mb-8">
            <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-amber-500/10 text-amber-400" : "bg-amber-500/5 text-amber-600"} border border-amber-500/20`}>
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-serif text-amber-950 dark:text-amber-100 uppercase tracking-tight">
                Terms of Service
              </h1>
              <p className={`text-[10.5px] uppercase tracking-widest font-bold ${theme === "dark" ? "text-amber-400/60" : "text-amber-600/70"}`}>
                Legal Agreement & User Obligations
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {renderLegaleseMarkup(termsText, theme, tosListItems)}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};





const BlogListPage = ({ blogs, theme, navigate, isLoaded }: { blogs: any[]; theme: string; navigate: any; isLoaded: boolean }) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (blog.excerpt && blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (blog.category && blog.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const featuredBlog = filteredBlogs[0];
  const gridBlogs = featuredBlog ? filteredBlogs.slice(1) : [];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen ${theme === "dark" ? "bg-[#0B1512] text-amber-50" : "bg-[#FDFBF7] text-[#1C1B18]"} p-6 pb-24`}
    >
      <div className="max-w-5xl lg:max-w-6xl mx-auto">
        {/* Back button and App Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <button 
            onClick={() => navigate("/")} 
            className={`p-3 rounded-xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border flex items-center gap-2 group transition-all hover:bg-amber-500/10 hover:border-amber-500/50 w-fit`}
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-bold uppercase tracking-wider">Back to Home</span>
          </button>
          
          <div className="text-right">
            <h1 className="text-2xl font-black font-serif tracking-tight text-amber-600 dark:text-amber-400">FASHION STORIES</h1>
            <p className={`text-[9px] ${theme === "dark" ? "text-white/40" : "text-black/40"} uppercase tracking-widest font-black`}>Renu Agarwal Vlogs & Blog Hub</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === "dark" ? "text-white/30" : "text-black/30"}`} />
          <input 
            type="text" 
            placeholder="Search fashion articles, trends..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white placeholder-white/30" : "bg-black/5 border-black/10 text-black placeholder-black/40"} border rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors text-sm font-bold shadow-inner`}
          />
        </div>

        {!isLoaded ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs text-stone-500 font-bold uppercase tracking-widest mt-4">Loading Blogs...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="py-20 text-center">
            <p className={`text-sm ${theme === "dark" ? "text-white/40" : "text-black/40"} font-black uppercase tracking-widest`}>No articles found</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Featured Post */}
            {featuredBlog && !searchQuery && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className={`group cursor-pointer overflow-hidden rounded-3xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border p-6 flex flex-col md:flex-row gap-6 hover:border-amber-405/40 transition-all`}
                onClick={() => navigate(`/blog/${featuredBlog.id}`)}
              >
                {featuredBlog.image && (
                  <div className="w-full md:w-1/2 h-64 md:h-80 overflow-hidden rounded-2xl relative">
                    <MediaImage 
                      url={featuredBlog.image} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      alt={featuredBlog.title}
                    />
                    {featuredBlog.category && (
                      <span className="absolute top-4 left-4 text-[9px] font-black uppercase tracking-widest bg-amber-500 text-stone-950 px-2.5 py-1 rounded-full shadow-lg">
                        {featuredBlog.category}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-center py-2 h-full">
                  <p className={`text-[10px] ${theme === "dark" ? "text-amber-400/60" : "text-amber-800/80"} font-black uppercase tracking-widest mb-2`}>
                    FEATURED ENTRY • {new Date(featuredBlog.timestamp || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <h2 className={`text-2xl md:text-3xl font-bold font-serif leading-tight mb-4 group-hover:text-amber-500 transition-colors`}>
                    {featuredBlog.title}
                  </h2>
                  <p className={`text-sm ${theme === "dark" ? "text-white/60" : "text-black/60"} leading-relaxed mb-6 font-medium`}>
                    {featuredBlog.excerpt || "Dive into this wonderful story directly from our creative collection of trends and insights."}
                  </p>
                  <div className="flex items-center gap-2 group-hover:gap-3 transition-all font-black text-xs uppercase tracking-widest text-amber-500 mt-auto">
                    <span>Read Article</span>
                    <span className="text-sm">→</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Grid of Other Posts */}
            {gridBlogs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gridBlogs.map((blog, idx) => (
                  <motion.div 
                    key={blog.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`group cursor-pointer overflow-hidden rounded-3xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border p-4 flex flex-col hover:border-amber-400/40 transition-all`}
                    onClick={() => navigate(`/blog/${blog.id}`)}
                  >
                    {blog.image && (
                      <div className="w-full h-48 overflow-hidden rounded-2xl relative mb-4">
                        <MediaImage 
                          url={blog.image} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          alt={blog.title}
                        />
                        {blog.category && (
                          <span className="absolute top-3 left-3 text-[8px] font-black uppercase tracking-widest bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full shadow-lg">
                            {blog.category}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex-1 flex flex-col">
                      <p className={`text-[9px] ${theme === "dark" ? "text-white/40" : "text-black/40"} uppercase tracking-widest mb-1.5 font-bold`}>
                        {new Date(blog.timestamp || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <h3 className={`text-lg font-bold font-serif mb-2 group-hover:text-amber-500 transition-colors line-clamp-2 leading-snug`}>
                        {blog.title}
                      </h3>
                      <p className={`text-xs ${theme === "dark" ? "text-white/50" : "text-black/50"} line-clamp-3 leading-relaxed mb-4`}>
                        {blog.excerpt || "Read more details about this boutique selection..."}
                      </p>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 mt-auto">
                        Read Story <span className="text-xs">→</span>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const BlogDetailPage = ({ blogs, theme, navigate, isLoaded }: { blogs: any[]; theme: string; navigate: any; isLoaded: boolean }) => {
  const { id } = useParams();
  const blog = blogs.find(b => b.id.toString() === id || b.docId === id);

  if (!blog) {
    if (!isLoaded) {
      return <PageLoader theme={theme} />;
    }
    return (
      <div className={`min-h-screen ${theme === "dark" ? "bg-[#0B1512] text-amber-50" : "bg-[#FDFBF7] text-[#1C1B18]"} flex items-center justify-center p-6`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 font-serif">Article Not Found</h1>
          <button onClick={() => navigate("/blog")} className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 rounded-xl text-stone-950 font-bold hover:opacity-90">Back to Blogs</button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen ${theme === "dark" ? "bg-[#0B1512] text-amber-50" : "bg-[#FDFBF7] text-[#1C1B18]"} p-6 pb-24`}
    >
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate("/blog")} 
          className={`mb-8 p-3 rounded-xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border flex items-center gap-2 group transition-all hover:bg-amber-500/10 hover:border-amber-500/50 w-fit`}
        >
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-xs font-bold uppercase tracking-wider">Back to All Blogs</span>
        </button>

        {blog.image && (
          <div className="w-full h-64 sm:h-96 rounded-3xl overflow-hidden relative border border-white/5 mb-8 shadow-2xl">
            <MediaImage url={blog.image} className="w-full h-full object-cover" alt={blog.title} />
            {blog.category && (
              <span className="absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest bg-amber-500 text-stone-950 px-3 py-1 rounded-full shadow-lg">
                {blog.category}
              </span>
            )}
          </div>
        )}

        <div className="space-y-4 mb-8">
          <p className={`text-[11px] ${theme === "dark" ? "text-amber-400/80" : "text-amber-700/80"} font-black uppercase tracking-widest`}>
            Published on {new Date(blog.timestamp || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif leading-tight">
            {blog.title}
          </h1>
          <div className="w-20 h-1 bg-amber-500 rounded-full" />
        </div>

        {/* Content with elegant formatting styles */}
        <div 
          className={`prose ${theme === "dark" ? "prose-invert text-white/85" : "prose-stone text-stone-800"} max-w-none text-base leading-relaxed space-y-6 blog-content`}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </div>
    </motion.div>
  );
};

const PostDetailPage = ({ posts, products, profile, theme, navigate, isMuted, setIsMuted, isLoaded }: { posts: any[]; products: any[]; profile: any; theme: string; navigate: any; isMuted: boolean; setIsMuted: any; isLoaded: boolean }) => {
  const { id } = useParams();
  const currentIndex = posts.findIndex(p => p.id.toString() === id || p.docId === id);
  const post = posts[currentIndex];
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls]);

  if (!post) {
    if (!isLoaded) {
      return <PageLoader theme={theme} />;
    }
    return (
      <div className={`min-h-screen ${theme === "dark" ? "bg-[#0B1512] text-amber-50" : "bg-[#FDFBF7] text-[#1C1B18]"} flex items-center justify-center p-6`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <button onClick={() => navigate("/")} className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 rounded-xl text-stone-950 font-bold hover:opacity-90">Back to Home</button>
        </div>
      </div>
    );
  }

  const triggerRipple = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    window.dispatchEvent(new CustomEvent("custom-ripple", { detail: { x: clientX, y: clientY } }));
  };

  const handleNext = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    const nextIndex = (currentIndex + 1) % posts.length;
    navigate(`/post/${posts[nextIndex].id}`);
    setIsPlaying(true);
  };

  const handlePrev = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    const prevIndex = (currentIndex - 1 + posts.length) % posts.length;
    navigate(`/post/${posts[prevIndex].id}`);
    setIsPlaying(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col"
      onClick={() => setShowControls(true)}
      onMouseDown={triggerRipple}
      onTouchStart={triggerRipple}
    >
      <button 
        onClick={() => navigate("/")}
        className="absolute top-6 right-6 z-[210] p-3 rounded-full bg-black/80 md:backdrop-blur-xl text-white border border-white/10 hover:bg-black/60 transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {post.type === "video" ? (
          <div 
            className="w-full h-full" 
            onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
            onMouseDown={triggerRipple}
            onTouchStart={triggerRipple}
          >
            <VideoEmbed url={post.url} isMuted={isMuted} isPlaying={isPlaying} />
          </div>
        ) : (
          <MediaImage url={post.url} className="w-full h-full object-contain" />
        )}

        {/* Video Controls Overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center gap-8 pointer-events-none"
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handlePrev}
                onMouseDown={(e) => { e.stopPropagation(); triggerRipple(e); }}
                onTouchStart={(e) => { e.stopPropagation(); triggerRipple(e); }}
                className="p-5 rounded-full bg-black/60 md:backdrop-blur-md text-white border border-white/20 pointer-events-auto hover:bg-black/80 transition-all shadow-2xl"
              >
                <SkipBack className="w-8 h-8 fill-white" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                onMouseDown={(e) => { e.stopPropagation(); triggerRipple(e); }}
                onTouchStart={(e) => { e.stopPropagation(); triggerRipple(e); }}
                className="p-10 rounded-full bg-black/60 md:backdrop-blur-md text-white border border-white/20 pointer-events-auto hover:bg-black/80 transition-all shadow-2xl"
              >
                {isPlaying ? <Pause className="w-12 h-12 fill-white" /> : <Play className="w-12 h-12 fill-white ml-2" />}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleNext}
                onMouseDown={(e) => { e.stopPropagation(); triggerRipple(e); }}
                onTouchStart={(e) => { e.stopPropagation(); triggerRipple(e); }}
                className="p-5 rounded-full bg-black/60 md:backdrop-blur-md text-white border border-white/20 pointer-events-auto hover:bg-black/80 transition-all shadow-2xl"
              >
                <SkipForward className="w-8 h-8 fill-white" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
          <motion.button 
            whileTap={{ scale: 0.8 }}
            whileHover={{ scale: 1.15 }}
            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
            className="p-4 rounded-full bg-black/80 md:backdrop-blur-2xl text-white hover:bg-black/70 transition-all border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isMuted ? "muted" : "unmuted"}
                initial={{ opacity: 0, scale: 0.2, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.2, rotate: 45 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="flex items-center gap-4 mb-4">
          <MediaImage url={profile.avatar} className="w-12 h-12 rounded-full border-2 border-white/40 object-cover shadow-2xl" />
          <div>
            <span className="text-base font-black text-white tracking-tight leading-tight block">{profile.name}</span>
            <p className="text-xs text-white/50 font-bold tracking-wide">renufashionhub.in</p>
          </div>
        </div>

        {/* Post Caption / Description - H1 Tag for SEO dynamic compliance */}
        <h1 className="text-sm text-stone-200 mb-4 leading-relaxed line-clamp-3">
          {post.caption || post.description || post.name || `${autoDetectCategory(post.name, post.description || "")} Style Curation Guide by Renu Agarwal`}
        </h1>

        {post.taggedProducts && post.taggedProducts.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x" onWheel={(e) => { if (e.deltaY !== 0) { e.currentTarget.scrollLeft += e.deltaY; } }}>
              {post.taggedProducts.map((productId: number) => {
                const product = products.find((p: any) => p.id === productId);
                if (!product) return null;
                return (
                  <div 
                    key={productId} 
                    onClick={() => product.buyUrl && window.open(product.buyUrl, "_blank")}
                    className="flex-shrink-0 w-64 p-2 rounded-2xl bg-white/10 md:backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all cursor-pointer group/item flex gap-3 snap-center"
                  >
                    <MediaImage url={product.url} className="w-20 h-20 object-cover rounded-xl" />
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Meesho</p>
                      <p className="text-[11px] font-bold truncate text-white">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-bold text-white">₹{product.price}</span>
                        <span className="text-[9px] text-white/30 line-through">₹{Math.round(Number(product.price) * 1.5)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ----------------- Premium Designer Sub-components -----------------

const AnnouncementBanner = React.memo(({ theme }: { theme: "light" | "dark" }) => {
  return (
    <div className={`w-full py-2.5 overflow-hidden text-center relative z-50 border-b ${
      theme === "dark" 
        ? "bg-amber-950/20 text-amber-200 border-amber-500/20" 
        : "bg-amber-50 text-amber-800 border-amber-100"
    } text-[11px] font-medium tracking-wide`}>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(50%); }
          100% { transform: translateX(-150%); }
        }
        .animate-marquee-css {
          display: inline-block;
          white-space: nowrap;
          padding-left: 20px;
          animation: marquee 26s linear infinite;
        }
        .animate-marquee-css:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center bg-transparent pointer-events-none">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse mr-1" />
      </div>
      <div className="animate-marquee-css">
        <span className="mx-6">✨ Premium Handpicked Boutique Styling Recommendations curated by Renu Agarwal ✨</span>
        <span className="mx-6 opacity-30">•</span>
        <span className="mx-6">🛍️ Click on any product to directly find best purchases from top trusted affiliate stores 🛍️</span>
        <span className="mx-6 opacity-30">•</span>
        <span className="mx-6">🌟 Discover top trending Indian Ethnic wears, sarees & designer suit sets curated daily 🌟</span>
        <span className="mx-6 opacity-30">•</span>
        <span className="mx-6">🎯 Verified Direct Links to purchase styles and dresses from top fashion stores online! 🎯</span>
      </div>
    </div>
  );
});

const autoDetectCategory = (name: string, description: string): string => {
  const text = `${name || ""} ${description || ""}`.toLowerCase();
  
  if (
    text.includes("saree") || text.includes("sari") || text.includes("zari") || 
    text.includes("organza") || text.includes("georgette") || text.includes("banarasi") || 
    text.includes("drape") || text.includes("silk") || text.includes("kanjivaram") || 
    text.includes("chanderi") || text.includes("patola") || text.includes("bandhani") || 
    text.includes("chiffon") || text.includes("linen") || text.includes("pallu") || 
    text.includes("paithani") || text.includes("leheriya") || text.includes("kanchi") || 
    text.includes("pattu") || text.includes("crepe")
  ) {
    return "Sarees";
  }
  
  if (
    text.includes("kurta") || text.includes("kurti") || text.includes("tunic") || 
    text.includes("anarkali") || text.includes("suit") || text.includes("salwar") || 
    text.includes("kameez") || text.includes("sharara") || text.includes("gharara") || 
    text.includes("palazzo") || text.includes("dupatta") || text.includes("chikankari") || 
    text.includes("ethnic set") || text.includes("co-ord") || text.includes("kaftan") || 
    text.includes("angrakha") || text.includes("peplum")
  ) {
    return "Kurtas";
  }
  
  if (
    text.includes("lehenga") || text.includes("choli") || text.includes("ghagra") || 
    text.includes("lehanga") || text.includes("lacha") || text.includes("crop top skirt")
  ) {
    return "Lehengas";
  }
  
  if (
    text.includes("dress") || text.includes("gown") || text.includes("one-piece") || 
    text.includes("frock") || text.includes("maxi") || text.includes("skirt") || 
    text.includes("midi") || text.includes("bodycon") || text.includes("jumpsuit") || 
    text.includes("western")
  ) {
    return "Dresses";
  }
  
  if (
    text.includes("jewelry") || text.includes("jewellery") || text.includes("earring") || 
    text.includes("ring") || text.includes("necklace") || text.includes("bangle") || 
    text.includes("jhumka") || text.includes("payal") || text.includes("chuda") || 
    text.includes("pendant") || text.includes("choker") || text.includes("nosepin") || 
    text.includes("anklet") || text.includes("kundan")
  ) {
    return "Jewelry";
  }
  
  return "Other";
};

const getPostCategory = (post: any, products: any[]): string => {
  if (post.category && post.category.toLowerCase() !== "other") {
    return post.category;
  }
  if (post.taggedProducts && post.taggedProducts.length > 0) {
    for (const pId of post.taggedProducts) {
      const prod = products.find((p: any) => p.id === pId);
      if (prod && prod.category && prod.category.toLowerCase() !== "other") {
        return prod.category;
      }
    }
  }
  const text = `${post.name || ""} ${post.caption || ""} ${post.description || ""}`.trim();
  const detected = autoDetectCategory(text, "");
  if (detected && detected.toLowerCase() !== "other") {
    return detected;
  }
  if (post.taggedProducts && post.taggedProducts.length > 0) {
    for (const pId of post.taggedProducts) {
      const prod = products.find((p: any) => p.id === pId);
      if (prod) {
        const detectedProductCat = autoDetectCategory(prod.name, prod.description || "");
        if (detectedProductCat && detectedProductCat.toLowerCase() !== "other") {
          return detectedProductCat;
        }
      }
    }
  }
  return "Other";
};

const getQueryCategorySense = (query: string): string | null => {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  
  if (
    q.includes("saree") || q.includes("sari") || q.includes("zari") || 
    q.includes("organza") || q.includes("georgette") || q.includes("banarasi") || 
    q.includes("drape") || q.includes("silk") || q.includes("kanjivaram") || 
    q.includes("chanderi") || q.includes("patola") || q.includes("bandhani") || 
    q.includes("chiffon") || q.includes("linen") || q.includes("pallu") || 
    q.includes("paithani") || q.includes("leheriya") || q.includes("kanchi") || 
    q.includes("pattu") || q.includes("crepe")
  ) {
    return "Sarees";
  }
  
  if (
    q.includes("kurta") || q.includes("kurti") || q.includes("tunic") || 
    q.includes("anarkali") || q.includes("suit") || q.includes("salwar") || 
    q.includes("kameez") || q.includes("sharara") || q.includes("gharara") || 
    q.includes("palazzo") || q.includes("dupatta") || q.includes("chikankari") || 
    q.includes("ethnic") || q.includes("co-ord") || q.includes("kaftan") || 
    q.includes("angrakha") || q.includes("peplum")
  ) {
    return "Kurtas";
  }
  
  if (
    q.includes("lehenga") || q.includes("choli") || q.includes("ghagra") || 
    q.includes("lehanga") || q.includes("lacha")
  ) {
    return "Lehengas";
  }
  
  if (
    q.includes("dress") || q.includes("gown") || q.includes("one-piece") || 
    q.includes("frock") || q.includes("maxi") || q.includes("skirt") || 
    q.includes("midi") || q.includes("bodycon") || q.includes("jumpsuit") || 
    q.includes("western")
  ) {
    return "Dresses";
  }
  
  if (
    q.includes("jewelry") || q.includes("jewellery") || q.includes("earring") || 
    q.includes("ring") || q.includes("necklace") || q.includes("bangle") || 
    q.includes("jhumka") || q.includes("payal") || q.includes("chuda") || 
    q.includes("pendant") || q.includes("choker") || q.includes("nosepin") || 
    q.includes("anklet") || q.includes("kundan")
  ) {
    return "Jewelry";
  }
  
  return null;
};

const checkSemanticMatch = (name: string, description: string, caption: string, category: string, queryText: string): boolean => {
  const normQuery = queryText.toLowerCase().trim();
  if (!normQuery) return true;

  const titleLower = (name || "").toLowerCase();
  const descLower = (description || "").toLowerCase();
  const capLower = (caption || "").toLowerCase();
  const catLower = (category || "").toLowerCase();

  // Primary Check: exact substring match
  if (
    titleLower.includes(normQuery) || 
    descLower.includes(normQuery) || 
    capLower.includes(normQuery) || 
    catLower.includes(normQuery)
  ) {
    return true;
  }

  // Plurals and Singular mappings: e.g. query "sarees" against item title "saree"
  const sanitizeStem = (word: string): string => {
    let stem = word.trim().toLowerCase();
    if (stem.endsWith("ies")) {
      return stem.slice(0, -3) + "y"; // kurtis -> kurti
    }
    if (stem.endsWith("es") && !stem.endsWith("ss")) {
      return stem.slice(0, -2); // sarees -> saree, dresses -> dress
    }
    if (stem.endsWith("s") && !stem.endsWith("ss")) {
      return stem.slice(0, -1); // kurtas -> kurta, lehengas -> lehenga, suits -> suit
    }
    return stem;
  };

  const stemmedQueryMsg = sanitizeStem(normQuery);
  if (
    titleLower.includes(stemmedQueryMsg) || 
    descLower.includes(stemmedQueryMsg) || 
    capLower.includes(stemmedQueryMsg) || 
    catLower.includes(stemmedQueryMsg)
  ) {
    return true;
  }

  // Tokenized fallback
  const queryTokens = normQuery.split(/[\s,.\-/#()]+/).filter(t => t.length > 2);
  const itemTokens = `${titleLower} ${descLower} ${capLower} ${catLower}`.split(/[\s,.\-/#()]+/).filter(t => t.length > 2);

  for (const qToken of queryTokens) {
    const qStem = sanitizeStem(qToken);
    for (const iToken of itemTokens) {
      const iStem = sanitizeStem(iToken);
      if (qStem === iStem || iToken.includes(qStem) || qStem.includes(iStem)) {
        return true;
      }
    }
  }

  // Category sense mapping fallback
  const querySense = getQueryCategorySense(normQuery);
  if (querySense && category && category.toLowerCase() === querySense.toLowerCase()) {
    return true;
  }

  return false;
};

const BoutiqueHighlights = React.memo(({ theme }: { theme: "light" | "dark" }) => {
  const highlights = useMemo(() => [
    { 
      icon: Sparkles, 
      title: "Handcrafted Premium Style", 
      desc: "Curated with finest zari, organza & silk works by Renu Agarwal.",
      color: "text-amber-500 bg-amber-500/10"
    },
    { 
      icon: Check, 
      title: "Double-Inspected Sizing", 
      desc: "Tailored precisely with measurements aligned with your request before shipment.",
      color: "text-indigo-500 bg-indigo-500/10"
    },
    { 
      icon: Phone, 
      title: "Direct Style Assistance", 
      desc: "Call or chat with us for real-time fabric suggestions & live video previews.",
      color: "text-emerald-500 bg-emerald-500/10"
    },
    { 
      icon: Tag, 
      title: "Custom Orders & Gifting", 
      desc: "Order custom sizes or special gift packaging for active Indian festivals.",
      color: "text-rose-500 bg-rose-500/10"
    }
  ], []);

  return (
    <div className="mb-8 p-1 select-none">
      <div className="flex items-center gap-1.5 mb-3.5">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <h3 className="text-[11px] font-bold uppercase tracking-wider opacity-80">Boutique Specialties</h3>
      </div>
      <div className="grid grid-cols-2 gap-3.5">
        {highlights.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={idx}
              className={`p-3.5 rounded-2xl border ${
                theme === "dark" 
                  ? "bg-white/[0.03] border-white/10 hover:border-amber-500/30" 
                  : "bg-black/[0.02] border-black/10 hover:border-amber-500/20"
              } transition-all duration-300 flex flex-col gap-2.5 group transform hover:-translate-y-0.5`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.color} transition-transform group-hover:scale-105 duration-300`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight tracking-tight">{item.title}</h4>
                <p className="text-[9px] opacity-60 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const LatestArrivalsCarousel = React.memo(({ 
  products, 
  posts, 
  theme, 
  navigate 
}: { 
  products: any[]; 
  posts: any[]; 
  theme: "light" | "dark"; 
  navigate: any 
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleWheelScroll = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  }, []);

  const latestItems = useMemo(() => {
    // Combine newest products and video posts (reels) only
    const combined = [
      ...products.map(p => ({ ...p, itemType: "product", originTag: "🎁 New Arrival" })),
      ...posts.filter(p => p.type === "video").map(p => ({ 
        ...p, 
        itemType: "post", 
        name: p.name || p.caption || "Gallery New Style", 
        originTag: "🎬 New Reel" 
      }))
    ];
    
    // Sort descending by id (Unix time/id string length)
    combined.sort((a, b) => {
      const idA = typeof a.id === "number" ? a.id : Number(a.id) || 0;
      const idB = typeof b.id === "number" ? b.id : Number(b.id) || 0;
      return idB - idA;
    });

    return combined.slice(0, 6);
  }, [products, posts]);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3 px-1 select-none">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider opacity-80">Latest Arrivals ✨</h3>
        </div>
        <span className="text-[9px] opacity-45 font-semibold uppercase tracking-wider">Scroll Wheel or Swipe →</span>
      </div>
      
      <div 
        ref={scrollRef}
        onWheel={handleWheelScroll}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory px-1 select-none scroll-smooth"
      >
        {latestItems.map((item: any) => (
          <div 
            key={item.id}
            onClick={() => {
              const targetId = item.docId || item.id;
              if (item.itemType === "product") {
                navigate(`/product/${targetId}`);
              } else {
                navigate(`/post/${targetId}`);
              }
            }}
            className={`flex-none w-52 rounded-2xl overflow-hidden cursor-pointer snap-start border ${
              theme === "dark" ? "bg-white/[0.03] border-white/10 hover:border-amber-500/35" : "bg-black/[0.02] border-black/10 hover:border-amber-500/25"
            } relative group transition-all duration-350 transform hover:-translate-y-0.5`}
          >
            <div className="aspect-[3/4] overflow-hidden relative">
              {item.type === "video" ? (
                <div className="w-full h-full relative">
                  <VideoEmbed url={item.url} minimal={true} />
                  <div className="absolute top-2.5 right-2.5 p-1 rounded-md bg-black/70 text-white">
                    <Play className="w-3 h-3 fill-white text-white" />
                  </div>
                </div>
              ) : (
                <MediaImage 
                  url={item.url} 
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/85 text-[8px] font-extrabold text-amber-400 capitalize border border-amber-500/20 shadow-md">
                {item.originTag}
              </div>
            </div>
            <div className="p-3">
              <h4 className="text-[11px] font-bold truncate mb-1">{item.name}</h4>
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-amber-500 dark:text-amber-400">
                  {item.price ? `₹${item.price}` : "Fashion Video"}
                </span>
                <span className="text-[9px] opacity-40 uppercase tracking-widest font-bold group-hover:text-amber-400 group-hover:translate-x-1 transition-all flex items-center">
                  View →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const CustomerTestimonials = React.memo(({ theme }: { theme: "light" | "dark" }) => {
  const reviews = useMemo(() => [
    { name: "Pooja Sharma", text: "Ordered a custom designer organza saree from Renu Agarwal. The fabric quality and embroidery are premium class!", stars: 5, date: "Delhi" },
    { name: "Divya Patel", text: "Brilliant customer support on WhatsApp. Helped me customize sizing smoothly. Exactly as shown in the video!", stars: 5, date: "Gujarat" },
    { name: "Kajal Goel", text: "Sarees are gorgeous and stitching was flawless. Received fast delivery in proper protective wrap! Will shop again.", stars: 5, date: "Mumbai" }
  ], []);

  const handleWheelScroll = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  }, []);

  return (
    <div className="mb-8 mt-4 select-none">
      <div className="flex items-center gap-1.5 mb-3 px-1">
        <MessageSquare className="w-4 h-4 text-amber-500" />
        <h3 className="text-[11px] font-bold uppercase tracking-wider opacity-80">💬 Happy Customers Say</h3>
      </div>
      <div 
        onWheel={handleWheelScroll}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory px-1 scroll-smooth"
      >
        {reviews.map((rev, index) => (
          <div 
            key={index}
            className={`flex-none w-64 p-4 rounded-2xl border ${
              theme === "dark" ? "bg-white/[0.03] border-white/10 hover:border-amber-500/20" : "bg-black/[0.02] border-black/10 hover:border-amber-500/15"
            } snap-start transition-all duration-300`}
          >
            <div className="flex gap-0.5 mb-2.5">
              {Array.from({ length: rev.stars }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              ))}
            </div>
            <p className="text-[11px] leading-relaxed opacity-70 italic mb-3">"{rev.text}"</p>
            <div className="flex justify-between items-center border-t border-white/5 pt-2">
              <span className="text-[10px] font-bold">{rev.name}</span>
              <span className="text-[9px] opacity-40 uppercase tracking-widest font-bold">{rev.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const SupportQuickAssist = React.memo(({ theme, handleNavigate }: { theme: "light" | "dark"; handleNavigate: (path: string) => void }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleNavigate("/contact")}
        className="p-3.5 rounded-full bg-emerald-500 text-white shadow-2xl flex items-center justify-center relative overflow-hidden group border border-emerald-400/20"
        title="Live Support & Custom Queries"
      >
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Phone className="w-5 h-5 fill-white" />
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500" />
      </motion.button>
    </div>
  );
});

const ProductFilter = React.memo(({ 
  searchVal, 
  setSearchVal, 
  activeCat, 
  setActiveCat, 
  categories,
  theme 
}: { 
  searchVal: string; 
  setSearchVal: (v: string) => void; 
  activeCat: string; 
  setActiveCat: (v: string) => void; 
  categories: string[];
  theme: "light" | "dark" 
}) => {
  const handleWheelScroll = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  }, []);

  return (
    <div className="mb-6 space-y-3 select-none">
      <div className="relative">
        <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
          theme === "dark" ? "text-white/40" : "text-black/40"
        }`} />
        <input 
          type="text" 
          placeholder="Search items, premium sarees, design kurtas..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className={`w-full py-3.5 pl-10 pr-10 rounded-2xl text-xs font-semibold border transition-all ${
            theme === "dark" 
              ? "bg-white/[0.04] border-white/10 text-white placeholder-white/30 focus:border-purple-500/50 focus:bg-white/10" 
              : "bg-black/[0.03] border-black/10 text-black placeholder-black/30 focus:border-purple-500/40 focus:bg-black/10"
          } outline-none`}
        />
        {searchVal && (
          <button 
            type="button"
            onClick={() => setSearchVal("")}
            className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full ${
              theme === "dark" ? "bg-white/10 hover:bg-white/20" : "bg-black/15 hover:bg-black/25"
            } transition-colors`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div 
        onWheel={handleWheelScroll}
        className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none px-0.5 scroll-smooth"
      >
        {categories.map((cat) => (
          <button 
            key={cat}
            type="button"
            onClick={() => setActiveCat(cat)}
            className={`flex-none px-4 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-300 ${
              activeCat === cat 
                ? (theme === "dark" ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25" : "bg-purple-600 text-white shadow-lg shadow-purple-600/15") 
                : (theme === "dark" ? "bg-white/5 border border-white/10 hover:bg-white/10 text-white/70" : "bg-black/5 border border-black/10 hover:bg-black/10 text-black/70")
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
});

// -------------------------------------------------------------------

const EmptyState = React.memo(({ icon: Icon, message }: { icon: any; message: string }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-24 px-6 text-center w-full"
  >
    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-tr from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <Icon className="w-10 h-10 text-white/20 group-hover:text-white/40 transition-colors" />
    </div>
    <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">{message}</p>
  </motion.div>
));

const ProductCard = React.memo(({ product, navigate, isMobile }: { product: any; navigate: any; isMobile: boolean }) => (
  <motion.div 
    initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
    whileInView={isMobile ? undefined : { opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    onClick={() => navigate(`/product/${product.id}`)}
    className="group cursor-pointer flex flex-col will-change-transform"
  >
    <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/10 mb-2 relative">
      <MediaImage 
        url={product.url} 
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="px-4 py-2 rounded-full bg-white text-black text-[10px] font-bold shadow-xl">View Details</div>
      </div>
    </div>
    <div className="px-1">
      <h4 className="font-semibold text-[11px] truncate mb-0.5">{product.name}</h4>
      <p className="text-white/40 text-[10px]">₹{product.price}</p>
    </div>
  </motion.div>
));

const ShopPostCard = React.memo(({ post, navigate, isMobile }: { post: any; navigate: any; isMobile: boolean }) => (
  <motion.div 
    initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
    whileInView={isMobile ? undefined : { opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    onClick={() => navigate(`/post/${post.id}`)}
    className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-white/5 border border-white/10 group cursor-pointer will-change-transform"
  >
    {post.type === "video" ? (
      <div className="w-full h-full">
        <VideoEmbed url={post.url} minimal={true} />
        <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/80 md:backdrop-blur-md">
          <Play className="w-3 h-3 text-white fill-white" />
        </div>
      </div>
    ) : (
      <MediaImage url={post.url} className="w-full h-full object-cover" loading="lazy" />
    )}
    {post.taggedProducts?.length > 0 && (
      <div className="absolute top-3 left-3 p-1.5 rounded-lg bg-black/80 md:backdrop-blur-md flex items-center gap-1">
        <ShoppingBag className="w-3 h-3 text-white" />
        <span className="text-[9px] font-bold text-white">{post.taggedProducts.length}</span>
      </div>
    )}
  </motion.div>
));

const PostCard = React.memo(({ post, products, navigate, onTabChange, isMobile }: { post: any; products: any[]; navigate: any; onTabChange: (tab: string) => void; isMobile: boolean }) => (
  <motion.div 
    initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
    whileInView={isMobile ? undefined : { opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    onClick={() => navigate(`/post/${post.id}`)}
    className="w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 relative group cursor-pointer will-change-transform"
  >
    {post.type === "video" ? (
      <div className="aspect-[9/16] w-full">
        <VideoEmbed url={post.url} minimal={true} />
      </div>
    ) : (
      <div className="w-full">
        <MediaImage 
          url={post.url} 
          alt={`Post ${post.id}`}
          className="w-full h-auto object-cover"
          loading="lazy"
        />
      </div>
    )}

    {/* Tagged Products Section */}
    {post.taggedProducts && post.taggedProducts.length > 0 && (
      <div className="p-4 bg-white/5 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="w-4 h-4 text-red-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Tagged Products ({post.taggedProducts.length})</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" onWheel={(e) => { if (e.deltaY !== 0) { e.currentTarget.scrollLeft += e.deltaY; } }}>
          {post.taggedProducts.map((productId: number) => {
            const product = products.find((p: any) => p.id === productId);
            if (!product) return null;
            return (
              <div 
                key={productId} 
                onClick={(e) => {
                  e.stopPropagation();
                  product.buyUrl && window.open(product.buyUrl, "_blank");
                }}
                className="flex-shrink-0 w-64 p-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group/item flex gap-3"
              >
                <MediaImage url={product.url} className="w-20 h-20 object-cover rounded-xl" loading="lazy" />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Meesho</p>
                  <p className="text-[11px] font-bold truncate text-white">{product.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-bold text-white">₹{product.price}</span>
                    <span className="text-[9px] text-white/30 line-through">₹{Math.round(Number(product.price) * 1.5)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <PremiumButton 
          onClick={(e) => {
            e?.stopPropagation();
            onTabChange("products");
          }}
          className="w-full mt-2"
          icon={ShoppingBag}
          variant="secondary"
        >
          Shop Tagged Products
        </PremiumButton>
      </div>
    )}
  </motion.div>
));

const ShareModal = ({ 
  isOpen, 
  onClose, 
  profileName, 
  customUrl, 
  customTitle, 
  theme = "dark" 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  profileName: string; 
  customUrl?: string; 
  customTitle?: string; 
  theme?: string;
}) => {
  const activeUrl = customUrl || "https://renufashionhub.in";
  const activeTitle = customTitle || `Check out ${profileName}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    { 
      name: "WhatsApp", 
      icon: MessageSquare, 
      color: "text-green-500 hover:text-green-400", 
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(activeTitle + " - " + activeUrl)}` 
    },
    { 
      name: "Telegram", 
      icon: Send, 
      color: "text-sky-405 hover:text-sky-305", 
      href: `https://t.me/share/url?url=${encodeURIComponent(activeUrl)}&text=${encodeURIComponent(activeTitle)}` 
    },
    { 
      name: "Facebook", 
      icon: Facebook, 
      color: "text-blue-500 hover:text-blue-400", 
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(activeUrl)}` 
    },
    { 
      name: "Instagram", 
      icon: Instagram, 
      color: "text-pink-500 hover:text-pink-400", 
      href: "https://www.instagram.com",
      isInsta: true 
    },
    { 
      name: "Twitter", 
      icon: Twitter, 
      color: "text-stone-300 hover:text-white", 
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(activeUrl)}&text=${encodeURIComponent(activeTitle)}` 
    },
    { 
      name: "LinkedIn", 
      icon: Linkedin, 
      color: "text-blue-600 hover:text-blue-500", 
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(activeUrl)}` 
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className={`relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border ${
          theme === "dark" 
            ? "bg-[#09100E] border-white/10 text-amber-50" 
            : "bg-white border-black/10 text-stone-900"
        }`}
      >
        <div className={`p-5 border-b flex items-center justify-between ${theme === "dark" ? "border-white/5" : "border-black/5"}`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-xl ${theme === "dark" ? "bg-white/5" : "bg-black/5"}`}>
              <Share2 className="w-4 h-4 text-purple-500" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Share Link</h3>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-full transition-all ${theme === "dark" ? "hover:bg-white/5 text-white/40 hover:text-white" : "hover:bg-black/5 text-[#1C1B18]/40 hover:text-[#1C1B18]"}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Link Copy Section */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className={`p-2 rounded-xl flex-shrink-0 ${theme === "dark" ? "bg-white/5" : "bg-black/5"}`}>
                <Globe className="w-3.5 h-3.5 opacity-60" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate opacity-85">{activeTitle}</p>
                <p className="text-[10px] opacity-40 truncate">{activeUrl}</p>
              </div>
            </div>
            <button 
              onClick={handleCopy}
              className={`p-2.5 rounded-xl transition-all active:scale-95 flex-shrink-0 ${theme === "dark" ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-[#1C1B18]/10"}`}
              title="Copy Link"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 opacity-50" />}
            </button>
          </div>

          {/* Social Icons Grid */}
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-widest opacity-40 mb-3.5">Share with Apps</p>
            <div className="grid grid-cols-3 gap-3">
              {shareOptions.map((option, index) => (
                <a 
                  key={index}
                  href={option.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (option.isInsta) {
                      e.preventDefault();
                      handleCopy();
                      // Redirect after feedback
                      setTimeout(() => {
                        window.open(option.href, "_blank");
                      }, 400);
                    }
                  }}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 ${
                    theme === "dark" 
                      ? "bg-white/[0.02] hover:bg-white/[0.06] border-white/5" 
                      : "bg-black/[0.01] hover:bg-black/[0.04] border-black/5"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${theme === "dark" ? "bg-white/5" : "bg-black/5"}`}>
                    <option.icon className={`w-4 h-4 ${option.color}`} />
                  </div>
                  <span className="text-[9px] font-bold uppercase opacity-60 transition-colors">{option.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const PageLoader = ({ theme }: { theme: string }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className={`fixed inset-0 left-0 top-0 w-screen h-screen z-[9999] flex flex-col items-center justify-center ${theme === "dark" ? "bg-[#0B1512] gold-grain-dark text-amber-50" : "bg-[#FDFBF7] gold-grain-light text-stone-900"}`}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <ShoppingBag className="w-7 h-7 text-amber-500" />
      </div>
    </motion.div>
    <div className="mt-6 text-center px-4">
      <p className="text-sm font-bold tracking-[0.1em] text-amber-600 dark:text-amber-400 uppercase mb-1.5 font-serif">We Are Preparing For You</p>
      <p className="text-[10px] tracking-[0.15em] text-stone-500 dark:text-stone-400 uppercase font-bold mb-3">Please Wait</p>
      <div className="flex items-center justify-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
      </div>
    </div>
  </motion.div>
);

const CountUp = ({ end, isLoaded, hasError, theme }: { end: number; isLoaded: boolean; hasError: boolean; theme: string }) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement | null>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || hasError) {
      setCount(0);
      animatedRef.current = false;
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          let startTimestamp: number | null = null;
          const duration = 1200; // 1.2s animation

          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Ease out quad
            const easeProgress = progress * (2 - progress);
            setCount(Math.floor(easeProgress * end));
            if (progress < 1) {
              window.requestAnimationFrame(step);
            } else {
              setCount(end);
            }
          };
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [end, isLoaded, hasError]);

  if (!isLoaded || hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[44px]">
        <span className="block text-3xl font-extrabold font-serif text-stone-400 dark:text-stone-600 mb-1 leading-none">--</span>
        <span className="text-[9px] font-bold text-amber-500/80 animate-pulse">Loading...</span>
      </div>
    );
  }

  return (
    <span ref={elementRef} className="block text-3xl font-extrabold font-serif text-amber-500 mb-1 leading-none min-h-[36px] flex items-center justify-center">
      {count}+
    </span>
  );
};

const CompanyStatisticsSection = ({ 
  theme, 
  productsCount, 
  blogsCount, 
  postsCount, 
  isProductsLoaded, 
  isBlogsLoaded, 
  isPostsLoaded,
  productsError,
  blogsError,
  postsError
}: { 
  theme: string; 
  productsCount: number; 
  blogsCount: number; 
  postsCount: number; 
  isProductsLoaded: boolean; 
  isBlogsLoaded: boolean; 
  isPostsLoaded: boolean; 
  productsError: boolean;
  blogsError: boolean;
  postsError: boolean;
}) => {
  return (
    <section className="mb-16 grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Card 1: Curated Products */}
      <motion.div 
        whileHover={{ y: -3 }}
        className={`p-6 rounded-2xl text-center border flex flex-col justify-center min-h-[105px] ${
          theme === "dark" ? "bg-white/[0.01] border-white/5 shadow-[0_4px_16px_rgba(0,0,0,0.2)]" : "bg-white border-stone-150 shadow-sm"
        }`}
      >
        <CountUp end={productsCount} isLoaded={isProductsLoaded} hasError={productsError} theme={theme} />
        <span className={`text-[10px] uppercase font-black tracking-widest leading-normal mt-1 ${theme === "dark" ? "text-stone-400" : "text-stone-600"}`}>
          Curated Products
        </span>
      </motion.div>

      {/* Card 2: Editorial Blogs */}
      <motion.div 
        whileHover={{ y: -3 }}
        className={`p-6 rounded-2xl text-center border flex flex-col justify-center min-h-[105px] ${
          theme === "dark" ? "bg-white/[0.01] border-white/5 shadow-[0_4px_16px_rgba(0,0,0,0.2)]" : "bg-white border-stone-150 shadow-sm"
        }`}
      >
        <CountUp end={blogsCount} isLoaded={isBlogsLoaded} hasError={blogsError} theme={theme} />
        <span className={`text-[10px] uppercase font-black tracking-widest leading-normal mt-1 ${theme === "dark" ? "text-stone-400" : "text-stone-600"}`}>
          Editorial Blogs
        </span>
      </motion.div>

      {/* Card 3: Lifestyle Videos */}
      <motion.div 
        whileHover={{ y: -3 }}
        className={`p-6 rounded-2xl text-center border flex flex-col justify-center min-h-[105px] ${
          theme === "dark" ? "bg-white/[0.01] border-white/5 shadow-[0_4px_16px_rgba(0,0,0,0.2)]" : "bg-white border-stone-150 shadow-sm"
        }`}
      >
        <CountUp end={postsCount} isLoaded={isPostsLoaded} hasError={postsError} theme={theme} />
        <span className={`text-[10px] uppercase font-black tracking-widest leading-normal mt-1 ${theme === "dark" ? "text-stone-400" : "text-stone-600"}`}>
          Lifestyle Videos
        </span>
      </motion.div>

      {/* Card 4: Platform Status */}
      <motion.div 
        whileHover={{ y: -3 }}
        className={`p-6 rounded-2xl text-center border flex flex-col justify-center min-h-[105px] ${
          theme === "dark" ? "bg-white/[0.01] border-white/5 shadow-[0_4px_16px_rgba(0,0,0,0.2)]" : "bg-white border-stone-150 shadow-sm"
        }`}
      >
        <span className="block text-sm font-extrabold font-serif text-amber-500 mb-1 leading-tight">
          Growing Fashion Platform
        </span>
        <span className={`text-[10px] uppercase font-black tracking-widest leading-normal mt-1 ${theme === "dark" ? "text-stone-400" : "text-stone-600"}`}>
          Platform Status
        </span>
      </motion.div>
    </section>
  );
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMobile, setIsMobile] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [sidebarHeight, setSidebarHeight] = useState(740);

  useEffect(() => {
    if (!sidebarRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setSidebarHeight(entry.target.getBoundingClientRect().height || entry.contentRect.height);
      }
    });
    resizeObserver.observe(sidebarRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavigate = useCallback((path: string) => {
    setIsNavigating(true);
    navigate(path);
    window.scrollTo(0, 0);
    setTimeout(() => {
      setIsNavigating(false);
    }, 550);
  }, [navigate]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState("shop");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isProductsLoaded, setIsProductsLoaded] = useState(false);
  const [isPostsLoaded, setIsPostsLoaded] = useState(false);

  
  const [profile, setProfile] = useState({
    name: "Renu Fashion Hub",
    bio: "Premium Fashion • Latest Trends • Style Hub\nElevating your style every day ✨",
    avatar: "data:image/jpeg;base64,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",
    privacyPolicy: DEFAULT_PRIVACY_POLICY,
    termsOfService: DEFAULT_TERMS_OF_SERVICE,
  });

  const [posts, setPosts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isBlogsLoaded, setIsBlogsLoaded] = useState(false);
  const [postsError, setPostsError] = useState(false);
  const [productsError, setProductsError] = useState(false);
  const [blogsError, setBlogsError] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Temporary states for Admin Panel
  const [tempProfile, setTempProfile] = useState(profile);
  const [tempPosts, setTempPosts] = useState(posts);
  const [tempProducts, setTempProducts] = useState(products);
  const [tempBlogs, setTempBlogs] = useState(blogs);
  const [deletedPostIds, setDeletedPostIds] = useState<string[]>([]);
  const [deletedProductIds, setDeletedProductIds] = useState<string[]>([]);
  const [deletedBlogIds, setDeletedBlogIds] = useState<string[]>([]);

  // Set page titles dynamically based on current route/path and track page views in Google Analytics
  useEffect(() => {
    let currentTitle = "Home - Renu Fashion Hub";

    const cleanTitleString = (str: string) => {
      if (!str) return '';
      // Remove any handle/tag starting with @ (e.g. @meesho, @instagram) and surrounding spaces
      let clean = str.replace(/@\w+/g, '');
      // Merge multiple spaces or separators cleanly
      clean = clean.replace(/\|+/g, '|');
      clean = clean.replace(/\s+/g, ' ');
      // Clean up isolated trailing/leading punctuation symbols
      clean = clean.trim();
      clean = clean.replace(/^[|:\s-]+|[|:\s-]+$/g, '');
      return clean.trim();
    };

    if (location.pathname === "/contact") {
      currentTitle = "Contact - Renu Fashion Hub";
    } else if (location.pathname === "/admin") {
      currentTitle = "Admin Panel - Renu Fashion Hub";
    } else if (location.pathname === "/login") {
      currentTitle = "Login - Renu Fashion Hub";
    } else if (location.pathname.startsWith("/product/")) {
      const idStr = location.pathname.split("/product/")[1];
      const product = products.find(p => p.id.toString() === idStr || p.docId === idStr);
      if (product) {
        const cleanedName = cleanTitleString(product.name);
        currentTitle = `Product - ${cleanedName || "Detail"}`;
      } else {
        currentTitle = "Product - Renu Fashion Hub";
      }
    } else if (location.pathname.startsWith("/post/")) {
      const idStr = location.pathname.split("/post/")[1];
      const post = posts.find(p => p.id.toString() === idStr || p.docId === idStr);
      if (post) {
        const rawName = post.name || post.caption || post.title || 'Studio Post';
        let cleanedName = cleanTitleString(rawName);
        // Smart auto-shortening for clean aesthetic tab titles
        if (cleanedName.length > 28) {
          const words = cleanedName.split(/\s+/);
          let short = "";
          for (const word of words) {
            if ((short + " " + word).trim().length > 24) break;
            short = (short + " " + word).trim();
          }
          if (!short) {
            short = cleanedName.slice(0, 22);
          }
          cleanedName = short.replace(/[,;.:\-\s|]+$/, "") + "...";
        }
        currentTitle = `Post - ${cleanedName}`;
      } else {
        currentTitle = "Post - RFH";
      }
    } else if (location.pathname === "/about") {
      currentTitle = "About Renu Fashion Hub";
    } else if (location.pathname === "/privacy-policy") {
      currentTitle = "Privacy Policy";
    } else if (location.pathname === "/terms-of-service") {
      currentTitle = "Terms of Service";
    } else if (location.pathname === "/disclaimer") {
      currentTitle = "Disclaimer";
    } else if (location.pathname === "/blog") {
      currentTitle = "Blog";
    } else if (location.pathname.startsWith("/blog/")) {
      const idStr = location.pathname.split("/blog/")[1];
      const blog = blogs.find(b => b.id.toString() === idStr || b.docId === idStr);
      
      const setMetaTag = (attributeName: string, attributeValue: string, content: string) => {
        let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute(attributeName, attributeValue);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      };

      const setSchemaJSONLD = (id: string, schemaObj: any | null) => {
        let element = document.getElementById(id) as HTMLScriptElement;
        if (!schemaObj) {
          if (element) element.remove();
          return;
        }
        if (!element) {
          element = document.createElement('script');
          element.id = id;
          element.type = 'application/ld+json';
          document.head.appendChild(element);
        }
        element.textContent = JSON.stringify(schemaObj);
      };

      if (blog) {
        const seoTitle = blog.seoTitle || `${blog.title} - Renu Fashion Hub`;
        const metaDesc = blog.metaDescription || blog.excerpt || "Check out our latest fashion updates...";
        const focusKeyword = blog.focusKeyword || "";
        
        currentTitle = seoTitle;

        // Meta tags for SEO
        setMetaTag('name', 'description', metaDesc);
        setMetaTag('name', 'keywords', focusKeyword);
        
        // Open Graph
        setMetaTag('property', 'og:title', seoTitle);
        setMetaTag('property', 'og:description', metaDesc);
        setMetaTag('property', 'og:type', 'article');
        setMetaTag('property', 'og:url', window.location.href);
        if (blog.image) {
          setMetaTag('property', 'og:image', blog.image);
        }

        // Twitter Cards
        setMetaTag('name', 'twitter:card', 'summary_large_image');
        setMetaTag('name', 'twitter:title', seoTitle);
        setMetaTag('name', 'twitter:description', metaDesc);
        if (blog.image) {
          setMetaTag('name', 'twitter:image', blog.image);
        }

        // Structured Data Schema
        const schema = {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": blog.title,
          "alternativeHeadline": seoTitle,
          "image": blog.image || "",
          "genre": blog.category || "Fashion",
          "keywords": focusKeyword,
          "publisher": {
            "@type": "Organization",
            "name": "Renu Fashion Hub",
            "logo": {
              "@type": "ImageObject",
              "url": profile.avatar || ""
            }
          },
          "url": window.location.href,
          "datePublished": blog.timestamp,
          "description": metaDesc,
          "articleBody": blog.content ? blog.content.replace(/<[^>]*>/g, '') : ""
        };
        setSchemaJSONLD('blog-schema', schema);
      } else {
        currentTitle = "Blog - Renu Fashion Hub";
        setSchemaJSONLD('blog-schema', null);
      }
    } else if (location.pathname === "/") {
      currentTitle = "Home - Renu Fashion Hub";
      const setMetaTag = (attributeName: string, attributeValue: string, content: string) => {
        let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute(attributeName, attributeValue);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      };
      setMetaTag('name', 'description', "Renu Fashion Hub - Discover the latest fashion trends, styling tips, outfit ideas, and must-have fashion essentials.");
      setMetaTag('name', 'keywords', "fashion, clothing, style, trends, sarees, kurtas, dresses");
      setMetaTag('property', 'og:title', currentTitle);
      setMetaTag('property', 'og:type', 'website');
      const blogSchemaScript = document.getElementById('blog-schema');
      if (blogSchemaScript) blogSchemaScript.remove();
    } else {
      currentTitle = "Renu Fashion Hub";
      const blogSchemaScript = document.getElementById('blog-schema');
      if (blogSchemaScript) blogSchemaScript.remove();
    }

    // Dynamic canonical URL update
    let canonicalUrl = "https://www.renufashionhub.in" + (location.pathname === "/" ? "/" : location.pathname);
    let canonicalLink = document.querySelector("link[rel='canonical']");
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);

    document.title = currentTitle;

    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("config", "G-7L132HKM3C", {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: currentTitle,
      });
    }
  }, [location.pathname, location.search, products, posts, blogs, profile]);

  const dynamicCategories = useMemo(() => {
    const defaultCats = ["All", "Sarees", "Kurtas", "Lehengas", "Dresses", "Jewelry"];
    const foundCats = new Set<string>();
    
    const formatCatName = (catStr: string) => {
      const clean = (catStr || "").trim();
      if (!clean) return "";
      return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    };

    products.forEach((p) => {
      let cat = p.category;
      if (!cat || cat.toLowerCase() === "other") {
        const autoCat = autoDetectCategory(p.name, p.description || "");
        if (autoCat !== "Other") {
          cat = autoCat;
        }
      }
      if (cat) {
        const formatted = formatCatName(cat);
        if (formatted) foundCats.add(formatted);
      }
    });

    posts.forEach((p) => {
      let cat = p.category;
      if (!cat || cat.toLowerCase() === "other") {
        const autoCat = getPostCategory(p, products);
        if (autoCat !== "Other") {
          cat = autoCat;
        }
      }
      if (cat) {
        const formatted = formatCatName(cat);
        if (formatted) foundCats.add(formatted);
      }
    });

    const combined = [...defaultCats];
    foundCats.forEach((fc) => {
      if (!combined.some(c => c.toLowerCase() === fc.toLowerCase())) {
        combined.push(fc);
      }
    });
    return combined;
  }, [products, posts]);

  // Synchronize theme on mount and change
  useEffect(() => {
    get("rfh_theme").then((savedTheme) => {
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.className = theme;
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    let active = true;
    async function checkAdminSession() {
      try {
        const res = await fetch("/api/admin-auth", { cache: "no-store" });
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          setIsAdminUser(Boolean(data.authenticated));
        } else {
          setIsAdminUser(false);
        }
      } catch {
        if (active) setIsAdminUser(false);
      }
    }

    checkAdminSession();
    return () => {
      active = false;
    };
  }, []);

  // Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Load data from Supabase backend on mount and when admin status changes
  useEffect(() => {
    let active = true;

    async function loadData() {
      // 1. Load Profile
      try {
        const res = await fetch("/api/settings/profile");
        if (res.ok && active) {
          const data = await res.json();
          setProfile({
            name: data.name || "Renu Fashion Hub",
            bio: data.bio || "",
            avatar: data.avatar || "",
            privacyPolicy: data.privacyPolicy || DEFAULT_PRIVACY_POLICY,
            termsOfService: data.termsOfService || DEFAULT_TERMS_OF_SERVICE,
          });
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        if (active) setIsDataLoaded(true);
      }

      // 2. Load Posts
      try {
        const res = await fetch("/api/posts");
        if (res.ok && active) {
          const data = await res.json();
          setPosts(data);
          setPostsError(false);
        } else if (active) {
          setPostsError(true);
        }
      } catch (err) {
        console.error("Error loading posts:", err);
        if (active) setPostsError(true);
      } finally {
        if (active) setIsPostsLoaded(true);
      }

      // 3. Load Products
      try {
        const res = await fetch("/api/products");
        if (res.ok && active) {
          const data = await res.json();
          setProducts(data);
          setProductsError(false);
        } else if (active) {
          setProductsError(true);
        }
      } catch (err) {
        console.error("Error loading products:", err);
        if (active) setProductsError(true);
      } finally {
        if (active) setIsProductsLoaded(true);
      }

      // 4. Load Blogs
      try {
        const res = await fetch("/api/blogs");
        if (res.ok && active) {
          const data = await res.json();
          setBlogs(data);
          setBlogsError(false);
        } else if (active) {
          setBlogsError(true);
        }
      } catch (err) {
        console.error("Error loading blogs:", err);
        if (active) setBlogsError(true);
      } finally {
        if (active) setIsBlogsLoaded(true);
      }

      // 5. Load Messages (Admin only)
      if (isAdminUser) {
        try {
          const res = await fetch("/api/messages");
          if (res.ok && active) {
            const data = await res.json();
            setMessages(data);
          }
        } catch (err) {
          console.error("Error loading messages:", err);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [isAdminUser]);

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [adminTab, setAdminTab] = useState("profile"); // 'profile', 'posts', 'products', 'messages'
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    set("rfh_theme", newTheme);
  }, [theme]);

  const handleSetSelectedPost = useCallback((post: any) => {
    setSelectedPost(post);
  }, []);

  const handleSetActiveTab = useCallback((tab: string) => {
    setIsNavigating(true);
    setActiveTab(tab);
    window.scrollTo(0, 0);
    setTimeout(() => {
      setIsNavigating(false);
    }, 550);
  }, []);

  // Filtered lists based on search query and category
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const postCat = getPostCategory(post, products);
      
      // If search query exists, ignore category and filter purely by search query
      if (searchQuery) {
        return checkSemanticMatch(
          post.name || "", 
          post.description || "", 
          post.caption || "", 
          postCat, 
          searchQuery
        );
      }
      
      // If no search query, respect the selected category filter
      if (selectedCategory !== "All") {
        const catLower = selectedCategory.toLowerCase();
        if (postCat.toLowerCase() === catLower) {
          return true;
        } else {
          // Additional fallback check for safety
          const searchTerms = catLower === "kurtas" ? ["kurta", "kurti", "tunic", "anarkali", "suit", "salwar", "sharara", "gharara", "palazzo"] : 
                              catLower === "sarees" ? ["saree", "sari", "zari", "organza", "georgette", "silk"] :
                              catLower === "lehengas" ? ["lehenga", "choli", "ghagra"] :
                              catLower === "dresses" ? ["dress", "gown", "frock", "maxi", "one-piece"] :
                              catLower === "jewelry" ? ["jewelry", "jewellery", "earring", "necklace", "ring", "bangle", "jhumka"] : [catLower];
          
          return searchTerms.some(term => 
            post.name?.toLowerCase().includes(term) || 
            post.description?.toLowerCase().includes(term) ||
            post.caption?.toLowerCase().includes(term)
          );
        }
      }
      return true;
    });
  }, [posts, products, searchQuery, selectedCategory]);

  const filteredProducts = useMemo(() => {
    const parsePrice = (pStr: any): number => {
      if (pStr === undefined || pStr === null) return 0;
      const clean = String(pStr).replace(/,/g, '').trim();
      const val = parseFloat(clean);
      return isNaN(val) ? 0 : val;
    };

    const filtered = products.filter(product => {
      // Dynamically auto-detect category if it's currently empty, "Other", or not loaded yet
      let productCat = product.category;
      if (!productCat || productCat.toLowerCase() === "other") {
        const autoCat = autoDetectCategory(product.name, product.description || "");
        if (autoCat !== "Other") {
          productCat = autoCat;
        }
      }

      // If search query exists, ignore category and filter purely by search query
      if (searchQuery) {
        return checkSemanticMatch(
          product.name || "", 
          product.description || "", 
          "", 
          productCat || "Other", 
          searchQuery
        );
      }

      // If no search query, respect the selected category filter
      if (selectedCategory !== "All") {
        const catLower = selectedCategory.toLowerCase();
        
        if (productCat && productCat.toLowerCase() === catLower) {
          return true;
        } else {
          const searchTerms = catLower === "kurtas" ? ["kurta", "kurti", "tunic", "anarkali", "suit", "salwar", "sharara", "gharara", "palazzo"] : 
                              catLower === "sarees" ? ["saree", "sari", "zari", "organza", "georgette", "silk"] :
                              catLower === "lehengas" ? ["lehenga", "choli", "ghagra"] :
                              catLower === "dresses" ? ["dress", "gown", "frock", "maxi", "one-piece"] :
                              catLower === "jewelry" ? ["jewelry", "jewellery", "earring", "necklace", "ring", "bangle", "jhumka"] : [catLower];
          
          return searchTerms.some(term => 
            product.name?.toLowerCase().includes(term) || 
            product.description?.toLowerCase().includes(term)
          );
        }
      }
      return true;
    });

    if (sortBy === "price-asc") {
      return [...filtered].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortBy === "price-desc") {
      return [...filtered].sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }
    return filtered;
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Memoize the combined shop list to prevent recalculation on every render
  const shopItems = useMemo(() => {
    const length = Math.max(filteredPosts.length, filteredProducts.length);
    return Array.from({ length });
  }, [filteredPosts.length, filteredProducts.length]);

  const [contactData, setContactData] = useState({ name: "", email: "", mobile: "", message: "" });
  const [messageSent, setMessageSent] = useState(false);

  // Synchronize temp states with loaded data once they finish loading,
  // or when entering `/admin` after loading has completed.
  const isLoaded = isDataLoaded && isProductsLoaded && isPostsLoaded && isBlogsLoaded;
  const [lastLoadedPath, setLastLoadedPath] = useState("");

  useEffect(() => {
    if (location.pathname === "/admin" && isLoaded && lastLoadedPath !== "/admin") {
      setTempProfile(profile);
      setTempPosts(posts);
      setTempProducts(products);
      setTempBlogs(blogs);
      setDeletedPostIds([]);
      setDeletedProductIds([]);
      setDeletedBlogIds([]);
      setLastLoadedPath("/admin");
    } else if (location.pathname !== "/admin" && lastLoadedPath === "/admin") {
      setLastLoadedPath("");
    }
  }, [location.pathname, isLoaded, profile, posts, products, blogs, lastLoadedPath]);

  const [newPost, setNewPost] = useState({ type: "image", url: "", taggedProducts: [] as number[] });
  const [newProduct, setNewProduct] = useState({ name: "", price: "", url: "", buyUrl: "", description: "" });
  const [newBlog, setNewBlog] = useState({ title: "", category: "", excerpt: "", content: "", image: "", seoTitle: "", metaDescription: "", focusKeyword: "" });
  const [editorSelectionState, setEditorSelectionState] = useState({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    linkUrl: ""
  });

  const [linkEditorModal, setLinkEditorModal] = useState<{
    isOpen: boolean;
    type: "link" | "email";
    value: string;
    savedRange: Range | null;
    error: string;
  }>({
    isOpen: false,
    type: "link",
    value: "",
    savedRange: null,
    error: ""
  });

  const updateEditorSelectionState = () => {
    const isBold = document.queryCommandState('bold');
    const isItalic = document.queryCommandState('italic');
    const isUnderline = document.queryCommandState('underline');
    
    let linkUrl = "";
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let node = range.startContainer;
      
      while (node && node !== document.body) {
        if (node.nodeName === 'A') {
          linkUrl = (node as HTMLAnchorElement).href || "";
          break;
        }
        if (node instanceof HTMLElement && ((node as HTMLElement).id === 'blogRichEditor' || (node as HTMLElement).id === 'editBlogRichEditor')) {
          break;
        }
        node = node.parentNode as Node;
      }
    }

    setEditorSelectionState({
      isBold,
      isItalic,
      isUnderline,
      linkUrl
    });
  };

  const validateUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed || trimmed === "https://" || trimmed === "http://") {
      return "URL cannot be empty.";
    }
    const hasProtocol = /^https?:\/\//i.test(trimmed);
    const potentialUrl = hasProtocol ? trimmed : "https://" + trimmed;
    try {
      new URL(potentialUrl);
      return "";
    } catch {
      return "Please enter a valid URL (e.g., https://example.com).";
    }
  };

  const validateEmail = (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) {
      return "Email address cannot be empty.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return "Please enter a valid email address (e.g., mail@example.com).";
    }
    return "";
  };

  const triggerLinkModal = (type: "link" | "email") => {
    const selection = window.getSelection();
    let range: Range | null = null;
    let isCollapsed = true;
    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0).cloneRange();
      isCollapsed = range.collapsed || range.toString().trim() === "";
    }

    if (isCollapsed) {
      setLinkEditorModal({
        isOpen: true,
        type,
        value: "",
        savedRange: null,
        error: "Please select/highlight the text in the editor first to turn it into a link."
      });
      return;
    }

    const currentLink = editorSelectionState.linkUrl;
    let initialValue = "";
    if (type === "link") {
      initialValue = currentLink && !currentLink.startsWith("mailto:") ? currentLink : "";
      if (!initialValue) {
        initialValue = "https://";
      }
    } else {
      initialValue = currentLink && currentLink.startsWith("mailto:") ? currentLink.replace("mailto:", "") : "";
    }

    setLinkEditorModal({
      isOpen: true,
      type,
      value: initialValue,
      savedRange: range,
      error: ""
    });
  };

  const handleLinkModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = linkEditorModal.value.trim();

    const editEditor = document.getElementById("editBlogRichEditor");
    const createEditor = document.getElementById("blogRichEditor");
    const activeEditor = (editingBlog !== null && editEditor) ? editEditor : createEditor;

    if (linkEditorModal.type === "link") {
      const error = validateUrl(value);
      if (error) {
        setLinkEditorModal(prev => ({ ...prev, error }));
        return;
      }

      let finalUrl = value;
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = "https://" + finalUrl;
      }

      // Restore select
      const selection = window.getSelection();
      if (selection && linkEditorModal.savedRange) {
        selection.removeAllRanges();
        selection.addRange(linkEditorModal.savedRange);
      }

      if (activeEditor) {
        activeEditor.focus();
      }

      document.execCommand('createLink', false, finalUrl);
    } else {
      const error = validateEmail(value);
      if (error) {
        setLinkEditorModal(prev => ({ ...prev, error }));
        return;
      }

      let finalEmail = value;
      if (finalEmail.startsWith("mailto:")) {
        finalEmail = finalEmail.replace("mailto:", "");
      }
      const mailtoUrl = "mailto:" + finalEmail;

      // Restore select
      const selection = window.getSelection();
      if (selection && linkEditorModal.savedRange) {
        selection.removeAllRanges();
        selection.addRange(linkEditorModal.savedRange);
      }

      if (activeEditor) {
        activeEditor.focus();
      }

      document.execCommand('createLink', false, mailtoUrl);
    }

    updateEditorSelectionState();
    if (editEditor && editingBlog !== null) {
      setEditingBlog((prev: any) => ({ ...prev, content: editEditor.innerHTML }));
    } else if (createEditor) {
      setNewBlog(prev => ({ ...prev, content: createEditor.innerHTML }));
    }

    setLinkEditorModal(prev => ({ ...prev, isOpen: false }));
  };
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const editEditorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingBlog && editEditorRef.current) {
      if (editEditorRef.current.getAttribute("data-loaded-id") !== String(editingBlog.id)) {
        editEditorRef.current.innerHTML = editingBlog.content || "";
        editEditorRef.current.setAttribute("data-loaded-id", String(editingBlog.id));
      }
    } else if (!editingBlog && editEditorRef.current) {
      editEditorRef.current.removeAttribute("data-loaded-id");
      editEditorRef.current.innerHTML = "";
    }
  }, [editingBlog]);

  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "post" | "product" | "message" | "blog", id: any, docId?: string } | null>(null);

  const fetchProductDetails = async () => {
    if (!newProduct.buyUrl) return;
    setIsFetchingProduct(true);
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(newProduct.buyUrl)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      const html = data.contents;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Extract Title
      const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content");
      const title = doc.querySelector('title')?.textContent;
      const productName = ogTitle || title || "";

      // Extract Image
      const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute("content");
      const productImage = ogImage || "";

      // Extract Price (This is tricky, trying common patterns)
      let productPrice = "";
      
      // Try common price selectors
      const priceSelectors = [
        '[class*="price"]', 
        '[class*="Price"]', 
        '[id*="price"]', 
        '[id*="Price"]',
        'meta[property="product:price:amount"]',
        'meta[name="twitter:data1"]'
      ];

      for (const selector of priceSelectors) {
        const el = doc.querySelector(selector);
        if (el) {
          const content = el.getAttribute("content") || el.textContent;
          const match = content?.match(/[0-9,.]+/);
          if (match) {
            productPrice = match[0].replace(/,/g, '');
            break;
          }
        }
      }

      setNewProduct(prev => ({
        ...prev,
        name: productName.split('|')[0].split('-')[0].trim(),
        url: productImage,
        price: productPrice || prev.price,
        description: doc.querySelector('meta[property="og:description"]')?.getAttribute("content") || doc.querySelector('meta[name="description"]')?.getAttribute("content") || prev.description
      }));

    } catch (error) {
      console.error("Error fetching product details:", error);
      alert("Could not fetch product details automatically. Please enter them manually.");
    } finally {
      setIsFetchingProduct(false);
    }
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const postFileInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);

  const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleInsertInlineImage = async (editorId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          setIsUploading(true);
          const base64 = await compressImage(file);
          const editor = document.getElementById(editorId);
          if (editor) {
            editor.focus();
            const imgHtml = `<img src="${base64}" class="max-w-full rounded-2xl my-4 shadow-md inline-block" alt="Fashion hub styling tip" style="display: block; margin: 16px auto;" />`;
            document.execCommand('insertHTML', false, imgHtml);
            if (editorId === "editBlogRichEditor") {
              setEditingBlog((prev: any) => ({ ...prev, content: editor.innerHTML }));
            } else {
              setNewBlog((prev: any) => ({ ...prev, content: editor.innerHTML }));
            }
          }
        } catch (err) {
          console.error("Inline image insertion failed:", err);
          alert("Failed to insert inline image.");
        } finally {
          setIsUploading(false);
        }
      }
    };
    input.click();
  };

  // ============= SMART PASTE (Blogger/Patreon-style) =============
  // Preserves headings/bold/italic/lists from ChatGPT, Google Docs, Word, Notion.
  // Also converts markdown-style plain text (## Heading, **bold**, - list) to HTML.
  const sanitizePastedHtml = (html: string): string => {
    const allowedTags = new Set(["H1","H2","H3","H4","H5","H6","P","BR","STRONG","B","EM","I","U","A","UL","OL","LI","BLOCKQUOTE","CODE","PRE","IMG","DIV","SPAN"]);
    const allowedAttrs: Record<string,string[]> = { A: ["href","title","target","rel"], IMG: ["src","alt","title"] };
    const doc = new DOMParser().parseFromString(`<div id="__root__">${html}</div>`, "text/html");
    const root = doc.getElementById("__root__");
    if (!root) return "";
    const walk = (node: Element) => {
      Array.from(node.children).forEach(walk);
      const tag = node.tagName;
      if (!allowedTags.has(tag)) {
        // unwrap unknown tag but keep its text/children
        const parent = node.parentNode;
        if (parent) {
          while (node.firstChild) parent.insertBefore(node.firstChild, node);
          parent.removeChild(node);
        }
        return;
      }
      // strip disallowed attributes (removes styles, classes, spans of colors, etc.)
      const keep = allowedAttrs[tag] || [];
      Array.from(node.attributes).forEach(attr => {
        if (!keep.includes(attr.name.toLowerCase())) node.removeAttribute(attr.name);
      });
      // force safe link targets
      if (tag === "A") {
        const href = node.getAttribute("href") || "";
        if (/^\s*javascript:/i.test(href)) node.removeAttribute("href");
        if (node.getAttribute("target") === "_blank") node.setAttribute("rel","noopener noreferrer");
      }
    };
    walk(root);
    return root.innerHTML;
  };

  const markdownToHtml = (text: string): string => {
    const escape = (s: string) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const lines = text.replace(/\r\n/g,"\n").split("\n");
    const out: string[] = [];
    let listType: "ul" | "ol" | null = null;
    const closeList = () => { if (listType) { out.push(`</${listType}>`); listType = null; } };
    const inline = (s: string) => escape(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      .replace(/(^|\s)\*(?!\s)([^*]+?)\*(?!\w)/g, "$1<em>$2</em>")
      .replace(/(^|\s)_(?!\s)([^_]+?)_(?!\w)/g, "$1<em>$2</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    for (const raw of lines) {
      const line = raw.trimEnd();
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      const ul = line.match(/^\s*[-*+]\s+(.*)$/);
      const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
      if (h) {
        closeList();
        const lvl = Math.min(h[1].length, 6);
        out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      } else if (ul) {
        if (listType !== "ul") { closeList(); out.push("<ul>"); listType = "ul"; }
        out.push(`<li>${inline(ul[1])}</li>`);
      } else if (ol) {
        if (listType !== "ol") { closeList(); out.push("<ol>"); listType = "ol"; }
        out.push(`<li>${inline(ol[1])}</li>`);
      } else if (line.trim() === "") {
        closeList();
      } else {
        closeList();
        out.push(`<p>${inline(line)}</p>`);
      }
    }
    closeList();
    return out.join("");
  };

  const handleSmartPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const cd = e.clipboardData;
    if (!cd) return;
    const html = cd.getData("text/html");
    const text = cd.getData("text/plain");
    let insert = "";
    if (html && html.trim()) {
      insert = sanitizePastedHtml(html);
    } else if (text) {
      // Detect markdown-ish syntax; else fall back to line-broken paragraphs
      if (/(^|\n)\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s)|(\*\*|__|`|\[.+\]\(.+\))/.test(text)) {
        insert = markdownToHtml(text);
      } else {
        const esc = text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
        insert = esc.split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g,"<br>")}</p>`).join("");
      }
    }
    if (!insert) return;
    document.execCommand("insertHTML", false, insert);
    const editor = e.currentTarget;
    if (editor.id === "editBlogRichEditor") {
      setEditingBlog((prev: any) => prev ? { ...prev, content: editor.innerHTML } : prev);
    } else {
      setNewBlog((prev: any) => ({ ...prev, content: editor.innerHTML }));
    }
    updateEditorSelectionState();
  };



  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, target: "avatar" | "post" | "product" | "blog") => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      
      const isVideo = file.type.startsWith("video/");
      
      if (isVideo) {
        if (target === "post") {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            if (base64.length > 1000000) {
              alert("Video is too large for direct upload (Max 1MB). Please use a YouTube/Instagram link instead.");
              setIsUploading(false);
              return;
            }
            setNewPost({ ...newPost, url: base64, type: "video" });
            setIsUploading(false);
          };
          reader.onerror = () => {
            alert("Failed to read video file.");
            setIsUploading(false);
          };
        } else {
          setIsUploading(false);
        }
        return;
      }

      try {
        // Compress image to ensure it stays under Firestore's 1MB limit
        const compressedBase64 = await compressImage(file);
        
        if (target === "avatar") {
          setTempProfile({ ...tempProfile, avatar: compressedBase64 });
        } else if (target === "post") {
          setNewPost({ ...newPost, url: compressedBase64, type: "image" });
        } else if (target === "product") {
          setNewProduct({ ...newProduct, url: compressedBase64 });
        } else if (target === "blog") {
          setNewBlog({ ...newBlog, image: compressedBase64 });
        }
      } catch (error) {
        console.error("Compression failed:", error);
        alert("Failed to process image. Please try a different one.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isAddingPost, setIsAddingPost] = useState(false);

  const handleAddPost = async () => {
    if (!newPost.url) return;
    setIsAddingPost(true);
    setTempPosts([{ id: Date.now(), ...newPost }, ...tempPosts]);
    setNewPost({ type: "image", url: "", name: "", description: "", category: "", taggedProducts: [] });
    setIsAddingPost(false);
  };

  const handleSaveAll = async () => {
    if (isSaving || !isAdminUser) return;
    setIsSaving(true);
    setIsNavigating(true);
    
    try {
      // 1. Save Profile Settings if changed
      if (JSON.stringify(tempProfile) !== JSON.stringify(profile)) {
        const profileRes = await fetch("/api/settings/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(tempProfile)
        });
        if (!profileRes.ok) {
          console.error("Failed to save profile settings:", profileRes.statusText);
        }
      }

      // 2. Save and Sync Blogs, Products, Posts to Supabase via admin-sync proxy
      const syncResponse = await fetch("/api/admin-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          blogs: tempBlogs,
          products: tempProducts,
          posts: tempPosts,
          deletedBlogIds,
          deletedProductIds,
          deletedPostIds
        })
      });
      if (!syncResponse.ok) {
        throw new Error("Failed to sync changes: " + syncResponse.statusText);
      }

      // Reset deletion trackers immediately
      setDeletedPostIds([]);
      setDeletedProductIds([]);
      setDeletedBlogIds([]);

      // Update main state immediately for better UX
      setProfile(tempProfile);
      setPosts(tempPosts);
      setProducts(tempProducts);
      setBlogs(tempBlogs);

      setShowSaveConfirm(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save changes:", error);
      alert("Failed to save changes: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsSaving(false);
      setIsNavigating(false);
    }
  };

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSendingMessage) return;
    
    setIsSendingMessage(true);
    setIsNavigating(true);
    try {
      const newMessage = {
        ...contactData,
        id: Date.now(),
        timestamp: new Date().toISOString()
      };
      
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newMessage)
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit message");
      }
      
      setMessageSent(true);
      setContactData({ name: "", email: "", mobile: "", message: "" });
      setIsNavigating(false);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSendingMessage(false);
      setIsNavigating(false);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    if (!isAdminUser) return;
    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setMessages(messages.filter(m => m.id !== id));
      } else {
        throw new Error("Failed to delete message");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete message. Please try again.");
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: loginData.username, password: loginData.password })
      });

      if (!res.ok) {
        setLoginError("Invalid username or password");
        return;
      }

      setIsAdminUser(true);
      handleNavigate("/admin");
      setLoginError("");
      setLoginData({ username: "", password: "" });
    } catch {
      setLoginError("Login failed. Please try again.");
    }
  };

  // Prevent body scroll when loader is active
  useEffect(() => {
    if (isNavigating || showSplash) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isNavigating, showSplash]);

  return (
    <>
      <CustomCursor theme={theme} isMobile={isMobile} />
      <AnimatePresence>
        {isNavigating && <PageLoader theme={theme} />}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 left-0 top-0 w-screen h-screen z-[9999] flex flex-col items-center justify-center ${theme === "dark" ? "bg-[#0B1512] gold-grain-dark text-amber-50" : "bg-[#FDFBF7] gold-grain-light text-stone-900"}`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="w-24 h-24 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ShoppingBag className="w-8 h-8 text-amber-500" />
                </motion.div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 text-center px-4"
            >
              <p className="text-xl font-bold tracking-[0.1em] text-amber-600 dark:text-amber-400 uppercase mb-1.5 font-serif">We Are Preparing For You</p>
              <p className="text-xs tracking-[0.15em] text-stone-500 dark:text-stone-400 uppercase font-bold mb-4">Please Wait</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-bounce" />
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <div className="min-h-screen relative">
            <AnnouncementBanner theme={theme} />

            <Routes location={location}>
          <Route path="/admin" element={
        <motion.div
          key="admin"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`min-h-screen ${theme === "dark" ? "gold-grain-dark text-amber-50" : "gold-grain-light text-stone-900"} font-sans transition-colors duration-300`}
        >
          {!isAdminUser ? (
            <Navigate to="/login" replace />
          ) : (
          <div className="pb-32">
        {/* Admin Header */}
        <div className={`sticky top-0 z-50 ${theme === "dark" ? "bg-[#0B1512]/90 border-white/10" : "bg-[#FDFBF7]/90 border-black/10"} md:backdrop-blur-xl border-b px-6 py-4`}>
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Settings className="w-5 h-5 text-amber-500 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Admin Panel</h2>
                <p className={`text-[10px] ${theme === "dark" ? "text-white/40" : "text-black/40"} uppercase tracking-widest`}>Control Center</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={async () => {
                  try {
                    await fetch("/api/admin-auth", { method: "DELETE" });
                  } catch {
                    // Client state is still cleared below.
                  }
                  setIsAdminUser(false);
                  handleNavigate("/");
                }}
                className={`p-2 rounded-xl ${theme === "dark" ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white" : "bg-red-500/5 border-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"} transition-all border`}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleNavigate("/")}
                className={`p-2 rounded-xl ${theme === "dark" ? "bg-white/5 hover:bg-white/10 border-white/10" : "bg-black/5 hover:bg-black/10 border-black/10"} transition-colors border`}
              >
                <X className={`w-5 h-5 ${theme === "dark" ? "text-white/70" : "text-black/70"}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {itemToDelete !== null && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 md:backdrop-blur-sm"
                onClick={() => setItemToDelete(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`relative w-full max-w-sm p-8 rounded-3xl ${theme === "dark" ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10"} border shadow-2xl`}
              >
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className={`text-xl font-bold mb-2 text-center ${theme === "dark" ? "text-white" : "text-black"}`}>Delete {itemToDelete.type === 'post' ? 'Post' : itemToDelete.type === 'product' ? 'Product' : itemToDelete.type === 'message' ? 'Message' : 'Blog'}?</h3>
                <p className={`${theme === "dark" ? "text-white/60" : "text-black/60"} text-sm mb-8 text-center`}>This action cannot be undone. It will be permanently removed.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setItemToDelete(null)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm ${theme === "dark" ? "bg-white/5 hover:bg-white/10 text-white" : "bg-black/5 hover:bg-black/10 text-black"} transition-colors`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      if (itemToDelete.type === 'message') {
                        await handleDeleteMessage(itemToDelete.id);
                      } else if (itemToDelete.type === 'post') {
                        if (itemToDelete.id) {
                          setDeletedPostIds(prev => [...prev, itemToDelete.id.toString()]);
                        }
                        setTempPosts(tempPosts.filter(p => p.id !== itemToDelete.id));
                      } else if (itemToDelete.type === 'product') {
                        if (itemToDelete.id) {
                          setDeletedProductIds(prev => [...prev, itemToDelete.id.toString()]);
                        }
                        setTempProducts(tempProducts.filter(p => p.id !== itemToDelete.id));
                      } else if (itemToDelete.type === 'blog') {
                        if (itemToDelete.id) {
                          setDeletedBlogIds(prev => [...prev, itemToDelete.id.toString()]);
                        }
                        setTempBlogs(tempBlogs.filter(b => b.id !== itemToDelete.id));
                      }
                      setItemToDelete(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Rich Editor Link/Email insertion Modal */}
        <AnimatePresence>
          {linkEditorModal.isOpen && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/85 md:backdrop-blur-sm"
                onClick={() => setLinkEditorModal(prev => ({ ...prev, isOpen: false }))}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className={`relative w-full max-w-md p-6 rounded-3xl ${theme === "dark" ? "bg-[#161f1c] border-white/10" : "bg-white border-black/10"} border shadow-2xl`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}>
                    {linkEditorModal.type === "link" ? (
                      <>
                        <Link2 className="w-5 h-5 text-amber-500" />
                        Attach Hyperlink
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 text-amber-500" />
                        Attach Email
                      </>
                    )}
                  </h3>
                  <button 
                    type="button"
                    onClick={() => setLinkEditorModal(prev => ({ ...prev, isOpen: false }))}
                    className={`text-xs font-bold px-2 py-1 rounded-md ${theme === "dark" ? "hover:bg-white/5 text-white/40" : "hover:bg-black/5 text-black/45"}`}
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleLinkModalSubmit} className="space-y-4">
                  {linkEditorModal.savedRange === null ? (
                    <div className="p-4 text-xs border border-amber-500/20 bg-amber-500/10 rounded-2xl text-amber-500 leading-relaxed font-semibold">
                      Please select/highlight text in the editor first to turn it into a link or email.
                    </div>
                  ) : (
                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-1.5`}>
                        {linkEditorModal.type === "link" ? "Enter Destination URL *" : "Enter Email Address *"}
                      </label>
                      <input 
                        type="text" 
                        autoFocus
                        value={linkEditorModal.value}
                        onChange={(e) => setLinkEditorModal(prev => ({ ...prev, value: e.target.value, error: "" }))}
                        placeholder={linkEditorModal.type === "link" ? "https://example.com" : "hello@example.com"}
                        className={`w-full ${theme === "dark" ? "bg-[#0b1512] border-white/10 text-white placeholder-white/30" : "bg-stone-50 border-black/10 text-black placeholder-black/40"} border rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors text-sm font-semibold`}
                      />
                      {linkEditorModal.error && (
                        <p className="text-red-500 text-xs font-bold mt-1.5 animate-pulse">
                          {linkEditorModal.error}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-2">
                    <button 
                      type="button"
                      onClick={() => setLinkEditorModal(prev => ({ ...prev, isOpen: false }))}
                      className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider ${theme === "dark" ? "bg-white/5 hover:bg-white/10 text-white" : "bg-black/5 hover:bg-black/10 text-black"} transition-colors`}
                    >
                      Cancel
                    </button>
                    {linkEditorModal.savedRange !== null && (
                      <button 
                        type="submit"
                        className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider transition-colors"
                      >
                        {linkEditorModal.type === "link" ? "Apply Link" : "Apply Email"}
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Product Modal */}
        <AnimatePresence>
          {editingProduct !== null && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 md:backdrop-blur-sm"
                onClick={() => setEditingProduct(null)}
              />
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`relative w-full max-w-md p-6 rounded-3xl ${theme === "dark" ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10"} border shadow-2xl space-y-4`}
              >
                <h3 className={`text-xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-black"}`}>Edit Product</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-1`}>Product Name</label>
                    <input 
                      type="text" 
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                      className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500/50 transition-colors text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-1`}>Description</label>
                    <textarea 
                      value={editingProduct.description || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                      rows={3}
                      className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500/50 transition-colors text-sm resize-none`}
                      placeholder="Enter product description..."
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-1`}>Category</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={editingProduct.category || ""}
                        onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                        className={`flex-1 ${theme === "dark" ? "bg-[#222] border-white/10 text-white placeholder-white/30" : "bg-black/5 border-black/10 text-black placeholder-black/40"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500/50 transition-colors text-sm`}
                        placeholder="e.g. Sarees, Kurtas, Lehengas..."
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const autoCat = autoDetectCategory(editingProduct.name, editingProduct.description || "");
                          setEditingProduct({...editingProduct, category: autoCat});
                        }}
                        className={`px-3 py-2 text-xs font-bold rounded-xl ${theme === "dark" ? "bg-white/5 hover:bg-white/10 text-white" : "bg-black/5 hover:bg-black/10 text-black"} border ${theme === "dark" ? "border-white/10" : "border-black/10"}`}
                        title="Auto-detect Category"
                      >
                        Detect ✨
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="w-full sm:w-1/3">
                      <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-1`}>Price</label>
                      <input 
                        type="text" 
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                        className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500/50 transition-colors text-sm`}
                      />
                    </div>
                    <div className="flex-1">
                      <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-1`}>Buy URL</label>
                      <input 
                        type="text" 
                        value={editingProduct.buyUrl}
                        onChange={(e) => setEditingProduct({...editingProduct, buyUrl: e.target.value})}
                        className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500/50 transition-colors text-sm`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-1`}>Product Image</label>
                    <div className="flex gap-3 items-center">
                      <MediaImage url={editingProduct.url} className="w-16 h-16 rounded-xl object-cover border border-white/10" />
                      <button 
                        onClick={() => productFileInputRef.current?.click()}
                        className={`flex-1 py-3 rounded-xl ${theme === "dark" ? "bg-white/5 border-white/20 hover:border-orange-500/50 text-white/60" : "bg-black/5 border-black/20 hover:border-orange-500/50 text-black/60"} border border-dashed transition-all flex items-center justify-center gap-2 text-xs`}
                      >
                        <ImageIcon className="w-4 h-4" />
                        Change Image
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setEditingProduct(null)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm ${theme === "dark" ? "bg-white/5 hover:bg-white/10 text-white" : "bg-black/5 hover:bg-black/10 text-black"} transition-colors`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setTempProducts(tempProducts.map(p => p.id === editingProduct.id ? editingProduct : p));
                      setEditingProduct(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Blog Modal */}
        <AnimatePresence>
          {editingBlog !== null && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-xs">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80"
                onClick={() => setEditingBlog(null)}
              />
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className={`relative w-full max-w-lg p-6 rounded-3xl ${theme === "dark" ? "bg-[#111] border-white/10" : "bg-white border-black/10"} border shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto z-10`}
              >
                <div className="flex justify-between items-center pb-2 border-b border-amber-500/10">
                  <h3 className={`text-lg font-serif font-black uppercase tracking-wide ${theme === "dark" ? "text-amber-100" : "text-amber-950"}`}>Edit Blog Post</h3>
                  <button 
                    onClick={() => setEditingBlog(null)}
                    className={`p-1.5 rounded-full hover:bg-stone-500/10 ${theme === "dark" ? "text-stone-400 hover:text-stone-200" : "text-stone-600 hover:text-stone-850"}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-stone-400" : "text-stone-500"} mb-1`}>Blog Title</label>
                    <input 
                      type="text" 
                      value={editingBlog.title}
                      onChange={(e) => setEditingBlog({...editingBlog, title: e.target.value})}
                      className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-colors text-sm font-semibold`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-stone-400" : "text-stone-500"} mb-1`}>Category</label>
                      <input 
                        type="text" 
                        value={editingBlog.category || ""}
                        onChange={(e) => setEditingBlog({...editingBlog, category: e.target.value})}
                        className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-colors text-sm`}
                        placeholder="e.g. Sarees, Tips..."
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-stone-400" : "text-stone-500"} mb-1`}>Formatted Date</label>
                      <input 
                        type="text" 
                        value={editingBlog.timestamp ? new Date(editingBlog.timestamp).toLocaleDateString() : ""}
                        disabled
                        className={`w-full ${theme === "dark" ? "bg-white/2 border-white/5 text-stone-500" : "bg-black/5 border-black/5 text-stone-400"} border rounded-xl px-4 py-2.5 text-sm cursor-not-allowed`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-stone-400" : "text-stone-500"} mb-1`}>Excerpt / Summary</label>
                    <textarea 
                      value={editingBlog.excerpt || ""}
                      onChange={(e) => setEditingBlog({...editingBlog, excerpt: e.target.value})}
                      rows={2}
                      className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-colors text-sm resize-none`}
                    />
                  </div>

                  {/* SEO Configuration Block */}
                  <div className={`p-4 rounded-xl border ${theme === "dark" ? "bg-white/[0.02] border-white/10" : "bg-stone-50 border-stone-200"} space-y-4`}>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-500/90 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      SEO Optimization Settings
                    </h4>
                    
                    <div>
                      <label className={`block text-[9px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-stone-400" : "text-stone-500"} mb-1`}>SEO Title *</label>
                      <input 
                        type="text" 
                        value={editingBlog.seoTitle || ""}
                        onChange={(e) => setEditingBlog({...editingBlog, seoTitle: e.target.value})}
                        className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2 focus:outline-none focus:border-amber-500/50 transition-colors text-xs font-semibold`}
                        placeholder="Latest Fashion Trends 2026..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-[9px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-stone-400" : "text-stone-500"} mb-1`}>Meta Description *</label>
                        <textarea 
                          value={editingBlog.metaDescription || ""}
                          onChange={(e) => setEditingBlog({...editingBlog, metaDescription: e.target.value})}
                          rows={2}
                          className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2 focus:outline-none focus:border-amber-500/50 transition-colors text-xs font-semibold resize-none`}
                          placeholder="Meta description content..."
                        />
                      </div>
                      <div>
                        <label className={`block text-[9px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-stone-400" : "text-stone-500"} mb-1`}>Focus Keyword *</label>
                        <textarea 
                          value={editingBlog.focusKeyword || ""}
                          onChange={(e) => setEditingBlog({...editingBlog, focusKeyword: e.target.value})}
                          rows={2}
                          className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2 focus:outline-none focus:border-amber-500/50 transition-colors text-xs font-semibold resize-none`}
                          placeholder="Focus keyword content..."
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-stone-400" : "text-stone-500"} mb-1`}>Article Content *</label>
                    <div className={`rounded-xl border ${theme === "dark" ? "bg-[#0b1512] border-white/10" : "bg-stone-50 border-black/10"} overflow-hidden`}>
                      {/* Edit Editor Toolbar */}
                      <div className={`p-1.5 border-b flex flex-wrap items-center gap-1.5 ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-[#fcfaf6] border-black/10"}`}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            document.execCommand('bold', false);
                            updateEditorSelectionState();
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            editorSelectionState.isBold 
                              ? "bg-amber-500/20 text-amber-500 border border-amber-500/40" 
                              : `hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`
                          }`}
                          title="Bold"
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            document.execCommand('italic', false);
                            updateEditorSelectionState();
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            editorSelectionState.isItalic 
                              ? "bg-amber-500/20 text-amber-500 border border-amber-500/40" 
                              : `hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`
                          }`}
                          title="Italic"
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            document.execCommand('underline', false);
                            updateEditorSelectionState();
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            editorSelectionState.isUnderline 
                              ? "bg-amber-500/20 text-amber-500 border border-amber-500/40" 
                              : `hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`
                          }`}
                          title="Underline"
                        >
                          <Underline className="w-4 h-4" />
                        </button>

                        <div className={`w-px h-6 my-1 ${theme === "dark" ? "bg-white/10" : "bg-black/15"}`} />

                        {/* Format Blocks */}
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, '<h1>'); }}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`}
                          title="Heading 1"
                        >H1</button>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, '<h2>'); }}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`}
                          title="Heading 2"
                        >H2</button>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            document.execCommand('formatBlock', false, '<h3>');
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`}
                          title="Format Title Block (Heading 3)"
                        >
                          H3
                        </button>

                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            document.execCommand('formatBlock', false, '<p>');
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`}
                          title="Format Standard Text Block"
                        >
                          Text
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            document.execCommand('insertUnorderedList', false);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`}
                          title="Bulleted List"
                        >
                          • Bullet List
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            document.execCommand('insertOrderedList', false);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`}
                          title="Numbered List"
                        >
                          1. Numbered List
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertInlineImage("editBlogRichEditor")}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-amber-500/15 hover:text-amber-500 flex items-center gap-1.5 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`}
                          title="Insert Image Inline"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                          <span>Add Image</span>
                        </button>

                        <div className={`w-px h-6 my-1 ${theme === "dark" ? "bg-white/10" : "bg-black/15"}`} />

                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            triggerLinkModal("link");
                          }}
                          className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${
                            editorSelectionState.linkUrl && !editorSelectionState.linkUrl.startsWith("mailto:")
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" 
                              : `hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`
                          }`}
                          title="Attach Link to Selection"
                        >
                          <Link2 className="w-4 h-4 text-amber-500" />
                          <span>Attach Link</span>
                        </button>

                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            triggerLinkModal("email");
                          }}
                          className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${
                            editorSelectionState.linkUrl && editorSelectionState.linkUrl.startsWith("mailto:")
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" 
                              : `hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`
                          }`}
                          title="Attach Email to Selection"
                        >
                          <Mail className="w-4 h-4 text-amber-500" />
                          <span>Attach Email</span>
                        </button>

                        {editorSelectionState.linkUrl && (
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                            theme === "dark" 
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/25" 
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}>
                            <span className="truncate max-w-[160px]" title={editorSelectionState.linkUrl}>
                              {editorSelectionState.linkUrl.startsWith("mailto:") 
                                ? `Email: ${editorSelectionState.linkUrl.replace("mailto:", "")}` 
                                : `Linked: ${editorSelectionState.linkUrl}`}
                            </span>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                document.execCommand('unlink', false);
                                updateEditorSelectionState();
                                const editor = document.getElementById("editBlogRichEditor");
                                if (editor) {
                                  setEditingBlog((prev: any) => ({ ...prev, content: editor.innerHTML }));
                                }
                              }}
                              className="text-amber-500 hover:text-red-500 transition-colors font-black text-xs ml-1"
                              title="Remove Link"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Interactive WYSIWYG Editable Area */}
                      <div
                        id="editBlogRichEditor"
                        ref={editEditorRef}
                        contentEditable
                        suppressContentEditableWarning={true}
                        onInput={() => {
                          updateEditorSelectionState();
                        }}
                        onMouseUp={updateEditorSelectionState}
                        onKeyUp={updateEditorSelectionState}
                        onFocus={updateEditorSelectionState}
                        onBlur={updateEditorSelectionState}
                        onPaste={handleSmartPaste}
                        className={`w-full min-h-[220px] p-4 text-sm font-semibold focus:outline-none blog-content ${theme === "dark" ? "text-stone-100" : "text-stone-850"}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-stone-400" : "text-stone-500"} mb-1`}>Header Image</label>
                    <div className="flex gap-3 items-center">
                      <MediaImage url={editingBlog.image} className="w-16 h-12 rounded-xl object-cover border border-white/5" />
                      <button 
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = async (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setEditingBlog((prev: any) => ({ ...prev, image: reader.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                        className={`flex-1 py-2.5 rounded-xl ${theme === "dark" ? "bg-white/5 border-white/20 hover:border-amber-500/50 text-white/60" : "bg-black/5 border-black/20 hover:border-amber-500/50 text-black/60"} border border-dashed transition-all flex items-center justify-center gap-2 text-xs`}
                      >
                        <ImageIcon className="w-4 h-4" />
                        Change Header Image
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setEditingBlog(null)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm ${theme === "dark" ? "bg-white/5 hover:bg-white/10 text-white" : "bg-black/5 hover:bg-black/10 text-black"} transition-colors`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      const editor = document.getElementById("editBlogRichEditor");
                      const updatedBlog = editor 
                        ? { ...editingBlog, content: editor.innerHTML }
                        : editingBlog;
                      setTempBlogs(tempBlogs.map(b => b.id === updatedBlog.id ? updatedBlog : b));
                      setEditingBlog(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black uppercase text-xs tracking-wider transition-colors shadow-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="max-w-2xl mx-auto p-6">
          {/* Admin Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide" onWheel={(e) => { if (e.deltaY !== 0) { e.currentTarget.scrollLeft += e.deltaY; } }}>
            {[
              { id: "profile", label: "Profile", icon: User },
              { id: "posts", label: "Posts", icon: ImageIcon },
              { id: "products", label: "Products", icon: Tag },
              { id: "messages", label: "Messages", icon: MessageSquare },
              { id: "blogs", label: "Blogs", icon: BookOpen },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap border ${
                  adminTab === tab.id 
                    ? `${theme === "dark" ? "bg-amber-500 text-stone-950 border-amber-500 shadow-md shadow-amber-500/10" : "bg-amber-950 text-white border-[#1c1b18] shadow-md shadow-amber-950/10"}` 
                    : `${theme === "dark" ? "bg-stone-900/40 text-stone-400 border-amber-500/10 hover:bg-stone-900/60" : "bg-white/60 text-stone-600 border-amber-500/10 hover:bg-white"}`
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.id === "messages" && messages.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[8px]">
                    {messages.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-8">
            {adminTab === "profile" && (
              <section className={`p-6 rounded-3xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border`}>
                <h2 className="text-lg font-black font-serif text-amber-950 dark:text-amber-100 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-500" />
                  Edit Profile
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative group">
                      <MediaImage 
                        url={tempProfile.avatar} 
                        className={`w-20 h-20 rounded-2xl object-cover border ${theme === "dark" ? "border-white/10" : "border-black/10"}`} 
                        fallback={
                          <div className={`w-20 h-20 rounded-2xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border flex items-center justify-center`}>
                            <User className={`w-8 h-8 ${theme === "dark" ? "text-white/20" : "text-black/20"}`} />
                          </div>
                        }
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl"
                      >
                        <ImageIcon className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "avatar")}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold">Profile Picture</p>
                      <p className={`text-xs ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-2`}>Recommended: 400x400px</p>
                      {tempProfile.avatar && (
                        <button
                          type="button"
                          onClick={() => {
                            const downloadUrl = `/api/download-image?url=${encodeURIComponent(tempProfile.avatar)}`;
                            window.open(downloadUrl, '_blank');
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
                            theme === "dark" 
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20" 
                              : "bg-amber-500/10 border-amber-500/20 text-amber-700 hover:bg-amber-500/20"
                          }`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download Image
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-2`}>Display Name</label>
                    <input 
                      type="text" 
                      value={tempProfile.name}
                      onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})}
                      className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-2`}>Bio</label>
                    <textarea 
                      rows={3}
                      value={tempProfile.bio}
                      onChange={(e) => setTempProfile({...tempProfile, bio: e.target.value})}
                      className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors text-sm resize-none`}
                    />
                  </div>
                  <div className={`mt-6 pt-6 border-t ${theme === "dark" ? "border-white/5" : "border-black/5"}`}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500 mb-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Legal Policies Management
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>Privacy Policy</label>
                          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold tracking-wider uppercase">Crawlable & Legal</span>
                        </div>
                        <textarea 
                          rows={10}
                          value={tempProfile.privacyPolicy || ""}
                          onChange={(e) => setTempProfile({...tempProfile, privacyPolicy: e.target.value})}
                          className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors text-xs font-mono`}
                          placeholder="Enter the updated privacy policy text..."
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>Terms of Service</label>
                          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold tracking-wider uppercase">Crawlable & Legal</span>
                        </div>
                        <textarea 
                          rows={10}
                          value={tempProfile.termsOfService || ""}
                          onChange={(e) => setTempProfile({...tempProfile, termsOfService: e.target.value})}
                          className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors text-xs font-mono`}
                          placeholder="Enter the updated terms of service text..."
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setShowSaveConfirm(true)}
                          className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-stone-950 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer active:scale-95"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Update Privacy & Terms
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {adminTab === "posts" && (
              <section className={`p-6 rounded-3xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border`}>
                <h2 className="text-lg font-black font-serif text-amber-950 dark:text-amber-100 mb-6 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-500" />
                  Manage Posts (Gallery)
                </h2>
                
                {/* Add Post Form */}
                <div className={`p-4 rounded-2xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border mb-6 space-y-4`}>
                  {newPost.url && (
                    <div className={`relative aspect-video rounded-xl overflow-hidden border ${theme === "dark" ? "border-white/10" : "border-black/10"} bg-black/20`}>
                      {newPost.type === "video" ? (
                        <VideoEmbed url={newPost.url} minimal />
                      ) : (
                        <MediaImage url={newPost.url} className="w-full h-full object-contain" />
                      )}
                      <button 
                        onClick={() => setNewPost({ ...newPost, url: "" })}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button 
                      onClick={() => postFileInputRef.current?.click()}
                      className={`flex-1 py-3 rounded-xl ${theme === "dark" ? "bg-white/5 border-white/20 hover:border-amber-500/50" : "bg-black/5 border-black/20 hover:border-amber-500/50"} border border-dashed transition-all flex items-center justify-center gap-2 text-xs ${theme === "dark" ? "text-white/60" : "text-black/60"}`}
                    >
                      {isUploading ? (
                        <div className={`w-4 h-4 border-2 ${theme === "dark" ? "border-white/30 border-t-white" : "border-black/30 border-t-black"} rounded-full animate-spin`} />
                      ) : <ImageIcon className="w-4 h-4" />}
                      Upload Image/Video
                    </button>
                    <input 
                      type="file" 
                      ref={postFileInputRef} 
                      className="hidden" 
                      accept="image/*,video/*"
                      onChange={(e) => handleFileUpload(e, "post")}
                    />
                    <button 
                      onClick={() => setNewPost({...newPost, type: "video", url: ""})}
                      className={`p-3 rounded-xl border transition-all ${newPost.type === "video" ? "bg-amber-500/20 border-amber-500 text-amber-500" : `${theme === "dark" ? "bg-white/5 border-white/10 text-white/40" : "bg-black/5 border-black/10 text-black/40"}`}`}
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </div>

                  <input 
                    type="text" 
                    placeholder="Post Caption / Title"
                    value={newPost.name || ""}
                    onChange={(e) => {
                      const captionVal = e.target.value;
                      const detected = autoDetectCategory(captionVal, "");
                      setNewPost({
                        ...newPost,
                        name: captionVal,
                        category: newPost.category && newPost.category !== autoDetectCategory(newPost.name || "", "") ? newPost.category : detected
                      });
                    }}
                    className={`w-full ${theme === "dark" ? "bg-[#222] border-white/10 text-white placeholder-white/30" : "bg-black/5 border-black/10 text-black placeholder-black/40"} border rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors text-sm`}
                  />

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Category (e.g. Sarees, Kurtas, Lehengas...)"
                      value={newPost.category || ""}
                      onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                      className={`flex-1 ${theme === "dark" ? "bg-[#222] border-white/10 text-white placeholder-white/30" : "bg-black/5 border-black/10 text-black placeholder-black/40"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-colors text-sm`}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const autoCat = autoDetectCategory(newPost.name || "", "");
                        setNewPost({...newPost, category: autoCat});
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-xl ${theme === "dark" ? "bg-white/5 hover:bg-white/10 text-white" : "bg-black/5 hover:bg-black/10 text-black"} border ${theme === "dark" ? "border-white/10" : "border-black/10"}`}
                      title="Auto-detect Category from Caption"
                    >
                      Detect ✨
                    </button>
                  </div>

                  {newPost.type === "video" && (
                    <input 
                      type="text" 
                      placeholder="Paste YT, IG, or FB video link..."
                      value={newPost.url}
                      onChange={(e) => setNewPost({...newPost, url: e.target.value, type: "video"})}
                      className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors text-sm`}
                    />
                  )}

                  {/* Tag Products */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2 flex items-center gap-2">
                      <Tag className="w-3 h-3" />
                      Tag Products
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {tempProducts.map(product => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            const isTagged = newPost.taggedProducts.includes(product.id);
                            let updatedTagged = [] as number[];
                            if (isTagged) {
                              updatedTagged = newPost.taggedProducts.filter(id => id !== product.id);
                            } else {
                              updatedTagged = [...newPost.taggedProducts, product.id];
                            }
                            
                            let detectedCat = newPost.category;
                            if (updatedTagged.length > 0) {
                              const firstTaggedProd = tempProducts.find(p => p.id === updatedTagged[0]);
                              if (firstTaggedProd && firstTaggedProd.category) {
                                detectedCat = firstTaggedProd.category;
                              }
                            }
                            
                            setNewPost({ 
                              ...newPost, 
                              taggedProducts: updatedTagged,
                              category: detectedCat
                            });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                            newPost.taggedProducts.includes(product.id) 
                              ? "bg-amber-500/20 border-amber-500 text-amber-500" 
                              : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                          }`}
                        >
                          {product.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleAddPost}
                    disabled={isAddingPost || !newPost.url}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      isAddingPost || !newPost.url 
                        ? "bg-amber-650/40 text-stone-500 cursor-not-allowed" 
                        : "bg-amber-500 hover:bg-amber-400 text-stone-950 font-black uppercase text-xs tracking-wider"
                    }`}
                  >
                    {isAddingPost ? (
                      <>
                        <div className="w-4 h-4 border-2 border-stone-950/30 border-t-stone-950 rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : "Add to Gallery"}
                  </button>
                </div>

                {/* Posts List */}
                <div className="grid grid-cols-4 gap-2">
                  {tempPosts.map((post) => (
                    <div key={post.id} className="relative aspect-square rounded-lg overflow-hidden group border border-white/10 bg-black">
                      {post.type === "video" ? (
                        <div className="w-full h-full relative">
                          <VideoEmbed url={post.url} minimal />
                        </div>
                      ) : (
                        <MediaImage url={post.url} className="w-full h-full object-cover" />
                      )}
                      <button 
                        onClick={() => setItemToDelete({ type: 'post', id: post.id, docId: post.docId })}
                        className="absolute top-1 right-1 p-1.5 rounded-md bg-red-500 text-white z-10 shadow-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {adminTab === "products" && (
              <section className={`p-6 rounded-3xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border`}>
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-orange-500" />
                  Manage Products (Shop)
                </h2>

                {/* Add Product Form */}
                <div className={`p-4 rounded-2xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border mb-6 space-y-3`}>
                  <input 
                    type="text" 
                    placeholder="Product Name"
                    value={newProduct.name}
                    onChange={(e) => {
                      const nameVal = e.target.value;
                      const detected = autoDetectCategory(nameVal, newProduct.description);
                      setNewProduct({
                        ...newProduct,
                        name: nameVal,
                        category: newProduct.category && newProduct.category !== autoDetectCategory(newProduct.name, newProduct.description) ? newProduct.category : detected
                      });
                    }}
                    className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-colors text-sm`}
                  />
                  <textarea 
                    placeholder="Product Description"
                    value={newProduct.description}
                    onChange={(e) => {
                      const descVal = e.target.value;
                      const detected = autoDetectCategory(newProduct.name, descVal);
                      setNewProduct({
                        ...newProduct,
                        description: descVal,
                        category: newProduct.category && newProduct.category !== autoDetectCategory(newProduct.name, newProduct.description) ? newProduct.category : detected
                      });
                    }}
                    rows={2}
                    className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-colors text-sm resize-none`}
                  />

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Category (e.g. Sarees, Kurtas, Lehengas...)"
                      value={newProduct.category || ""}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      className={`flex-1 ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-colors text-sm`}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const autoCat = autoDetectCategory(newProduct.name, newProduct.description);
                        setNewProduct({...newProduct, category: autoCat});
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-xl ${theme === "dark" ? "bg-white/5 hover:bg-white/10 text-white" : "bg-black/5 hover:bg-black/10 text-black"} border ${theme === "dark" ? "border-white/10" : "border-black/10"}`}
                      title="Auto-detect Category from Name/Description"
                    >
                      Detect ✨
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        placeholder="Price"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                        className={`w-full sm:w-24 ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-colors text-sm`}
                      />
                      <div className="flex gap-2 flex-1">
                        <input 
                          type="text" 
                          placeholder="Buy Link (URL)"
                          value={newProduct.buyUrl}
                          onChange={(e) => setNewProduct({...newProduct, buyUrl: e.target.value})}
                          onBlur={() => {
                            if (newProduct.buyUrl && !newProduct.name) {
                              fetchProductDetails();
                            }
                          }}
                          className={`flex-1 min-w-0 ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-colors text-sm`}
                        />
                        <button 
                          onClick={fetchProductDetails}
                          disabled={isFetchingProduct || !newProduct.buyUrl}
                          className={`px-4 py-2.5 rounded-xl ${theme === "dark" ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-500/5 border-amber-500/10"} border text-amber-500 hover:bg-amber-500/20 transition-all disabled:opacity-50 flex items-center justify-center flex-shrink-0`}
                          title="Fetch Product Details"
                        >
                          {isFetchingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 flex gap-2">
                      {newProduct.url && (
                        <div className={`w-10 h-10 rounded-lg overflow-hidden border ${theme === "dark" ? "border-white/10" : "border-black/10"} flex-shrink-0`}>
                          <MediaImage url={newProduct.url} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <button 
                        onClick={() => productFileInputRef.current?.click()}
                        className={`flex-1 py-2.5 rounded-xl ${theme === "dark" ? "bg-white/5 border-white/20 hover:border-orange-500/50" : "bg-black/5 border-black/20 hover:border-orange-500/50"} border border-dashed transition-all flex items-center justify-center gap-2 text-xs ${theme === "dark" ? "text-white/60" : "text-black/60"}`}
                      >
                        <ImageIcon className="w-4 h-4" />
                        {newProduct.url ? "Change Image" : "Upload Image"}
                      </button>
                    </div>
                    <input 
                      type="file" 
                      ref={productFileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "product")}
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (!newProduct.name || !newProduct.url) return;
                      setTempProducts([{ id: Date.now(), ...newProduct, reviews: [] }, ...tempProducts]);
                      setNewProduct({ name: "", price: "", url: "", buyUrl: "", description: "", category: "" });
                    }}
                    className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition-all"
                  >
                    Add Product
                  </button>
                </div>

                {/* Products List */}
                <div className="space-y-2">
                  {tempProducts.map((product) => (
                    <div key={product.id} className={`flex items-center gap-3 p-2 rounded-xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border group`}>
                      <MediaImage url={product.url} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="text-sm font-bold">{product.name}</p>
                        <p className={`text-xs ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>₹{product.price}</p>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setEditingProduct(product)}
                          className={`p-2 rounded-lg ${theme === "dark" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-blue-500/10 text-blue-600 border border-blue-500/20"} transition-all`}
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setItemToDelete({ type: 'product', id: product.id, docId: product.docId })}
                          className={`p-2 rounded-lg ${theme === "dark" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-red-500/10 text-red-600 border border-red-500/20"} transition-all`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {adminTab === "messages" && (
              <section className={`p-6 rounded-3xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border`}>
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  User Messages
                </h2>
                
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className={`w-16 h-16 rounded-full ${theme === "dark" ? "bg-white/5" : "bg-black/5"} flex items-center justify-center mx-auto mb-4`}>
                      <MessageSquare className={`w-8 h-8 ${theme === "dark" ? "text-white/20" : "text-black/20"}`} />
                    </div>
                    <p className={`${theme === "dark" ? "text-white/40" : "text-black/40"} text-sm`}>No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`p-4 rounded-2xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border relative group`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-sm">{msg.name}</h3>
                            <p className="text-[10px] text-white/40">{msg.timestamp}</p>
                          </div>
                          <button 
                            onClick={() => setItemToDelete({ type: 'message', id: msg.id })}
                            className={`p-2 rounded-lg ${theme === "dark" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-red-500/10 text-red-600 border border-red-500/20"}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2 text-[11px] text-white/60">
                            <Mail className="w-3 h-3" />
                            {msg.email}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-white/60">
                            <Phone className="w-3 h-3" />
                            {msg.mobile}
                          </div>
                        </div>
                        <p className="text-xs text-white/80 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                          {msg.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {adminTab === "blogs" && (
              <section className={`p-6 rounded-3xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border space-y-8`}>
                <h2 className="text-lg font-black font-serif text-amber-950 dark:text-amber-100 mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  Blog Management
                </h2>

                {/* Form to add blogs */}
                <div className={`p-6 rounded-2xl ${theme === "dark" ? "bg-stone-900/40 border-white/5" : "bg-white border-black/0"} border space-y-4`}>
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-500">Create New Fashion Post</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-1`}>Article Title *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 5 Stunning Ways to Style Your Saree"
                        value={newBlog.title}
                        onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
                        className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white placeholder-white/30" : "bg-black/5 border-black/10 text-black placeholder-black/40"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-colors text-sm font-semibold`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-1`}>Category / Tag</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Sarees, Styling Tips, Vlogs"
                        value={newBlog.category}
                        onChange={(e) => setNewBlog({ ...newBlog, category: e.target.value })}
                        className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white placeholder-white/30" : "bg-black/5 border-black/10 text-black placeholder-black/40"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-colors text-sm font-semibold`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-1`}>Short Excerpt / Summary</label>
                    <textarea 
                      placeholder="Enter a brief teaser or summary of your fashion article..."
                      value={newBlog.excerpt}
                      onChange={(e) => setNewBlog({ ...newBlog, excerpt: e.target.value })}
                      rows={2}
                      className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white placeholder-white/30" : "bg-black/5 border-black/10 text-black placeholder-black/40"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-colors text-sm font-semibold resize-none`}
                    />
                  </div>

                  {/* SEO Configuration Section */}
                  <div className={`p-4 rounded-xl border ${theme === "dark" ? "bg-white/[0.02] border-white/10" : "bg-stone-50 border-stone-200"} space-y-4`}>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-500/90 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      SEO Optimization Settings
                    </h4>
                    
                    <div>
                      <label className={`block text-[9px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-1`}>SEO Title (Display in Search Results / social preview) *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Latest Fashion Trends 2026: Top Styles Every Fashion Lover Must Know"
                        value={newBlog.seoTitle}
                        onChange={(e) => setNewBlog({ ...newBlog, seoTitle: e.target.value })}
                        className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white placeholder-white/30" : "bg-black/5 border-black/10 text-black placeholder-black/40"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-colors text-xs font-semibold`}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-[9px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-1`}>Meta Description *</label>
                        <textarea 
                          placeholder="e.g. Discover the latest fashion trends of 2026, styling tips, outfit ideas, and must-have fashion essentials."
                          value={newBlog.metaDescription}
                          onChange={(e) => setNewBlog({ ...newBlog, metaDescription: e.target.value })}
                          rows={2}
                          className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white placeholder-white/30" : "bg-black/5 border-black/10 text-black placeholder-black/40"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-colors text-xs font-semibold resize-none`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[9px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-1`}>Focus Keyword *</label>
                        <textarea 
                          placeholder="e.g. fashion trends 2026, styling tips"
                          value={newBlog.focusKeyword}
                          onChange={(e) => setNewBlog({ ...newBlog, focusKeyword: e.target.value })}
                          rows={2}
                          className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white placeholder-white/30" : "bg-black/5 border-black/10 text-black placeholder-black/40"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500/50 transition-colors text-xs font-semibold resize-none`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Document Rich-Text Formatting Controls */}
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-1`}>Article Content *</label>
                    <div className={`rounded-xl border ${theme === "dark" ? "bg-[#0b1512] border-white/10" : "bg-stone-50 border-black/10"} overflow-hidden`}>
                      {/* Editor Toolbar */}
                      <div className={`p-1.5 border-b flex flex-wrap items-center gap-1.5 ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-[#fcfaf6] border-black/10"}`}>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            document.execCommand('bold', false);
                            updateEditorSelectionState();
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            editorSelectionState.isBold 
                              ? "bg-amber-500/20 text-amber-500 border border-amber-500/40" 
                              : `hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`
                          }`}
                          title="Bold"
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            document.execCommand('italic', false);
                            updateEditorSelectionState();
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            editorSelectionState.isItalic 
                              ? "bg-amber-500/20 text-amber-500 border border-amber-500/40" 
                              : `hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`
                          }`}
                          title="Italic"
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            document.execCommand('underline', false);
                            updateEditorSelectionState();
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            editorSelectionState.isUnderline 
                              ? "bg-amber-500/20 text-amber-500 border border-amber-500/40" 
                              : `hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`
                          }`}
                          title="Underline"
                        >
                          <Underline className="w-4 h-4" />
                        </button>

                        <div className={`w-px h-6 my-1 ${theme === "dark" ? "bg-white/10" : "bg-black/15"}`} />

                        {/* CMS Visual Block styles */}
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, '<h1>'); }}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`}
                          title="Heading 1"
                        >H1</button>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); document.execCommand('formatBlock', false, '<h2>'); }}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`}
                          title="Heading 2"
                        >H2</button>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            document.execCommand('formatBlock', false, '<h3>');
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`}
                          title="Format Title Block (Heading 3)"
                        >
                          H3
                        </button>

                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            document.execCommand('formatBlock', false, '<p>');
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`}
                          title="Format Standard Text Block"
                        >
                          Text
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            document.execCommand('insertUnorderedList', false);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`}
                          title="Bulleted List"
                        >
                          • Bullet List
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            document.execCommand('insertOrderedList', false);
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`}
                          title="Numbered List"
                        >
                          1. Numbered List
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertInlineImage("blogRichEditor")}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-amber-500/15 hover:text-amber-500 flex items-center gap-1.5 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`}
                          title="Insert Image Inline"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                          <span>Add Image</span>
                        </button>

                        <div className={`w-px h-6 my-1 ${theme === "dark" ? "bg-white/10" : "bg-black/15"}`} />
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            triggerLinkModal("link");
                          }}
                          className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${
                            editorSelectionState.linkUrl && !editorSelectionState.linkUrl.startsWith("mailto:")
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" 
                              : `hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`
                          }`}
                          title="Attach Link to Selection"
                        >
                          <Link2 className="w-4 h-4 text-amber-500" />
                          <span>Attach Link</span>
                        </button>

                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            triggerLinkModal("email");
                          }}
                          className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${
                            editorSelectionState.linkUrl && editorSelectionState.linkUrl.startsWith("mailto:")
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" 
                              : `hover:bg-amber-500/15 hover:text-amber-500 ${theme === "dark" ? "text-stone-300" : "text-stone-700"}`
                          }`}
                          title="Attach Email to Selection"
                        >
                          <Mail className="w-4 h-4 text-amber-500" />
                          <span>Attach Email</span>
                        </button>

                        {/* Shows attached link URL */}
                        {editorSelectionState.linkUrl && (
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                            theme === "dark" 
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/25" 
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}>
                            <span className="truncate max-w-[160px]" title={editorSelectionState.linkUrl}>
                              {editorSelectionState.linkUrl.startsWith("mailto:") 
                                ? `Email: ${editorSelectionState.linkUrl.replace("mailto:", "")}` 
                                : `Linked: ${editorSelectionState.linkUrl}`}
                            </span>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                document.execCommand('unlink', false);
                                updateEditorSelectionState();
                                const editor = document.getElementById("blogRichEditor");
                                if (editor) {
                                  setNewBlog(prev => ({ ...prev, content: editor.innerHTML }));
                                }
                              }}
                              className="text-amber-500 hover:text-red-500 transition-colors font-black text-xs ml-1"
                              title="Remove Link"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Interactive WYSIWYG Editable Area */}
                      <div
                        id="blogRichEditor"
                        contentEditable
                        onInput={() => {
                          updateEditorSelectionState();
                        }}
                        onMouseUp={updateEditorSelectionState}
                        onKeyUp={updateEditorSelectionState}
                        onFocus={updateEditorSelectionState}
                        onBlur={updateEditorSelectionState}
                        onPaste={handleSmartPaste}
                        placeholder="Share your fashion tips, style stories, and lifestyle updates... Highlight keywords to italicize, bold, or link them!"
                        className={`w-full min-h-[220px] p-4 text-sm font-semibold focus:outline-none blog-content ${theme === "dark" ? "text-stone-100" : "text-stone-850"}`}
                      />
                    </div>
                  </div>

                  {/* Header Image upload */}
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-1`}>Post Header Image</label>
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="relative group w-full sm:w-40 h-28 overflow-hidden rounded-xl border border-white/5">
                        <MediaImage 
                          url={newBlog.image} 
                          className="w-full h-full object-cover" 
                          fallback={
                            <div className={`w-full h-full ${theme === "dark" ? "bg-white/5" : "bg-black/5"} flex flex-col items-center justify-center`}>
                              <ImageIcon className={`w-8 h-8 ${theme === "dark" ? "text-white/20" : "text-black/20"} mb-1`} />
                              <span className="text-[9px] text-stone-500 font-bold tracking-widest uppercase">Select Image</span>
                            </div>
                          }
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const input = document.getElementById("blog-header-uploader") as HTMLInputElement;
                            input?.click();
                          }}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold text-white uppercase tracking-wider"
                        >
                          {isUploading ? "Uploading..." : "Click to Upload"}
                        </button>
                      </div>
                      <input 
                        type="file" 
                        id="blog-header-uploader" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, "blog")}
                      />
                      <div className="flex-1 w-full">
                        <button 
                          type="button"
                          onClick={() => {
                            const editor = document.getElementById("blogRichEditor");
                            const content = editor ? editor.innerHTML : newBlog.content;
                            if (!newBlog.title || !content) {
                              alert("Please write a Title and Article content before publishing.");
                              return;
                            }
                            const blogPost = {
                              id: Date.now(),
                              title: newBlog.title,
                              category: newBlog.category || "Fashion",
                              excerpt: newBlog.excerpt || "Check out our latest fashion updates...",
                              content: content,
                              image: newBlog.image || "",
                              timestamp: new Date().toISOString(),
                              seoTitle: newBlog.seoTitle || "",
                              metaDescription: newBlog.metaDescription || "",
                              focusKeyword: newBlog.focusKeyword || ""
                            };
                            setTempBlogs([blogPost, ...tempBlogs]);
                            setNewBlog({ title: "", category: "", excerpt: "", content: "", image: "", seoTitle: "", metaDescription: "", focusKeyword: "" });
                            if (editor) editor.innerHTML = "";
                          }}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 hover:opacity-95"
                        >
                          <Plus className="w-4 h-4" />
                          Publish blog post
                        </button>
                        <p className={`text-[10px] ${theme === "dark" ? "text-white/30" : "text-black/30"} mt-2 text-center sm:text-left`}>* Remember to tap "Save All Changes" at the bottom of the screen to write to Firestore permanently</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* List of current blogs */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-amber-500">Scheduled / Published Stories ({tempBlogs.length})</h3>
                  {tempBlogs.length === 0 ? (
                    <div className="text-center py-12">
                      <p className={`text-xs ${theme === "dark" ? "text-white/40" : "text-black/40"} font-bold tracking-wider uppercase`}>No blogs created yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {tempBlogs.map((b) => (
                        <div key={b.id} className={`p-4 rounded-2xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border flex gap-4 items-center relative group`}>
                          {b.image && (
                            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                              <MediaImage url={b.image} className="w-full h-full object-cover" alt={b.title} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className="font-bold text-sm truncate">{b.title}</h4>
                            <p className="text-[10px] text-amber-500 uppercase font-black tracking-widest">{b.category || "Fashion"}</p>
                            <p className={`text-[9px] ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>{new Date(b.timestamp).toLocaleDateString()}</p>
                          </div>
                          
                          <div className="flex gap-1.5 flex-row items-center flex-shrink-0">
                            <button 
                              type="button"
                              onClick={() => setEditingBlog(b)}
                              className={`p-2 rounded-xl ${theme === "dark" ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20" : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"} transition-all cursor-pointer`}
                              title="Edit Blog"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => setItemToDelete({ type: "blog", id: b.id, docId: b.docId })}
                              className={`p-2 rounded-xl ${theme === "dark" ? "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20" : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"} transition-all cursor-pointer`}
                              title="Delete Blog"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {adminTab !== "messages" && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 z-40">
                <button 
                  onClick={() => setShowSaveConfirm(true)}
                  className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-2xl shadow-amber-500/20 border border-amber-400/20 active:scale-[0.98]"
                >
                  <Save className="w-4 h-4" />
                  Save All Changes
                </button>
              </div>
            )}

            {/* Save Confirmation Modal */}
            <AnimatePresence>
              {showSaveConfirm && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/90 md:backdrop-blur-md z-[100] flex items-center justify-center p-6"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-[2.5rem] p-8 text-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                      <Save className="w-9 h-9 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-serif font-black mb-2 text-stone-100">Save Changes?</h3>
                    <p className="text-stone-400 text-xs mb-8">This will update your profile, posts, and products across the entire app.</p>
                    
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleSaveAll}
                        disabled={isSaving}
                        className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                          </>
                        ) : "Yes, Save Everything"}
                      </button>
                      <button 
                        onClick={() => setShowSaveConfirm(false)}
                        className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-stone-200 hover:text-white border border-white/5 font-black uppercase text-xs tracking-wider transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Toast */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] px-6 py-3.5 rounded-full bg-emerald-500 text-stone-950 font-black text-xs tracking-wider uppercase flex items-center gap-2 shadow-2xl shadow-emerald-500/20 border border-emerald-400/20"
                >
                  <CheckCircle2 className="w-4 h-4 text-stone-950 animate-bounce" />
                  Changes Saved Successfully!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    )}
  </motion.div>
          } />
          <Route path="/login" element={
        <motion.div
          key="login"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className={`min-h-screen ${theme === "dark" ? "gold-grain-dark text-amber-50" : "gold-grain-light text-[#1C1B18]"} font-sans flex items-center justify-center p-6 transition-colors duration-300`}
        >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-sm p-8 rounded-3xl ${theme === "dark" ? "bg-stone-900/40 border-amber-500/20" : "bg-white/80 border-amber-500/15 shadow-xl"} border md:backdrop-blur-xl`}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
              <Settings className="w-8 h-8 text-amber-500 animate-spin-slow" />
            </div>
            <h2 className="text-2xl font-serif font-black tracking-tight text-amber-950 dark:text-amber-100">Admin Login</h2>
            <p className={`${theme === "dark" ? "text-stone-400" : "text-stone-500"} text-xs mt-1 tracking-wide`}>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-[11px] font-black uppercase tracking-widest ${theme === "dark" ? "text-amber-500" : "text-[#1c1b18]"} mb-2`}>Username</label>
              <input 
                type="text" 
                required
                autoComplete="username"
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-stone-50 border-stone-200 text-stone-900"} border rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors text-sm`}
                placeholder="Username"
              />
            </div>
            <div>
              <label className={`block text-[11px] font-black uppercase tracking-widest ${theme === "dark" ? "text-amber-500" : "text-[#1c1b18]"} mb-2`}>Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  autoComplete="current-password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-stone-50 border-stone-200 text-stone-900"} border rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-amber-500/50 transition-colors text-sm`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${theme === "dark" ? "text-white/30 hover:text-white/70" : "text-black/30 hover:text-black/70"} transition-colors`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {loginError && <p className="text-red-500 text-xs font-semibold text-center">{loginError}</p>}
            <button 
              type="submit"
              className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black tracking-widest uppercase text-xs transition-all mt-4 shadow-lg shadow-amber-500/10 active:scale-98"
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => handleNavigate("/")}
              className={`w-full py-2 ${theme === "dark" ? "text-stone-400 hover:text-white" : "text-stone-500 hover:text-stone-900"} text-xs font-bold transition-colors`}
            >
              Cancel
            </button>
          </form>
        </motion.div>
        </motion.div>
          } />
          <Route path="/contact" element={
        <motion.div
          key="contact"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className={`min-h-screen ${theme === "dark" ? "gold-grain-dark text-amber-50" : "gold-grain-light text-[#1C1B18]"} font-sans p-6 md:p-12 transition-colors duration-300`}
        >
          {/* Subtle glow filter on top */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />

          <div className="max-w-5xl lg:max-w-6xl mx-auto relative z-10">
            {/* Elegant Header with Back Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-dashed border-amber-500/25">
              <div 
                onClick={() => {
                  handleNavigate("/");
                  setMessageSent(false);
                }}
                className="cursor-pointer group select-none transition-all duration-300"
              >
                <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-amber-600 dark:text-amber-400 block mb-1 group-hover:text-amber-500 transition-colors">
                  Styling Consultant Lounge
                </span>
                <h2 className="text-3xl font-serif font-semibold tracking-tight text-amber-950 dark:text-amber-100 flex items-center gap-2 group-hover:opacity-85 transition-opacity">
                  Contact Renu Fashion Hub <Sparkles className="w-5 h-5 text-amber-500 animate-pulse group-hover:scale-110 transition-transform" />
                </h2>
              </div>
              <button 
                onClick={() => {
                  handleNavigate("/");
                  setMessageSent(false);
                }}
                className={`flex items-center gap-2 self-start py-2.5 px-5 rounded-full text-xs font-semibold ${
                  theme === "dark" 
                    ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30" 
                    : "bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-200"
                } border transition-all active:scale-95`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Return to Showcase</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start w-full mt-4">
              
              {/* Studio Coordinates Info Column */}
              <div className="md:col-span-5 space-y-6">
                <div 
                  className={`p-6 sm:p-8 rounded-3xl transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${
                    theme === "dark" 
                      ? "bg-white/[0.04] border-white/10 hover:bg-white/[0.07]" 
                      : "bg-white border-amber-500/15 shadow-sm text-stone-900 hover:border-amber-500/30"
                  } border`}
                  itemScope
                  itemType="https://schema.org/LocalBusiness"
                >
                  <meta itemProp="name" content="Renu Fashion Hub" />
                  <meta itemProp="email" content="support@renufashionhub.in" />
                  <meta itemProp="telephone" content="+917248763036" />
                  
                  <div className="flex items-center gap-2.5 mb-4 border-b border-amber-500/10 pb-3">
                    <MapPin className="w-5 h-5 text-amber-500 flex-shrink-0 animate-bounce" />
                    <h2 className="text-lg font-black uppercase tracking-wider text-amber-500 font-serif">
                      OFFICE ADDRESS
                    </h2>
                  </div>
                  
                  <div itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
                    <p className={`text-base ${theme === "dark" ? "text-stone-100" : "text-stone-900"} font-black tracking-tight mb-1`}>
                      Renu Fashion Hub Headquarters
                    </p>
                    <p className={`text-sm ${theme === "dark" ? "text-stone-300" : "text-stone-700"} leading-relaxed font-semibold`}>
                      <span itemProp="streetAddress">Peepal Mandi</span><br />
                      <span itemProp="addressLocality">Agra</span>, <span itemProp="addressRegion">Uttar Pradesh</span><br />
                      <span itemProp="addressCountry">India</span>
                    </p>
                  </div>
                  
                  <div className="mt-6 space-y-3 pt-6 border-t border-amber-500/10">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-amber-500 flex-shrink-0 animate-bounce" />
                      <a href="tel:+917248763036" className="text-xs font-bold hover:underline" itemProp="telephone">
                        +91 72487 63036
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-amber-500 flex-shrink-0 animate-bounce" />
                      <a href="mailto:support@renufashionhub.in" className="text-xs font-bold hover:underline" itemProp="email">
                        support@renufashionhub.in
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
                      <span className="text-xs font-bold">
                        Mon - Sat: 11:00 AM - 8:00 PM
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl ${
                  theme === "dark" ? "bg-amber-500/5 text-amber-300 border-amber-500/10" : "bg-amber-500/5 text-amber-950 border-amber-500/10"
                } border text-xs`}>
                  <p className="font-semibold leading-relaxed">
                    🌟 <strong>Note:</strong> We encourage scheduling appointments before visiting our Agra headquarters to ensure customized curation sessions with Mrs. Renu Agarwal.
                  </p>
                </div>
              </div>

              {/* Form Column */}
              <div className="md:col-span-7">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`p-6 sm:p-8 rounded-3xl ${
                    theme === "dark" 
                      ? "bg-white/[0.04] border-white/10 text-white" 
                      : "bg-white border-amber-500/15 shadow-sm text-stone-900"
                  } border md:backdrop-blur-xl`}
                >
                  <AnimatePresence mode="wait">
                    {messageSent ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="text-center py-12"
                      >
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                          <Check className="w-9 h-9 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-serif font-black text-amber-950 dark:text-amber-100 mb-2">
                          Message Sent!
                        </h2>
                        <p className={`text-stone-500 dark:text-stone-400 text-xs mb-8 max-w-sm mx-auto leading-relaxed`}>
                          First of all, we have successfully received your message. Our design and styling coordinators will review your custom requests and reach out on your provided details within 12 to 24 hours.
                        </p>
                        <button 
                          onClick={() => setMessageSent(false)}
                          className="px-6 py-2.5 rounded-full border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black hover:bg-amber-500/10 transition-colors"
                        >
                          Send another message
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <h2 className="text-xl font-serif font-black text-amber-950 dark:text-amber-100 mb-1">
                          Send Direct Message to Admin
                        </h2>
                        <p className="text-xs text-stone-400 mb-6">
                          Fill out the form below to register custom inquiries under Renu Fashion Hub.
                        </p>

                        <form className="space-y-5" onSubmit={handleContactSubmit}>
                          <div>
                            <label className={`block text-[11px] font-black uppercase tracking-widest ${
                              theme === "dark" ? "text-amber-500" : "text-[#1c1b18]"
                            } mb-2`}>
                              Your Full Name
                            </label>
                            <input 
                              type="text" 
                              required
                              value={contactData.name}
                              onChange={(e) => setContactData({...contactData, name: e.target.value})}
                              className={`w-full text-xs xs:text-sm ${
                                theme === "dark" 
                                  ? "bg-white/5 border-white/10 text-white focus:border-amber-500/60" 
                                  : "bg-stone-50 border-stone-200 text-stone-900 focus:border-amber-500/60"
                              } border rounded-xl px-4 py-3 placeholder-stone-400 transition-all outline-none focus:ring-1 focus:ring-amber-500/25`}
                              placeholder="e.g. Priyanjali Sen"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className={`block text-[11px] font-black uppercase tracking-widest ${
                                theme === "dark" ? "text-amber-500" : "text-[#1c1b18]"
                              } mb-2`}>
                                Email Address
                              </label>
                              <input 
                                type="email" 
                                required
                                value={contactData.email}
                                onChange={(e) => setContactData({...contactData, email: e.target.value})}
                                className={`w-full text-xs xs:text-sm ${
                                  theme === "dark" 
                                    ? "bg-white/5 border-white/10 text-white focus:border-amber-500/60" 
                                    : "bg-stone-50 border-stone-200 text-stone-900 focus:border-amber-500/60"
                                } border rounded-xl px-4 py-3 placeholder-stone-400 transition-all outline-none focus:ring-1 focus:ring-amber-500/25`}
                                placeholder="name@domain.com"
                              />
                            </div>
                            <div>
                              <label className={`block text-[11px] font-black uppercase tracking-widest ${
                                theme === "dark" ? "text-amber-500" : "text-[#1c1b18]"
                              } mb-2`}>
                                Mobile Number
                              </label>
                              <input 
                                type="tel" 
                                required
                                value={contactData.mobile}
                                onChange={(e) => setContactData({...contactData, mobile: e.target.value})}
                                className={`w-full text-xs xs:text-sm ${
                                  theme === "dark" 
                                    ? "bg-white/5 border-white/10 text-white focus:border-amber-500/60" 
                                    : "bg-stone-50 border-stone-200 text-stone-900 focus:border-amber-500/60"
                                } border rounded-xl px-4 py-3 placeholder-stone-400 transition-all outline-none focus:ring-1 focus:ring-amber-500/25`}
                                placeholder="+91 XXXXX XXXXX"
                              />
                            </div>
                          </div>

                          <div>
                            <label className={`block text-[11px] font-black uppercase tracking-widest ${
                              theme === "dark" ? "text-amber-500" : "text-[#1c1b18]"
                            } mb-2`}>
                              Message Details
                            </label>
                            <textarea 
                              rows={4}
                              required
                              value={contactData.message}
                              onChange={(e) => setContactData({...contactData, message: e.target.value})}
                              className={`w-full text-xs xs:text-sm ${
                                theme === "dark" 
                                  ? "bg-white/5 border-white/10 text-white focus:border-amber-500/60" 
                                  : "bg-stone-50 border-stone-200 text-stone-900 focus:border-amber-500/60"
                              } border rounded-xl px-4 py-3 placeholder-stone-400 transition-all outline-none focus:ring-1 focus:ring-amber-500/25 resize-none`}
                              placeholder="Tell us what you are looking for, including specific colors or collections..."
                            />
                          </div>

                          <motion.button 
                            whileHover={{ 
                              scale: 1.025,
                              boxShadow: theme === "dark" ? "0 0 16px rgba(245, 158, 11, 0.4)" : "0 4px 12px rgba(28, 27, 24, 0.15)"
                            }}
                            whileTap={{ scale: 0.985 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            type="submit"
                            disabled={isSendingMessage}
                            className={`w-full py-4 rounded-xl ${
                              theme === "dark" 
                                ? "bg-amber-500 text-stone-950 font-bold" 
                                : "bg-amber-950 text-white font-semibold"
                            } transition-all duration-300 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer`}
                          >
                            {isSendingMessage ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Verifying Connection...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5 animate-pulse" />
                                <span>Send Inquire Message</span>
                              </>
                            )}
                          </motion.button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

            </div>

            <div className="mt-12">
              <ContactSupportAndFaq theme={theme} />
            </div>
          </div>
        </motion.div>
          } />
          <Route path="/" element={
        <motion.div
          key="profile"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`min-h-screen ${theme === "dark" ? "gold-grain-dark text-amber-50" : "gold-grain-light text-[#1C1B18]"} font-sans selection:bg-amber-500/30 transition-colors duration-300`}
        >

      {/* Background Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] ${theme === "dark" ? "bg-emerald-900/15" : "bg-amber-100/30"} blur-[120px] rounded-full`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] ${theme === "dark" ? "bg-amber-900/10" : "bg-amber-100/10"} blur-[120px] rounded-full`} />
      </div>

      <div className="relative w-full max-w-md md:max-w-3xl lg:max-w-6xl mx-auto px-6 md:px-8 lg:px-12 pt-16 pb-24">
        {/* Header Actions */}
        <div className="absolute top-6 left-6 flex gap-3 z-20">
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full ${theme === "dark" ? "bg-white/5 hover:bg-white/10 border-white/10" : "bg-black/5 hover:bg-black/10 border-black/10"} transition-colors border group`}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-white/70" />
            ) : (
              <Moon className="w-5 h-5 text-black/70" />
            )}
          </button>
        </div>

        <div className="absolute top-6 right-6 flex gap-3 z-20">
          <button 
            onClick={() => setShowShareModal(true)}
            className={`p-2 rounded-full ${theme === "dark" ? "bg-white/5 hover:bg-white/10 border-white/10" : "bg-black/5 hover:bg-black/10 border-black/10"} transition-colors border`}
          >
            <Share2 className={`w-5 h-5 ${theme === "dark" ? "text-white/70" : "text-black/70"}`} />
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-start mt-8">
          {/* Left Column: Profile & Social Links & Action Buttons */}
          <div 
            ref={sidebarRef}
            className="lg:col-span-5 space-y-6 lg:sticky"
            style={isMobile ? {} : {
              position: "sticky",
              top: `calc(100vh - ${sidebarHeight + 40}px)`,
              alignSelf: "start"
            }}
          >
            
            {/* Profile Section */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center lg:items-start text-center lg:text-left"
            >
              <div className="relative mb-4">
                <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300">
                  <MediaImage 
                    url={profile.avatar} 
                    alt={profile.name} 
                    className={`w-full h-full rounded-full object-cover border-4 ${theme === "dark" ? "border-[#0B1512]" : "border-white"}`}
                    fallback={
                      <div className={`w-full h-full rounded-full ${theme === "dark" ? "bg-[#0B1512]" : "bg-[#FDFBF7]"} flex items-center justify-center`}>
                        <User className={`w-12 h-12 ${theme === "dark" ? "text-white/20" : "text-black/20"}`} />
                      </div>
                    }
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                <div className="text-2xl font-bold tracking-tight">{profile.name}</div>
                <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500/10" />
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-1.5 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">Verified Creator</span>
              </div>
              <a 
                href="https://renufashionhub.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${theme === "dark" ? "text-white/40 hover:text-white/60" : "text-black/40 hover:text-black/60"} text-xs mb-4 transition-colors flex items-center justify-center lg:justify-start gap-1`}
              >
                <Globe className="w-3 h-3" />
                renufashionhub.in
              </a>
              
              <p className={`${theme === "dark" ? "text-white/60" : "text-black/60"} text-sm leading-relaxed mb-6 whitespace-pre-line max-w-[280px] lg:max-w-none`}>
                {profile.bio}
              </p>
            </motion.div>

            {/* Social Links */}
            <div className="space-y-3">
              {INITIAL_SOCIAL_LINKS.map((social, index) => (
                <motion.a 
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  whileHover="hover"
                  className={`relative overflow-hidden flex items-center justify-between p-4 rounded-2xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} transition-all border group`}
                >
                  <motion.div
                    variants={{
                      initial: { y: "100%" },
                      hover: { y: 0 }
                    }}
                    transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
                    className="absolute inset-0 bg-amber-500/10 -z-10"
                  />
                  <div className="relative z-10 flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${theme === "dark" ? "bg-white/5 group-hover:bg-white/10" : "bg-black/5 group-hover:bg-black/10"} transition-colors`}>
                      <social.icon className={`w-5 h-5 ${social.color}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${theme === "dark" ? "text-white/90 group-hover:text-white" : "text-black/90 group-hover:text-black"} transition-colors`}>{social.handle}</p>
                      <p className={`text-[10px] ${theme === "dark" ? "text-white/40" : "text-black/40"} uppercase tracking-widest`}>{social.label}</p>
                    </div>
                  </div>
                  <div className="relative z-10 flex items-center gap-2">
                    <ExternalLink className={`w-4 h-4 ${theme === "dark" ? "text-white/20 group-hover:text-white/40" : "text-black/20 group-hover:text-black/40"} transition-colors`} />
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Contact, Blog, and About Buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <PremiumButton
                  onClick={() => handleNavigate("/contact")}
                  className="w-full"
                  variant={theme === "dark" ? "secondary" : "primary"}
                >
                  Contact Us
                </PremiumButton>
                <PremiumButton
                  onClick={() => handleNavigate("/blog")}
                  className="w-full"
                  variant={theme === "dark" ? "primary" : "secondary"}
                >
                  <span className="flex items-center justify-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-500 animate-pulse" />
                    Fashion Blog
                  </span>
                </PremiumButton>
              </div>
              <PremiumButton
                onClick={() => handleNavigate("/about")}
                className="w-full"
                variant={theme === "dark" ? "secondary" : "primary"}
              >
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  About Renu Fashion Hub
                </span>
              </PremiumButton>

              {/* Added Legal buttons adjacent to About button */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 relative z-30">
                <motion.button
                  whileHover={{ 
                    scale: 1.04, 
                    boxShadow: theme === "dark" ? "0 0 14px rgba(245, 158, 11, 0.35)" : "0 0 10px rgba(245, 158, 11, 0.22)",
                    borderColor: "rgba(245, 158, 11, 0.45)",
                    color: theme === "dark" ? "#FBBF24" : "#B45309"
                  }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 420, damping: 17 }}
                  onClick={() => handleNavigate("/privacy-policy")}
                  className={`py-3 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors border ${
                    theme === "dark" 
                      ? "bg-white/[0.03] border-white/10 text-stone-300 hover:bg-white/[0.06]" 
                      : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                  } text-center truncate cursor-pointer select-none focus:outline-none`}
                >
                  Privacy Policy
                </motion.button>
                <motion.button
                  whileHover={{ 
                    scale: 1.04, 
                    boxShadow: theme === "dark" ? "0 0 14px rgba(245, 158, 11, 0.35)" : "0 0 10px rgba(245, 158, 11, 0.22)",
                    borderColor: "rgba(245, 158, 11, 0.45)",
                    color: theme === "dark" ? "#FBBF24" : "#B45309"
                  }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 420, damping: 17 }}
                  onClick={() => handleNavigate("/terms-of-service")}
                  className={`py-3 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors border ${
                    theme === "dark" 
                      ? "bg-white/[0.03] border-white/10 text-stone-300 hover:bg-white/[0.06]" 
                      : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                  } text-center truncate cursor-pointer select-none focus:outline-none`}
                >
                  Terms of Service
                </motion.button>
                <motion.button
                  whileHover={{ 
                    scale: 1.04, 
                    boxShadow: theme === "dark" ? "0 0 14px rgba(245, 158, 11, 0.35)" : "0 0 10px rgba(245, 158, 11, 0.22)",
                    borderColor: "rgba(245, 158, 11, 0.45)",
                    color: theme === "dark" ? "#FBBF24" : "#B45309"
                  }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 420, damping: 17 }}
                  onClick={() => handleNavigate("/disclaimer")}
                  className={`py-3 px-1 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors border ${
                    theme === "dark" 
                      ? "bg-white/[0.03] border-white/10 text-stone-300 hover:bg-white/[0.06]" 
                      : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                  } text-center truncate cursor-pointer select-none focus:outline-none`}
                >
                  Disclaimer
                </motion.button>
              </div>
            </div>

          </div>

          {/* Right Column: Carousel, Tabs & Dynamic Content List */}
          <div className="lg:col-span-7 space-y-8 mt-10 lg:mt-0">
            {/* Dynamic visible H1 tag for SEO compliance */}
            <h1 className="text-xl sm:text-2xl font-black font-serif tracking-tight text-amber-950 dark:text-amber-100 leading-tight">
              {searchQuery 
                ? `Search Results for "${searchQuery}"` 
                : (selectedCategory && selectedCategory !== "All") 
                  ? selectedCategory 
                  : "Renu Fashion Hub – Women's Fashion, Sarees, Kurtis, Jewellery & Style Guides"}
            </h1>
            {/* Weekly Best Sellers Carousel */}
            <LatestArrivalsCarousel products={products} posts={posts} theme={theme} navigate={handleNavigate} />

        {/* Tabs Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`flex p-1.5 rounded-2xl ${theme === "dark" ? "bg-white/10 border-white/10" : "bg-black/10 border-black/10"} border md:backdrop-blur-2xl mb-6`}
        >
          {INITIAL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSetActiveTab(tab.id)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all relative overflow-hidden group ${
                activeTab === tab.id 
                  ? (theme === "dark" ? "text-white" : "text-black") 
                  : (theme === "dark" ? "text-white/40" : "text-black/40")
              }`}
            >
              <motion.div
                initial={false}
                animate={{ 
                  y: activeTab === tab.id ? 0 : "100%",
                  opacity: activeTab === tab.id ? 1 : 0
                }}
                transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
                className={`absolute inset-0 -z-10 ${theme === "dark" ? "bg-amber-500/20" : "bg-amber-500/10"}`}
              />
              <span className="relative z-10">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Search Bar & Categories Horizontal Slider */}
        <ProductFilter 
          searchVal={searchQuery} 
          setSearchVal={setSearchQuery} 
          activeCat={selectedCategory} 
          setActiveCat={setSelectedCategory} 
          categories={dynamicCategories}
          theme={theme} 
        />

        {/* Tab Content */}
        <div className="min-h-[400px] will-change-contents">
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === "shop" && (
              <motion.div
                key="shop"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4"
              >
                {filteredPosts.length === 0 && filteredProducts.length === 0 ? (
                  <div className="col-span-full">
                    <EmptyState icon={ShoppingBag} message={searchQuery || selectedCategory !== "All" ? "No items match your search" : "No any products yet"} />
                  </div>
                ) : (
                  shopItems.map((_, index) => (
                    <React.Fragment key={index}>
                      {filteredPosts[index] && (
                        <ShopPostCard post={filteredPosts[index]} navigate={handleNavigate} isMobile={isMobile} />
                      )}
                      {filteredProducts[index] && (
                        <ProductCard product={filteredProducts[index]} navigate={handleNavigate} isMobile={isMobile} />
                      )}
                    </React.Fragment>
                  ))
                )}
              </motion.div>
            )}

            {activeTab === "post" && (
              <motion.div
                key="post"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4"
              >
                {filteredPosts.length === 0 ? (
                  <div className="col-span-full">
                    <EmptyState icon={ImageIcon} message={searchQuery || selectedCategory !== "All" ? "No posts match your search" : "No posts yet"} />
                  </div>
                ) : (
                  filteredPosts.map((post: any) => (
                    <ShopPostCard key={post.id} post={post} navigate={handleNavigate} isMobile={isMobile} />
                  ))
                )}
              </motion.div>
            )}

            {activeTab === "products" && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="space-y-4"
              >
                {/* Price Sort Selector Bar */}
                <div className={`flex items-center justify-between gap-1.5 p-2 rounded-2xl border ${
                  theme === "dark" 
                    ? "bg-[#141B19]/40 border-white/10" 
                    : "bg-[#1C1B18]/5 border-[#1C1B18]/10"
                }`}>
                  <span className={`text-[8.5px] font-black uppercase tracking-wider ${theme === "dark" ? "text-amber-100/90" : "text-[#1C1B18]"} flex items-center gap-1 flex-shrink-0`}>
                    <ArrowUpDown className="w-3 h-3 text-amber-500" /> Price:
                  </span>
                  <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                    <button
                      onClick={() => setSortBy("default")}
                      className={`px-2 py-1.5 rounded-xl text-[8.5px] font-black uppercase tracking-tight transition-all duration-300 flex-shrink-0 ${
                        sortBy === "default"
                          ? (theme === "dark" ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20" : "bg-stone-900 text-stone-50 shadow-md shadow-black/10")
                          : (theme === "dark" ? "bg-white/5 border border-white/5 hover:bg-white/15 text-stone-300 shadow-sm" : "bg-black/5 border border-transparent hover:bg-black/10 text-stone-700")
                      }`}
                    >
                      Featured
                    </button>
                    <button
                      onClick={() => setSortBy("price-asc")}
                      className={`px-2 py-1.5 rounded-xl text-[8.5px] font-black uppercase tracking-tight transition-all duration-300 flex-shrink-0 ${
                        sortBy === "price-asc"
                          ? (theme === "dark" ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20" : "bg-stone-900 text-stone-50 shadow-md shadow-black/10")
                          : (theme === "dark" ? "bg-white/5 border border-white/5 hover:bg-white/15 text-stone-300 shadow-sm" : "bg-black/5 border border-transparent hover:bg-black/10 text-stone-700")
                      }`}
                    >
                      Low to High
                    </button>
                    <button
                      onClick={() => setSortBy("price-desc")}
                      className={`px-2 py-1.5 rounded-xl text-[8.5px] font-black uppercase tracking-tight transition-all duration-300 flex-shrink-0 ${
                        sortBy === "price-desc"
                          ? (theme === "dark" ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20" : "bg-stone-900 text-stone-50 shadow-md shadow-black/10")
                          : (theme === "dark" ? "bg-white/5 border border-white/5 hover:bg-white/15 text-stone-300 shadow-sm" : "bg-black/5 border border-transparent hover:bg-black/10 text-stone-700")
                      }`}
                    >
                      High to Low
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {filteredProducts.length === 0 ? (
                    <div className="col-span-full">
                      <EmptyState icon={Tag} message={searchQuery || selectedCategory !== "All" ? "No products match your search" : "No any products yet"} />
                    </div>
                  ) : (
                    filteredProducts.map((product: any) => (
                      <ProductCard key={product.id} product={product} navigate={handleNavigate} isMobile={isMobile} />
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Full Screen Post View */}
        <AnimatePresence>
          {selectedPost && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black flex flex-col"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-6 right-6 z-[210] p-3 rounded-full bg-black/80 md:backdrop-blur-xl text-white border border-white/10 hover:bg-black/60 transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {selectedPost.type === "video" ? (
                  <div className="w-full h-full">
                    <VideoEmbed url={selectedPost.url} isMuted={isMuted} />
                  </div>
                ) : (
                  <MediaImage 
                    url={selectedPost.url} 
                    className="w-full h-full object-contain" 
                  />
                )}

                {/* Top Overlay Controls */}
                <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
                  <motion.button 
                    whileTap={{ scale: 0.8 }}
                    whileHover={{ scale: 1.15 }}
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-4 rounded-full bg-black/50 md:backdrop-blur-2xl text-white hover:bg-black/70 transition-all border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isMuted ? "muted" : "unmuted"}
                        initial={{ opacity: 0, scale: 0.2, rotate: -45 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.2, rotate: 45 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                      </motion.div>
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>

              {/* Bottom Overlay: Info & Products */}
              <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                {/* User Info */}
                <div className="flex items-center gap-4 mb-6">
                  <MediaImage 
                    url={profile.avatar} 
                    className="w-12 h-12 rounded-full border-2 border-white/40 object-cover shadow-2xl" 
                  />
                  <div>
                    <h4 className="text-base font-black text-white tracking-tight leading-tight">
                      {profile.name}
                    </h4>
                    <p className="text-xs text-white/50 font-bold tracking-wide">
                      renufashionhub.in
                    </p>
                  </div>
                </div>

                {/* Tagged Products Section */}
                {selectedPost.taggedProducts && selectedPost.taggedProducts.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x" onWheel={(e) => { if (e.deltaY !== 0) { e.currentTarget.scrollLeft += e.deltaY; } }}>
                      {selectedPost.taggedProducts.map((productId: number) => {
                        const product = products.find((p: any) => p.id === productId);
                        if (!product) return null;
                        return (
                          <div 
                            key={productId} 
                            onClick={() => product.buyUrl && window.open(product.buyUrl, "_blank")}
                            className="flex-shrink-0 w-64 p-2 rounded-2xl bg-white/10 md:backdrop-blur-xl border border-white/20 hover:bg-white/20 transition-all cursor-pointer group/item flex gap-3 snap-center"
                          >
                            <MediaImage url={product.url} className="w-20 h-20 object-cover rounded-xl" />
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Meesho</p>
                              <p className="text-[11px] font-bold truncate text-white">{product.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] font-bold text-white">₹{product.price}</span>
                                <span className="text-[9px] text-white/30 line-through">₹{Math.round(Number(product.price) * 1.5)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <PremiumButton 
                      onClick={() => {
                        if (selectedPost.taggedProducts?.[0]) {
                          const product = products.find((p: any) => p.id === selectedPost.taggedProducts[0]);
                          if (product?.buyUrl) window.open(product.buyUrl, "_blank");
                        }
                      }}
                      className="w-full"
                      icon={ShoppingBag}
                    >
                      Shop Tagged Products
                    </PremiumButton>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>


          </div> {/* End of Right Column */}
        </div> {/* End of lg:grid Grid */}

        {/* Footer */}
        <motion.footer 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
          className="mt-16 mb-12 px-4"
        >
          {/* Elegant Divider with Center Badge */}
          <div className="relative flex items-center justify-center my-10">
            <div className={`absolute left-0 right-0 h-[1px] ${
              theme === "dark" 
                ? "bg-gradient-to-r from-transparent via-white/10 to-transparent" 
                : "bg-gradient-to-r from-transparent via-black/10 to-transparent"
            }`} />
            <div 
              className={`relative z-10 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${
                theme === "dark" 
                  ? "bg-[#09100E] border-white/10 text-amber-500/80" 
                  : "bg-white border-black/10 text-amber-600/80"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-500" />
              <span>Premium Experience</span>
            </div>
          </div>

          <div className="max-w-md mx-auto flex flex-col items-center gap-6">
            {/* Top Side: Exquisite Designer Card */}
            <motion.div 
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${
                theme === "dark" 
                  ? "bg-white/[0.02] hover:bg-white/[0.04] border-white/10 text-amber-50 shadow-[0_4px_24px_rgba(0,0,0,0.4)]" 
                  : "bg-[#1C1B18]/[0.01] hover:bg-[#1C1B18]/[0.03] border-black/10 text-[#1C1B18] shadow-[0_4px_24px_rgba(0,0,0,0.02)]"
              }`}
            >
              <div className={`p-2 rounded-xl ${
                theme === "dark" 
                  ? "bg-gradient-to-br from-amber-500/10 to-amber-500/15 border border-white/5" 
                  : "bg-gradient-to-br from-amber-500/5 to-amber-500/10 border border-black/5"
              }`}>
                <Phone className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              </div>
              <div className="text-left leading-tight">
                <span className={`block text-[8px] font-extrabold uppercase tracking-widest ${
                  theme === "dark" ? "text-white/40" : "text-black/40"
                }`}>
                  Designed by
                </span>
                <span className="block text-[11px] font-black uppercase tracking-wider mt-0.5">
                  Shiva
                </span>
              </div>
              <a 
                href="https://wa.me/917248763036" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider ml-1.5 hover:scale-105 active:scale-95 transition-all shadow-md ${
                  theme === "dark" 
                    ? "bg-amber-500 hover:bg-amber-400 text-stone-950 border-amber-400 shadow-amber-500/10" 
                    : "bg-stone-900 hover:bg-stone-800 text-stone-50 border-stone-800 shadow-black/10"
                }`}
              >
                <span>+91 72487 63036</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </motion.div>

            {/* Bottom Side: Brand Statement, Copyright, and Privacy Policy in a Single Layout */}
            <div className="flex flex-col items-center gap-2 w-full max-w-sm">
              <div 
                className={`w-full flex items-center justify-center p-3 rounded-xl border text-[8.5px] font-black uppercase tracking-[0.18em] transition-all whitespace-nowrap overflow-x-hidden ${
                  theme === "dark" 
                    ? "bg-[#09100E] border-white/5 text-amber-500/60 shadow-[0_2px_12px_rgba(0,0,0,0.2)]" 
                    : "bg-stone-50 border-black/5 text-[#1C1B18]/60 shadow-[0_2px_12px_rgba(0,0,0,0.01)]"
                }`}
              >
                &copy; 2026 Renu Fashion Hub. All Rights Reserved.
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 items-center justify-center max-w-sm">
                <motion.a
                  href="/about"
                  whileHover={{ scale: 1.1, color: theme === "dark" ? "#FBBF24" : "#D97706" }}
                  whileTap={{ scale: 0.93 }}
                  transition={{ type: "spring", stiffness: 450, damping: 15 }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate("/about");
                  }}
                  className={`text-[9px] font-black uppercase tracking-[0.18em] transition-colors cursor-pointer outline-none ${
                    theme === "dark" ? "text-amber-500" : "text-[#1C1B18]/80"
                  }`}
                >
                  About Us
                </motion.a>
                <span className={`text-[8px] ${theme === "dark" ? "text-stone-700" : "text-stone-300"}`}>|</span>
                <motion.a
                  href="/privacy-policy"
                  whileHover={{ scale: 1.1, color: theme === "dark" ? "#FBBF24" : "#D97706" }}
                  whileTap={{ scale: 0.93 }}
                  transition={{ type: "spring", stiffness: 450, damping: 15 }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate("/privacy-policy");
                  }}
                  className={`text-[9px] font-black uppercase tracking-[0.18em] transition-colors cursor-pointer outline-none ${
                    theme === "dark" ? "text-amber-500" : "text-[#1C1B18]/80"
                  }`}
                >
                  Privacy
                </motion.a>
                <span className={`text-[8px] ${theme === "dark" ? "text-stone-700" : "text-stone-300"}`}>|</span>
                <motion.a
                  href="/terms-of-service"
                  whileHover={{ scale: 1.1, color: theme === "dark" ? "#FBBF24" : "#D97706" }}
                  whileTap={{ scale: 0.93 }}
                  transition={{ type: "spring", stiffness: 450, damping: 15 }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate("/terms-of-service");
                  }}
                  className={`text-[9px] font-black uppercase tracking-[0.18em] transition-colors cursor-pointer outline-none ${
                    theme === "dark" ? "text-amber-500" : "text-[#1C1B18]/80"
                  }`}
                >
                  Terms
                </motion.a>
                <span className={`text-[8px] ${theme === "dark" ? "text-stone-700" : "text-stone-300"}`}>|</span>
                <motion.a
                  href="/disclaimer"
                  whileHover={{ scale: 1.1, color: theme === "dark" ? "#FBBF24" : "#D97706" }}
                  whileTap={{ scale: 0.93 }}
                  transition={{ type: "spring", stiffness: 450, damping: 15 }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate("/disclaimer");
                  }}
                  className={`text-[9px] font-black uppercase tracking-[0.18em] transition-colors cursor-pointer outline-none ${
                    theme === "dark" ? "text-amber-500" : "text-[#1C1B18]/80"
                  }`}
                >
                  Disclaimer
                </motion.a>
                <span className={`text-[8px] ${theme === "dark" ? "text-stone-700" : "text-stone-300"}`}>|</span>
                <motion.a
                  href="/contact"
                  whileHover={{ scale: 1.1, color: theme === "dark" ? "#FBBF24" : "#D97706" }}
                  whileTap={{ scale: 0.93 }}
                  transition={{ type: "spring", stiffness: 450, damping: 15 }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate("/contact");
                  }}
                  className={`text-[9px] font-black uppercase tracking-[0.18em] transition-colors cursor-pointer outline-none ${
                    theme === "dark" ? "text-amber-500" : "text-[#1C1B18]/80"
                  }`}
                >
                  Contact
                </motion.a>
              </div>
            </div>
          </div>
        </motion.footer>

        {/* Share Modal */}
        <AnimatePresence>
          {showShareModal && (
            <ShareModal 
              isOpen={showShareModal} 
              onClose={() => setShowShareModal(false)} 
              profileName={profile.name}
              customUrl="http://renufashionhub.in"
              customTitle="Renu Fashion Hub"
              theme={theme}
            />
          )}
        </AnimatePresence>
      </div>
        </motion.div>
          } />
          <Route path="/about" element={
            <AboutPage 
              profile={profile} 
              theme={theme} 
              navigate={handleNavigate} 
              products={products}
              blogs={blogs}
              posts={posts}
              isProductsLoaded={isProductsLoaded}
              isBlogsLoaded={isBlogsLoaded}
              isPostsLoaded={isPostsLoaded}
              productsError={productsError}
              blogsError={blogsError}
              postsError={postsError}
            />
          } />
          <Route path="/about-us" element={<Navigate to="/about" replace />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage profile={profile} theme={theme} navigate={handleNavigate} />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage profile={profile} theme={theme} navigate={handleNavigate} />} />
          <Route path="/disclaimer" element={<DisclaimerPage profile={profile} theme={theme} navigate={handleNavigate} />} />
          <Route path="/product/:id" element={<ProductDetailPage products={products} theme={theme} navigate={handleNavigate} isLoaded={isProductsLoaded} />} />
          <Route path="/post/:id" element={<PostDetailPage posts={posts} products={products} profile={profile} theme={theme} navigate={handleNavigate} isMuted={isMuted} setIsMuted={setIsMuted} isLoaded={isPostsLoaded} />} />
          <Route path="/blog" element={<BlogListPage blogs={blogs} theme={theme} navigate={handleNavigate} isLoaded={isBlogsLoaded} />} />
          <Route path="/blog/:id" element={<BlogDetailPage blogs={blogs} theme={theme} navigate={handleNavigate} isLoaded={isBlogsLoaded} />} />
          <Route path="*" element={<PageNotFoundPage theme={theme} navigate={handleNavigate} />} />
        </Routes>
          </div>
        )}
      </AnimatePresence>

      {/* Global Contact Assistant - Support Quick Assist */}
      <SupportQuickAssist theme={theme} handleNavigate={handleNavigate} />
    </>
  );
}
