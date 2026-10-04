import React, { useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';

const themeListeners = new Set<() => void>();

export function getDocumentTheme(): "dark" | "light" {
  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  }
  return "light";
}

function subscribeTheme(callback: () => void) {
  themeListeners.add(callback);
  return () => {
    themeListeners.delete(callback);
  };
}

/**
 * Isolated theme subscription hook for components that genuinely need to react
 * to theme changes in JS (e.g. AnimatedThemeToggle).
 * The root App component does NOT subscribe to this, preventing full tree re-renders.
 */
export function useTheme(): "dark" | "light" {
  return useSyncExternalStore(subscribeTheme, getDocumentTheme, () => "light");
}

/**
 * Instantaneous theme toggle function.
 * 1. Synchronously updates <html> class and data-theme attribute.
 * 2. Notifies isolated subscribers (AnimatedThemeToggle only).
 * 3. Persists to localStorage asynchronously via requestIdleCallback.
 * Zero blocking I/O, zero layout thrashing, zero root App re-renders.
 */
export function toggleDocumentTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "light";
  const current = getDocumentTheme();
  const next = current === "dark" ? "light" : "dark";
  const isDark = next === "dark";

  // Fast minimal DOM update: set/remove .dark and .light classes without wiping unrelated classes
  if (isDark) {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }
  document.documentElement.setAttribute("data-theme", next);

  // Notify only isolated subscribers (e.g. AnimatedThemeToggle)
  themeListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error("Theme listener error:", e);
    }
  });

  // Asynchronously persist to localStorage so disk I/O never blocks the click event or animation frame
  if (typeof window !== "undefined") {
    const persist = () => {
      try {
        localStorage.setItem("rfh_theme", next);
      } catch (e) {}
    };
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(persist);
    } else {
      setTimeout(persist, 0);
    }
  }

  return next;
}

/**
 * Simple, ultra-fast, smooth luxury theme toggle.
 * Uses pure CSS transitions and SVG icon swap without spring physics,
 * Framer Motion layout measurements, or celestial animations.
 */
export const SimpleThemeToggle = React.memo(() => {
  const theme = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleDocumentTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className="group relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-stone-200/80 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 text-stone-700 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-900/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer shadow-xs active:scale-95"
    >
      <span className="sr-only">Toggle theme</span>
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-200 group-hover:rotate-45 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-200 group-hover:-rotate-12 text-stone-700" />
      )}
    </button>
  );
});
