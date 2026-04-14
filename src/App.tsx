/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, FormEvent, ChangeEvent, useEffect, useMemo, useCallback } from "react";
import { Routes, Route, Link, useNavigate, useParams, useLocation } from "react-router-dom";
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
  Star
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return;
      setMousePos({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
      const target = e.target as HTMLElement;
      setIsPointer(window.getComputedStyle(target).cursor === "pointer" || target.tagName === "BUTTON" || target.tagName === "A");
    };

    const handleMouseDown = (e: MouseEvent) => {
      setIsClicking(true);
      addRipple(e.clientX, e.clientY);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        addRipple(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleMouseUp = () => setIsClicking(false);

    const handleCustomRipple = (e: any) => {
      if (e.detail) {
        addRipple(e.detail.x, e.detail.y);
      }
    };

    const addRipple = (x: number, y: number) => {
      const id = Date.now() + Math.random();
      setRipples((prev) => [...prev, { id, x, y }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("custom-ripple", handleCustomRipple);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("custom-ripple", handleCustomRipple);
    };
  }, [isMobile]);

  return (
    <>
      {/* Desktop Trailing Cursor */}
      {!isMobile && (
        <div className="hidden md:block pointer-events-none fixed inset-0 z-[9999]">
          {/* Main Dot */}
          <motion.div
            className="fixed top-0 left-0 w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]"
            animate={{
              x: mousePos.x - 6,
              y: mousePos.y - 6,
              scale: isClicking ? 0.6 : isPointer ? 1.2 : 1,
              opacity: isVisible ? 1 : 0
            }}
            transition={{ type: "spring", damping: 30, stiffness: 1000, mass: 0.1 }}
          />
          {/* Trailing Ring */}
          <motion.div
            className="fixed top-0 left-0 w-10 h-10 border-2 border-purple-500/40 rounded-full"
            animate={{
              x: mousePos.x - 20,
              y: mousePos.y - 20,
              scale: isClicking ? 1.4 : isPointer ? 1.8 : 1,
              opacity: isVisible ? 1 : 0,
              borderWidth: isPointer ? "1px" : "2px"
            }}
            transition={{ type: "spring", damping: 25, stiffness: 250, mass: 0.5 }}
          />
        </div>
      )}

      {/* Ripple Effect (Desktop & Mobile) */}
      <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              initial={{ opacity: 0.8, scale: 0 }}
              animate={{ opacity: 0, scale: isMobile ? 4 : 6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute w-12 h-12 border-4 border-purple-500 rounded-full shadow-[0_0_30px_rgba(168,85,247,0.6)]"
              style={{ left: ripple.x - 24, top: ripple.y - 24 }}
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
          ? "border-2 border-purple-500 text-purple-500" 
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
        className={`absolute inset-0 -z-10 ${variant === "primary" ? "bg-purple-500" : "bg-white"}`}
      />
      <motion.div
        variants={{
          initial: { color: variant === "primary" ? "#a855f7" : "#ffffff" },
          hover: { color: variant === "primary" ? "#ffffff" : "#000000" }
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

const InteractiveStarRating = ({ rating, onChange, theme }: { rating: number; onChange: (rating: number) => void; theme: string }) => {
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
      {[1, 2, 3, 4, 5].map((star) => {
        const isActive = star <= (activeRating ?? rating);
        const isCurrentActive = star === activeRating;
        
        return (
          <motion.div
            key={star}
            animate={{ 
              scale: isCurrentActive ? 1.8 : 1,
              y: isCurrentActive ? -12 : 0,
              color: isActive ? "#eab308" : (theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
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

const ProductDetailPage = ({ products, theme, navigate, db }: { products: any[]; theme: string; navigate: any; db: any }) => {
  const { id } = useParams();
  const product = products.find(p => p.id.toString() === id || p.docId === id);
  const [newReview, setNewReview] = useState({ user: "", rating: 5, comment: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  if (!product) {
    return (
      <div className={`min-h-screen ${theme === "dark" ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} flex items-center justify-center p-6`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <button onClick={() => navigate("/")} className="px-6 py-2 bg-purple-600 rounded-xl text-white">Back to Home</button>
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
    } catch (error) {
      console.error("Error adding review:", error);
      alert("Failed to add review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen ${theme === "dark" ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} p-6 pb-24`}
    >
      <div className="max-w-md mx-auto">
        <button 
          onClick={() => navigate("/")} 
          className={`mb-6 p-3 rounded-xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border flex items-center gap-2 group transition-all hover:bg-purple-500/10 hover:border-purple-500/50`}
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
          <span className="text-sm font-bold">Back</span>
        </button>
        <div className="aspect-[3/4] rounded-3xl overflow-hidden mb-6 border border-white/10 shadow-2xl">
          <MediaImage url={product.url} className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold mb-2 tracking-tight">{product.name}</h1>
        <p className="text-xl font-bold text-purple-500 mb-4">₹{product.price}</p>
        
        {product.description && (
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2">Description</h3>
            <p className="text-sm opacity-80 leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </div>
        )}

        {product.buyUrl && (
          <PremiumButton
            onClick={() => window.open(product.buyUrl, "_blank")}
            className="w-full mb-12"
            icon={ShoppingBag}
          >
            Buy Now
          </PremiumButton>
        )}

        {/* Reviews Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Reviews</h3>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-bold">
                {product.reviews?.length > 0 
                  ? (product.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / product.reviews.length).toFixed(1)
                  : "0.0"}
              </span>
              <span className="text-xs opacity-40">({product.reviews?.length || 0})</span>
            </div>
          </div>

          {/* Add Review Form */}
          <form onSubmit={handleReviewSubmit} className={`p-6 rounded-2xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border space-y-4`}>
            <p className="text-xs font-bold uppercase tracking-widest opacity-40">Write a Review</p>
            <InteractiveStarRating 
              rating={newReview.rating} 
              onChange={(r) => setNewReview({ ...newReview, rating: r })} 
              theme={theme}
            />
            <input 
              type="text"
              placeholder="Your Name"
              value={newReview.user}
              onChange={(e) => setNewReview({ ...newReview, user: e.target.value })}
              className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50`}
            />
            <textarea 
              placeholder="Your Comment"
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              rows={2}
              className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500/50 resize-none`}
            />
            <button 
              type="submit"
              disabled={isSubmittingReview || !newReview.user || !newReview.comment}
              className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-500 transition-all disabled:opacity-50"
            >
              {isSubmittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </form>

          {/* Reviews List */}
          <div className="space-y-4">
            {product.reviews?.length > 0 ? (
              product.reviews.map((review: any) => (
                <div key={review.id} className={`p-4 rounded-2xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold">{review.user}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-white/10"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] opacity-40">{new Date(review.date).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm opacity-70">{review.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-sm opacity-40 italic">No reviews yet. Be the first to review!</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PostDetailPage = ({ posts, products, profile, theme, navigate, isMuted, setIsMuted }: { posts: any[]; products: any[]; profile: any; theme: string; navigate: any; isMuted: boolean; setIsMuted: any }) => {
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
    return (
      <div className={`min-h-screen ${theme === "dark" ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} flex items-center justify-center p-6`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <button onClick={() => navigate("/")} className="px-6 py-2 bg-purple-600 rounded-xl text-white">Back to Home</button>
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
        <div className="flex items-center gap-4 mb-6">
          <MediaImage url={profile.avatar} className="w-12 h-12 rounded-full border-2 border-white/40 object-cover shadow-2xl" />
          <div>
            <h4 className="text-base font-black text-white tracking-tight leading-tight">{profile.name}</h4>
            <p className="text-xs text-white/50 font-bold tracking-wide">renufashionhub.in</p>
          </div>
        </div>

        {post.taggedProducts && post.taggedProducts.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
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
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
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

const ShareModal = ({ isOpen, onClose, profileName }: { isOpen: boolean; onClose: () => void; profileName: string }) => {
  const shareUrl = "https://renufashionhub.in";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    { name: "WhatsApp", icon: MessageSquare, color: "text-green-500", href: `https://wa.me/?text=${encodeURIComponent(`Check out ${profileName} on ${shareUrl}`)}` },
    { name: "Facebook", icon: Facebook, color: "text-blue-600", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { name: "Twitter", icon: Twitter, color: "text-sky-500", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${profileName} on ${shareUrl}`)}` },
    { name: "LinkedIn", icon: Linkedin, color: "text-blue-700", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` },
    { name: "Telegram", icon: Send, color: "text-blue-400", href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out ${profileName}`)}` },
    { name: "Gmail", icon: Mail, color: "text-red-500", href: `mailto:?subject=${encodeURIComponent(profileName)}&body=${encodeURIComponent(`Check out ${profileName} on ${shareUrl}`)}` },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 md:backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5">
              <Share2 className="w-5 h-5 text-white/70" />
            </div>
            <h3 className="text-lg font-bold">Share link</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors">
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Link Section */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 rounded-lg bg-white/5 flex-shrink-0">
                <Globe className="w-4 h-4 text-white/40" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate">{profileName}</p>
                <p className="text-[10px] text-white/40 truncate">{shareUrl}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors relative"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-white/40" />}
              </button>
            </div>
          </div>

          {/* Share Options */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Share using</p>
            <div className="grid grid-cols-3 gap-4">
              {shareOptions.map((option, index) => (
                <a 
                  key={index}
                  href={option.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all group-hover:-translate-y-1`}>
                    <option.icon className={`w-5 h-5 ${option.color}`} />
                  </div>
                  <span className="text-[10px] font-medium text-white/40 group-hover:text-white transition-colors">{option.name}</span>
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
    className={`fixed inset-0 z-[150] flex flex-col items-center justify-center ${theme === "dark" ? "bg-[#0a0a0a]" : "bg-white"}`}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <div className="w-20 h-20 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <ShoppingBag className="w-7 h-7 text-purple-500" />
      </div>
    </motion.div>
    <div className="mt-6 text-center">
      <h1 className="text-sm font-black tracking-[0.2em] uppercase mb-3 opacity-80">Renu Fashion Hub</h1>
      <div className="flex items-center justify-center gap-1.5">
        <div className="w-1 h-1 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1 h-1 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" />
      </div>
    </div>
  </motion.div>
);

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isMobile, setIsMobile] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

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
    // Reverting to randomized delay as requested
    const delay = 400 + Math.random() * 600;
    setTimeout(() => {
      navigate(path);
      setIsNavigating(false);
      window.scrollTo(0, 0);
    }, delay);
  }, [navigate]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState("shop");
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [profile, setProfile] = useState({
    name: "Renu Fashion Hub",
    bio: "Loading...",
    avatar: "",
  });

  const [posts, setPosts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Temporary states for Admin Panel
  const [tempProfile, setTempProfile] = useState(profile);
  const [tempPosts, setTempPosts] = useState(posts);
  const [tempProducts, setTempProducts] = useState(products);
  const [deletedPostIds, setDeletedPostIds] = useState<string[]>([]);
  const [deletedProductIds, setDeletedProductIds] = useState<string[]>([]);

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
        setProfile(data);
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
    }, (err) => console.error("Posts sync error:", err));

    // Real-time Products
    const unsubProducts = onSnapshot(query(collection(db, "products"), orderBy("id", "desc")), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
      setProducts(data);
    }, (err) => console.error("Products sync error:", err));

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
    const delay = 300 + Math.random() * 400;
    setTimeout(() => {
      setActiveTab(tab);
      setIsNavigating(false);
      window.scrollTo(0, 0);
    }, delay);
  }, []);

  // Memoize the combined shop list to prevent recalculation on every render
  const shopItems = useMemo(() => {
    const length = Math.max(posts.length, products.length);
    return Array.from({ length });
  }, [posts.length, products.length]);

  const [contactData, setContactData] = useState({ name: "", email: "", mobile: "", message: "" });
  const [messageSent, setMessageSent] = useState(false);

  // Reset temp states when entering admin
  useEffect(() => {
    if (location.pathname === "/admin") {
      setTempProfile(profile);
      setTempPosts(posts);
      setTempProducts(products);
      setDeletedPostIds([]);
      setDeletedProductIds([]);
    }
  }, [location.pathname, profile, posts, products]); // Added profile, posts, products to dependencies for safety

  const [newPost, setNewPost] = useState({ type: "image", url: "", taggedProducts: [] as number[] });
  const [newProduct, setNewProduct] = useState({ name: "", price: "", url: "", buyUrl: "", description: "" });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "post" | "product" | "message", id: any, docId?: string } | null>(null);

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

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, target: "avatar" | "post" | "product") => {
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
    setNewPost({ type: "image", url: "", taggedProducts: [] });
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

      // Handle Deletions
      for (const id of deletedPostIds) {
        savePromises.push(deleteDoc(doc(db, "posts", id)));
      }
      for (const id of deletedProductIds) {
        savePromises.push(deleteDoc(doc(db, "products", id)));
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

      // Update main state immediately for better UX
      setProfile(tempProfile);
      setPosts(tempPosts);
      setProducts(tempProducts);

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
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center ${theme === "dark" ? "bg-[#0a0a0a]" : "bg-white"}`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="w-24 h-24 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ShoppingBag className="w-8 h-8 text-purple-500" />
                </motion.div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 text-center"
            >
              <h1 className="text-xl font-black tracking-[0.2em] uppercase mb-2">Renu Fashion Hub</h1>
              <div className="flex items-center justify-center gap-2">
                <div className="w-1 h-1 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1 h-1 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1 h-1 rounded-full bg-purple-500 animate-bounce" />
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <div className="min-h-screen">
            <Routes location={location}>
          <Route path="/admin" element={
        <motion.div
          key="admin"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`min-h-screen ${theme === "dark" ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} font-sans transition-colors duration-300`}
        >
          {!isAdminUser ? (
            <div className="flex items-center justify-center min-h-screen p-6">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <X className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className={`${theme === "dark" ? "text-white/40" : "text-black/40"} text-sm mb-8`}>
              You do not have administrator privileges. Please log in with the correct credentials.
            </p>
            <button 
              onClick={() => handleNavigate("/login")}
              className="w-full py-4 rounded-xl bg-purple-600 text-white font-bold transition-all"
            >
              Back to Login
            </button>
          </div>
        </div>
      ) : (
          <div className="pb-32">
        {/* Admin Header */}
        <div className={`sticky top-0 z-50 ${theme === "dark" ? "bg-[#0a0a0a]/90 border-white/10" : "bg-white/90 border-black/10"} md:backdrop-blur-xl border-b px-6 py-4`}>
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Settings className="w-5 h-5 text-purple-500" />
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
                <h3 className={`text-xl font-bold mb-2 text-center ${theme === "dark" ? "text-white" : "text-black"}`}>Delete {itemToDelete.type === 'post' ? 'Post' : itemToDelete.type === 'product' ? 'Product' : 'Message'}?</h3>
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

        <div className="max-w-2xl mx-auto p-6">
          {/* Admin Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: "profile", label: "Profile", icon: User },
              { id: "posts", label: "Posts", icon: ImageIcon },
              { id: "products", label: "Products", icon: Tag },
              { id: "messages", label: "Messages", icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  adminTab === tab.id 
                    ? `${theme === "dark" ? "bg-white text-black border-white" : "bg-black text-white border-black"}` 
                    : `${theme === "dark" ? "bg-white/5 text-white/40 border-white/10 hover:bg-white/10" : "bg-black/5 text-black/40 border-black/10 hover:bg-black/10"}`
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
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
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
                      className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-2`}>Bio</label>
                    <textarea 
                      rows={3}
                      value={tempProfile.bio}
                      onChange={(e) => setTempProfile({...tempProfile, bio: e.target.value})}
                      className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors text-sm resize-none`}
                    />
                  </div>
                </div>
              </section>
            )}

            {adminTab === "posts" && (
              <section className={`p-6 rounded-3xl ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border`}>
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-500" />
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
                      className={`flex-1 py-3 rounded-xl ${theme === "dark" ? "bg-white/5 border-white/20 hover:border-purple-500/50" : "bg-black/5 border-black/20 hover:border-purple-500/50"} border border-dashed transition-all flex items-center justify-center gap-2 text-xs ${theme === "dark" ? "text-white/60" : "text-black/60"}`}
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
                      className={`p-3 rounded-xl border transition-all ${newPost.type === "video" ? "bg-purple-500/20 border-purple-500 text-purple-500" : `${theme === "dark" ? "bg-white/5 border-white/10 text-white/40" : "bg-black/5 border-black/10 text-black/40"}`}`}
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </div>

                  {newPost.type === "video" && (
                    <input 
                      type="text" 
                      placeholder="Paste YT, IG, or FB video link..."
                      value={newPost.url}
                      onChange={(e) => setNewPost({...newPost, url: e.target.value, type: "video"})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors text-sm"
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
                          onClick={() => {
                            const isTagged = newPost.taggedProducts.includes(product.id);
                            if (isTagged) {
                              setNewPost({ ...newPost, taggedProducts: newPost.taggedProducts.filter(id => id !== product.id) });
                            } else {
                              setNewPost({ ...newPost, taggedProducts: [...newPost.taggedProducts, product.id] });
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                            newPost.taggedProducts.includes(product.id) 
                              ? "bg-purple-500/20 border-purple-500 text-purple-500" 
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
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      isAddingPost || !newPost.url ? "bg-purple-600/50 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-500 text-white"
                    }`}
                  >
                    {isAddingPost ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500/50 transition-colors text-sm`}
                  />
                  <textarea 
                    placeholder="Product Description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    rows={2}
                    className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500/50 transition-colors text-sm resize-none`}
                  />
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        placeholder="Price"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                        className={`w-full sm:w-24 ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500/50 transition-colors text-sm`}
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
                          className={`flex-1 min-w-0 ${theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-xl px-4 py-2.5 focus:outline-none focus:border-purple-500/50 transition-colors text-sm`}
                        />
                        <button 
                          onClick={fetchProductDetails}
                          disabled={isFetchingProduct || !newProduct.buyUrl}
                          className={`px-4 py-2.5 rounded-xl ${theme === "dark" ? "bg-purple-500/10 border-purple-500/20" : "bg-purple-500/5 border-purple-500/10"} border text-purple-500 hover:bg-purple-500/20 transition-all disabled:opacity-50 flex items-center justify-center flex-shrink-0`}
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
                      setNewProduct({ name: "", price: "", url: "", buyUrl: "", description: "" });
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

            {adminTab !== "messages" && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-40">
                <button 
                  onClick={() => setShowSaveConfirm(true)}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-2xl shadow-blue-600/40 border border-white/10 active:scale-[0.98]"
                >
                  <Save className="w-5 h-5" />
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
                    <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
                      <Save className="w-10 h-10 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Save Changes?</h3>
                    <p className="text-white/40 text-sm mb-8">This will update your profile, posts, and products across the entire app.</p>
                    
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleSaveAll}
                        disabled={isSaving}
                        className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all flex items-center justify-center gap-2"
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
                        className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all"
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
                  className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-full bg-green-500 text-white font-bold text-sm flex items-center gap-2 shadow-2xl shadow-green-500/40"
                >
                  <CheckCircle2 className="w-4 h-4" />
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
          className={`min-h-screen ${theme === "dark" ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} font-sans flex items-center justify-center p-6 transition-colors duration-300`}
        >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-full max-w-sm p-8 rounded-3xl ${theme === "dark" ? "bg-white/10 border-white/10" : "bg-black/10 border-black/10"} border md:backdrop-blur-xl`}
        >
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-4">
              <Settings className="w-8 h-8 text-purple-500" />
            </div>
            <h1 className="text-2xl font-bold">Admin Login</h1>
            <p className={`${theme === "dark" ? "text-white/40" : "text-black/40"} text-sm mt-1`}>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-2`}>Username</label>
              <input 
                type="text" 
                required
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors`}
                placeholder="Username"
              />
            </div>
            <div>
              <label className={`block text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-2`}>Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-purple-500/50 transition-colors`}
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
            {loginError && <p className="text-red-500 text-xs font-medium text-center">{loginError}</p>}
            <button 
              type="submit"
              className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all mt-4"
            >
              Login
            </button>
            <button 
              type="button"
              onClick={() => handleNavigate("/")}
              className={`w-full py-2 ${theme === "dark" ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"} text-sm transition-colors`}
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
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className={`min-h-screen ${theme === "dark" ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} font-sans p-6 transition-colors duration-300`}
        >
        <div className="max-w-md mx-auto pt-12">
          <button 
            onClick={() => {
              handleNavigate("/");
              setMessageSent(false);
            }}
            className={`flex items-center gap-2 ${theme === "dark" ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"} transition-colors mb-8 group`}
          >
            <div className={`p-2 rounded-full ${theme === "dark" ? "bg-white/5 group-hover:bg-white/10" : "bg-black/5 group-hover:bg-black/10"} transition-colors`}>
              <Play className="w-4 h-4 rotate-180" />
            </div>
            <span className="font-semibold">Back to Profile</span>
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-8 rounded-3xl ${theme === "dark" ? "bg-white/10 border-white/10" : "bg-black/10 border-black/10"} border md:backdrop-blur-xl`}
          >
            <AnimatePresence mode="wait">
              {messageSent ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Message Sent Successfully!</h2>
                  <p className={`${theme === "dark" ? "text-white/40" : "text-black/40"} text-sm mb-8 leading-relaxed`}>
                    Thank You For Messaging Us Our Dedicated Team Will Respond On Your Provided Details Within 24 Hours
                  </p>
                  <button 
                    onClick={() => setMessageSent(false)}
                    className="text-blue-500 text-xs font-bold hover:text-blue-400 transition-colors"
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
                  <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
                  <p className={`${theme === "dark" ? "text-white/40" : "text-black/40"} text-sm mb-8`}>We'd love to hear from you. Send us a message!</p>

                  <form className="space-y-6" onSubmit={handleContactSubmit}>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-2`}>Your Name</label>
                      <input 
                        type="text" 
                        required
                        value={contactData.name}
                        onChange={(e) => setContactData({...contactData, name: e.target.value})}
                        className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors`}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-2`}>Email Address</label>
                        <input 
                          type="email" 
                          required
                          value={contactData.email}
                          onChange={(e) => setContactData({...contactData, email: e.target.value})}
                          className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors`}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-2`}>Mobile Number</label>
                        <input 
                          type="tel" 
                          required
                          value={contactData.mobile}
                          onChange={(e) => setContactData({...contactData, mobile: e.target.value})}
                          className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors`}
                          placeholder="+91 00000 00000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-black/40"} mb-2`}>Message</label>
                      <textarea 
                        rows={4}
                        required
                        value={contactData.message}
                        onChange={(e) => setContactData({...contactData, message: e.target.value})}
                        className={`w-full ${theme === "dark" ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors resize-none`}
                        placeholder="Tell us what's on your mind..."
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isSendingMessage}
                      className={`w-full py-4 rounded-xl ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"} font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                      {isSendingMessage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Message"
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
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
          className={`min-h-screen ${theme === "dark" ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} font-sans selection:bg-purple-500/30 transition-colors duration-300`}
        >
      {/* Background Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] ${theme === "dark" ? "bg-purple-900/20" : "bg-purple-100/40"} blur-[120px] rounded-full`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] ${theme === "dark" ? "bg-blue-900/20" : "bg-blue-100/40"} blur-[120px] rounded-full`} />
      </div>

      <div className="relative max-w-md mx-auto px-6 pt-16 pb-24">
        {/* Header Actions */}
        <div className="absolute top-6 left-6 flex gap-3">
          <button 
            onClick={() => handleNavigate("/login")}
            className={`p-2 rounded-full ${theme === "dark" ? "bg-white/5 hover:bg-white/10 border-white/10" : "bg-black/5 hover:bg-black/10 border-black/10"} transition-colors border group`}
            title="Admin Access"
          >
            <Settings className={`w-5 h-5 ${theme === "dark" ? "text-white/30 group-hover:text-white/70" : "text-black/30 group-hover:text-black/70"} transition-colors`} />
          </button>
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

        <div className="absolute top-6 right-6 flex gap-3">
          <button 
            onClick={() => setShowShareModal(true)}
            className={`p-2 rounded-full ${theme === "dark" ? "bg-white/5 hover:bg-white/10 border-white/10" : "bg-black/5 hover:bg-black/10 border-black/10"} transition-colors border`}
          >
            <Share2 className={`w-5 h-5 ${theme === "dark" ? "text-white/70" : "text-black/70"}`} />
          </button>
        </div>

        {/* Profile Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center mb-10"
        >
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500">
              <MediaImage 
                url={profile.avatar} 
                alt={profile.name} 
                className={`w-full h-full rounded-full object-cover border-4 ${theme === "dark" ? "border-[#0a0a0a]" : "border-white"}`}
                fallback={
                  <div className={`w-full h-full rounded-full ${theme === "dark" ? "bg-[#0a0a0a]" : "bg-white"} flex items-center justify-center`}>
                    <User className={`w-12 h-12 ${theme === "dark" ? "text-white/20" : "text-black/20"}`} />
                  </div>
                }
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
            <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500/10" />
          </div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">Verified Creator</span>
          </div>
          <a 
            href="https://renufashionhub.in" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`${theme === "dark" ? "text-white/40 hover:text-white/60" : "text-black/40 hover:text-black/60"} text-xs mb-4 transition-colors flex items-center gap-1`}
          >
            <Globe className="w-3 h-3" />
            renufashionhub.in
          </a>
          
          <p className={`${theme === "dark" ? "text-white/60" : "text-black/60"} text-sm max-w-[280px] leading-relaxed mb-6 whitespace-pre-line`}>
            {profile.bio}
          </p>
        </motion.div>

        {/* Social Links */}
        <div className="space-y-3 mb-12">
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
                className="absolute inset-0 bg-purple-500/10 -z-10"
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

        {/* Contact Button */}
        <div className="mb-12">
          <PremiumButton
            onClick={() => handleNavigate("/contact")}
            className="w-full"
            variant={theme === "dark" ? "secondary" : "primary"}
          >
            Contact Us
          </PremiumButton>
        </div>

        {/* Tabs Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`flex p-1.5 rounded-2xl ${theme === "dark" ? "bg-white/10 border-white/10" : "bg-black/10 border-black/10"} border md:backdrop-blur-2xl mb-8`}
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
                className={`absolute inset-0 -z-10 ${theme === "dark" ? "bg-purple-500/20" : "bg-purple-500/10"}`}
              />
              <span className="relative z-10">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                />
              )}
            </button>
          ))}
        </motion.div>

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
                className="grid grid-cols-2 gap-3"
              >
                {posts.length === 0 && products.length === 0 ? (
                  <div className="col-span-2">
                    <EmptyState icon={ShoppingBag} message="No any products yet" />
                  </div>
                ) : (
                  shopItems.map((_, index) => (
                    <React.Fragment key={index}>
                      {posts[index] && (
                        <ShopPostCard post={posts[index]} navigate={handleNavigate} isMobile={isMobile} />
                      )}
                      {products[index] && (
                        <ProductCard product={products[index]} navigate={handleNavigate} isMobile={isMobile} />
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
                className="grid grid-cols-2 gap-3"
              >
                {posts.length === 0 ? (
                  <div className="col-span-2">
                    <EmptyState icon={ImageIcon} message="No posts yet" />
                  </div>
                ) : (
                  posts.map((post: any) => (
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
                className="grid grid-cols-2 gap-4"
              >
                {products.length === 0 ? (
                  <div className="col-span-2">
                    <EmptyState icon={Tag} message="No any products yet" />
                  </div>
                ) : (
                  products.map((product: any) => (
                    <ProductCard key={product.id} product={product} navigate={handleNavigate} isMobile={isMobile} />
                  ))
                )}
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
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
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

        {/* Footer */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-white/20 text-[10px] uppercase tracking-[0.2em]">
            &copy; 2026 Renu Fashion Hub. All Rights Reserved.
          </p>
          <p className="text-white/30 text-[9px] mt-2 font-medium tracking-widest">
            Designed by Shiva <a href="https://wa.me/917248763036" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">+91 (72487 63036)</a>
          </p>
        </motion.footer>

        {/* Share Modal */}
        <AnimatePresence>
          {showShareModal && (
            <ShareModal 
              isOpen={showShareModal} 
              onClose={() => setShowShareModal(false)} 
              profileName={profile.name}
            />
          )}
        </AnimatePresence>
      </div>
        </motion.div>
          } />
          <Route path="/product/:id" element={<ProductDetailPage products={products} theme={theme} navigate={handleNavigate} db={db} />} />
          <Route path="/post/:id" element={<PostDetailPage posts={posts} products={products} profile={profile} theme={theme} navigate={handleNavigate} isMuted={isMuted} setIsMuted={setIsMuted} />} />
        </Routes>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
