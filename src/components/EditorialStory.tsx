import React from "react";
import { 
  Instagram, 
  Youtube, 
  Facebook, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  BookOpen,
  ArrowRight
} from "lucide-react";

interface EditorialStoryProps {
  profile: any;
  handleNavigate: (path: string) => void;
}

export const EditorialStory: React.FC<EditorialStoryProps> = ({
  profile,
  handleNavigate
}) => {
  return (
    <section className="py-16 md:py-24 border-t border-stone-200/80 dark:border-stone-800/80 bg-stone-50/50 dark:bg-stone-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Portrait & Curator Credibility */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm">
              {/* Luxury Frame Accent */}
              <div className="absolute -inset-3 bg-gradient-to-tr from-rose-500/15 via-amber-500/10 to-transparent rounded-[2.5rem] blur-xl opacity-80" />
              
              <div className="relative rounded-[2rem] overflow-hidden border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xl">
                <img
                  src={profile?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80"}
                  alt={profile?.name || "Renu Agarwal"}
                  className="w-full aspect-[4/5] object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    if (target.parentElement) {
                      target.parentElement.classList.add("bg-gradient-to-br", "from-rose-950", "via-stone-900", "to-stone-950", "flex", "items-center", "justify-center");
                    }
                  }}
                />
                
                {/* Curator Byline Overlay */}
                <div className="p-4 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200/80 dark:border-stone-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">{profile?.name || "Renu Agarwal"}</h3>
                        <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500/20" />
                      </div>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">Founder & Chief Stylist</p>
                    </div>
                    <a
                      href="https://wa.me/917248763036"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Chat Direct</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Mission, Bio & Channels */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Editorial Spotlight</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-tight">
              Curating True Quality in an Era of Fast Fashion
            </h2>

            <div className="space-y-4 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              <p>
                {profile?.bio || `Every saree, kurta set, and jewellery piece on Renu Fashion Hub is personally vetted for fabric purity, weave durability, authentic drape, and true value for money. We test and review pieces so you can dress with complete confidence.`}
              </p>
              <p>
                Whether you are searching for an heirloom bridal Banarasi drape, a breathable office chikankari suit, or statement kundan choker sets, our honest guides direct you to trusted partner stores with verified links.
              </p>
            </div>

            {/* Social Channels Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <a
                href="https://www.instagram.com/renu_agarwal_vlogs"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-pink-500/40 transition-all flex items-center gap-3 group shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-pink-50 dark:bg-pink-950/30 text-pink-600 flex items-center justify-center shrink-0">
                  <Instagram className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold">Instagram</span>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate block group-hover:text-pink-600">@renu_agarwal_vlogs</span>
                </div>
              </a>

              <a
                href="https://youtube.com/@renuagarwalvlogs"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-red-500/40 transition-all flex items-center gap-3 group shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 flex items-center justify-center shrink-0">
                  <Youtube className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold">YouTube</span>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate block group-hover:text-red-600">@renuagarwalvlogs</span>
                </div>
              </a>

              <a
                href="https://www.facebook.com/share/17YfgJkGda/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-blue-500/40 transition-all flex items-center gap-3 group shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 flex items-center justify-center shrink-0">
                  <Facebook className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block font-bold">Facebook</span>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate block group-hover:text-blue-600">Renu Agarwal</span>
                </div>
              </a>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleNavigate("/about")}
                className="px-5 py-2.5 rounded-full bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <span>Read Full Stylist Story</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              
              <button
                type="button"
                onClick={() => handleNavigate("/contact")}
                className="px-5 py-2.5 rounded-full bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 font-bold text-xs uppercase tracking-wider hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              >
                Request Custom Style Advice
              </button>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
