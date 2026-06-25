/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, FormEvent, ChangeEvent, useEffect, useMemo, useCallback } from "react";
import { Routes, Route, Link, useNavigate, useParams, useLocation, Navigate } from "react-router-dom";
import { get, set } from "idb-keyval";
import { motion, AnimatePresence } from "motion/react";
import { 
  db, 
  auth, 
  signInWithGoogle, 
  logout, 
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  updateDoc,
  handleFirestoreError,
  OperationType
} from "./firebase";
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
  Edit
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

    const handleScrollTrigger = () => {
      if (targetX === -100 || targetY === -100) return;
      const now = Date.now();
      if (now - lastScrollRippleTime > 180) { // Elite frequency scroll ripple throttling
        lastScrollRippleTime = now;
        addRippleRef.current(targetX, targetY);
      }
    };

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
    
    // Support nested horizontal scrolling containers & momentum scrolling globally by listening to window's capture phase
    window.addEventListener("scroll", handleScrollTrigger, { capture: true, passive: true });
    window.addEventListener("wheel", handleScrollTrigger, { passive: true });

    requestRef = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("scroll", handleScrollTrigger, { capture: true });
      window.removeEventListener("wheel", handleScrollTrigger);
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

    const handleTouchStartGlobal = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        addRippleRef.current(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleCustomRippleGlobal = (e: any) => {
      if (e.detail) {
        addRippleRef.current(e.detail.x, e.detail.y);
      }
    };

    window.addEventListener("mousedown", handleMouseDownGlobal, { passive: true });
    window.addEventListener("touchstart", handleTouchStartGlobal, { passive: true });
    window.addEventListener("custom-ripple", handleCustomRippleGlobal);

    return () => {
      window.removeEventListener("mousedown", handleMouseDownGlobal);
      window.removeEventListener("touchstart", handleTouchStartGlobal);
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

const ProductDetailPage = ({ products, theme, navigate, db, isLoaded }: { products: any[]; theme: string; navigate: any; db: any; isLoaded: boolean }) => {
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
      const review = {
        ...newReview,
        id: Date.now(),
        date: new Date().toISOString()
      };
      const updatedReviews = [...(product.reviews || []), review];
      const productRef = doc(db, "products", product.docId || String(product.id));
      await updateDoc(productRef, { reviews: updatedReviews });
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
    canonicalLink.setAttribute('href', 'https://renufashionhub.in/disclaimer');
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
    "url": "https://renufashionhub.in/disclaimer",
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
    avatar: "",
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
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Temporary states for Admin Panel
  const [tempProfile, setTempProfile] = useState(profile);
  const [tempPosts, setTempPosts] = useState(posts);
  const [tempProducts, setTempProducts] = useState(products);
  const [tempBlogs, setTempBlogs] = useState<any[]>([]);
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

  // Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Auth Listener
  useEffect(() => {
    // We keep the auth listener for potential future use, but admin is now handled by username/pass
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    // Check if admin was previously logged in (simple session)
    const savedAdmin = localStorage.getItem("rfh_admin_session");
    if (savedAdmin === "true") {
      setIsAdminUser(true);
    }
    
    return () => unsubscribe();
  }, []);

  // Load data from Firestore on mount
  useEffect(() => {
    // Real-time Profile
    const unsubProfile = onSnapshot(doc(db, "settings", "profile"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        setProfile({
          name: data.name || "Renu Fashion Hub",
          bio: data.bio || "",
          avatar: data.avatar || "",
          privacyPolicy: data.privacyPolicy || DEFAULT_PRIVACY_POLICY,
          termsOfService: data.termsOfService || DEFAULT_TERMS_OF_SERVICE,
        });
        setIsDataLoaded(true);
      }
    }, (err) => {
      console.error("Profile sync error:", err);
      setIsDataLoaded(true); // Still mark as loaded to show something
    });

    // Real-time Posts
    const unsubPosts = onSnapshot(query(collection(db, "posts"), orderBy("id", "desc")), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
      setPosts(data);
      setIsPostsLoaded(true);
      setPostsError(false);
    }, (err) => {
      console.error("Posts sync error:", err);
      setIsPostsLoaded(true);
      setPostsError(true);
    });

    // Real-time Products
    const unsubProducts = onSnapshot(query(collection(db, "products"), orderBy("id", "desc")), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
      setProducts(data);
      setIsProductsLoaded(true);
      setProductsError(false);
    }, (err) => {
      console.error("Products sync error:", err);
      setIsProductsLoaded(true);
      setProductsError(true);
    });

    // Real-time Blogs
    const unsubBlogs = onSnapshot(query(collection(db, "blogs"), orderBy("id", "desc")), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
      setBlogs(data);
      setIsBlogsLoaded(true);
      setBlogsError(false);
    }, (err) => {
      console.error("Blogs sync error:", err);
      setIsBlogsLoaded(true);
      setBlogsError(true);
    });

    // Real-time Messages (Admin only)
    let unsubMessages = () => {};
    if (isAdminUser) {
      unsubMessages = onSnapshot(query(collection(db, "messages"), orderBy("id", "desc")), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
        setMessages(data);
      }, (err) => console.error("Messages sync error:", err));
    }

    return () => {
      unsubProfile();
      unsubPosts();
      unsubProducts();
      unsubBlogs();
      unsubMessages();
    };
  }, [isAdminUser]);

  // Handle Login
  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      handleNavigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      setLoginError("Login failed. Please try again.");
    }
  };
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

  // Reset temp states when entering admin
  useEffect(() => {
    if (location.pathname === "/admin") {
      setTempProfile(profile);
      setTempPosts(posts);
      setTempProducts(products);
      setTempBlogs(blogs);
      setDeletedPostIds([]);
      setDeletedProductIds([]);
      setDeletedBlogIds([]);
    }
  }, [location.pathname, profile, posts, products, blogs]); // Added profile, posts, products, blogs to dependencies for safety

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
    
    // Helper to clean data for Firestore (remove docId)
    const cleanData = (item: any) => {
      const cleaned = { ...item };
      delete cleaned.docId;
      return cleaned;
    };

    try {
      const savePromises = [];

      // Only save profile if it changed
      if (JSON.stringify(tempProfile) !== JSON.stringify(profile)) {
        savePromises.push(setDoc(doc(db, "settings", "profile"), cleanData(tempProfile)));
      }

      // Save Posts (Only new or changed ones)
      for (const post of tempPosts) {
        const originalPost = posts.find(p => p.id === post.id);
        if (!originalPost || JSON.stringify(originalPost) !== JSON.stringify(post)) {
          const postRef = doc(db, "posts", post.docId || String(post.id));
          savePromises.push(setDoc(postRef, cleanData(post)));
        }
      }

      // Save Products (Only new or changed ones)
      for (const product of tempProducts) {
        const originalProduct = products.find(p => p.id === product.id);
        if (!originalProduct || JSON.stringify(originalProduct) !== JSON.stringify(product)) {
          const productRef = doc(db, "products", product.docId || String(product.id));
          savePromises.push(setDoc(productRef, cleanData(product)));
        }
      }

      // Save Blogs (Only new or changed ones)
      for (const blog of tempBlogs) {
        const originalBlog = blogs.find(b => b.id === blog.id);
        if (!originalBlog || JSON.stringify(originalBlog) !== JSON.stringify(blog)) {
          const blogRef = doc(db, "blogs", blog.docId || String(blog.id));
          savePromises.push(setDoc(blogRef, cleanData(blog)));
        }
      }

      // Handle Deletions
      for (const id of deletedPostIds) {
        savePromises.push(deleteDoc(doc(db, "posts", id)));
      }
      for (const id of deletedProductIds) {
        savePromises.push(deleteDoc(doc(db, "products", id)));
      }
      for (const id of deletedBlogIds) {
        savePromises.push(deleteDoc(doc(db, "blogs", id)));
      }

      // Execute all necessary operations in parallel
      if (savePromises.length > 0) {
        // Use Promise.allSettled to handle individual failures better
        const results = await Promise.allSettled(savePromises);
        const failures = results.filter(r => r.status === 'rejected');
        
        if (failures.length > 0) {
          console.error("Some operations failed:", failures);
          // If some failed, we still update the UI with what we have, but warn the user
          alert(`${failures.length} items failed to save. Please check your internet and try again.`);
        }
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
      console.error("Failed to save to Firestore:", error);
      alert("Failed to save changes: " + (error instanceof Error ? error.message : "Unknown error"));
      handleFirestoreError(error, OperationType.WRITE, "multiple");
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
      
      await addDoc(collection(db, "messages"), newMessage);
      
      setMessageSent(true);
      setContactData({ name: "", email: "", mobile: "", message: "" });
      setIsNavigating(false);
    } catch (error) {
      console.error("Failed to send message:", error);
      handleFirestoreError(error, OperationType.CREATE, "messages");
    } finally {
      setIsSendingMessage(false);
      setIsNavigating(false);
    }
  };

  const handleDeleteMessage = async (id: number) => {
    if (!isAdminUser) return;
    try {
      const msg = messages.find(m => m.id === id);
      if (msg?.docId) {
        await deleteDoc(doc(db, "messages", msg.docId));
      }
    } catch (error) {
      console.error("Delete failed:", error);
      handleFirestoreError(error, OperationType.DELETE, "messages");
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (loginData.username === "renufashionhub" && loginData.password === "gh12mn909") {
      setIsAdminUser(true);
      localStorage.setItem("rfh_admin_session", "true");
      handleNavigate("/admin");
      setLoginError("");
    } else {
      setLoginError("Invalid username or password");
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
                <h1 className="text-lg font-bold">Admin Panel</h1>
                <p className={`text-[10px] ${theme === "dark" ? "text-white/40" : "text-black/40"} uppercase tracking-widest`}>Control Center</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={async () => {
                  setIsAdminUser(false);
                  localStorage.removeItem("rfh_admin_session");
                  await logout();
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
                        if (itemToDelete.docId) {
                          setDeletedPostIds(prev => [...prev, itemToDelete.docId!]);
                        }
                        setTempPosts(tempPosts.filter(p => p.id !== itemToDelete.id));
                      } else if (itemToDelete.type === 'product') {
                        if (itemToDelete.docId) {
                          setDeletedProductIds(prev => [...prev, itemToDelete.docId!]);
                        }
                        setTempProducts(tempProducts.filter(p => p.id !== itemToDelete.id));
                      } else if (itemToDelete.type === 'blog') {
                        if (itemToDelete.docId) {
                          setDeletedBlogIds(prev => [...prev, itemToDelete.docId!]);
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
                        contentEditable
                        suppressContentEditableWarning={true}
                        dangerouslySetInnerHTML={{ __html: editingBlog.content }}
                        onInput={(e) => {
                          const html = e.currentTarget.innerHTML;
                          setEditingBlog((prev: any) => ({ ...prev, content: html }));
                          updateEditorSelectionState();
                        }}
                        onMouseUp={updateEditorSelectionState}
                        onKeyUp={updateEditorSelectionState}
                        onFocus={updateEditorSelectionState}
                        onBlur={updateEditorSelectionState}
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
                      setTempBlogs(tempBlogs.map(b => b.id === editingBlog.id ? editingBlog : b));
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
                      <p className={`text-xs ${theme === "dark" ? "text-white/40" : "text-black/40"}`}>Recommended: 400x400px</p>
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
                        onInput={(e) => {
                          const html = e.currentTarget.innerHTML;
                          setNewBlog(prev => ({ ...prev, content: html }));
                          updateEditorSelectionState();
                        }}
                        onMouseUp={updateEditorSelectionState}
                        onKeyUp={updateEditorSelectionState}
                        onFocus={updateEditorSelectionState}
                        onBlur={updateEditorSelectionState}
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
                            if (!newBlog.title || !newBlog.content) {
                              alert("Please write a Title and Article content before publishing.");
                              return;
                            }
                            const blogPost = {
                              id: Date.now(),
                              title: newBlog.title,
                              category: newBlog.category || "Fashion",
                              excerpt: newBlog.excerpt || "Check out our latest fashion updates...",
                              content: newBlog.content,
                              image: newBlog.image || "",
                              timestamp: new Date().toISOString(),
                              seoTitle: newBlog.seoTitle || "",
                              metaDescription: newBlog.metaDescription || "",
                              focusKeyword: newBlog.focusKeyword || ""
                            };
                            setTempBlogs([blogPost, ...tempBlogs]);
                            setNewBlog({ title: "", category: "", excerpt: "", content: "", image: "", seoTitle: "", metaDescription: "", focusKeyword: "" });
                            const editor = document.getElementById("blogRichEditor");
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
            <h1 className="text-2xl font-serif font-black tracking-tight text-amber-950 dark:text-amber-100">Admin Login</h1>
            <p className={`${theme === "dark" ? "text-stone-400" : "text-stone-500"} text-xs mt-1 tracking-wide`}>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-[11px] font-black uppercase tracking-widest ${theme === "dark" ? "text-amber-500" : "text-[#1c1b18]"} mb-2`}>Username</label>
              <input 
                type="text" 
                required
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
                <h1 className="text-3xl font-serif font-semibold tracking-tight text-amber-950 dark:text-amber-100 flex items-center gap-2 group-hover:opacity-85 transition-opacity">
                  Contact Renu Fashion Hub <Sparkles className="w-5 h-5 text-amber-500 animate-pulse group-hover:scale-110 transition-transform" />
                </h1>
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
          <Route path="/product/:id" element={<ProductDetailPage products={products} theme={theme} navigate={handleNavigate} db={db} isLoaded={isProductsLoaded} />} />
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
