import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Clock, Calendar } from "lucide-react";

interface BlogSpotlightProps {
  blogs: any[];
  handleNavigate: (path: string) => void;
}

export const BlogSpotlight: React.FC<BlogSpotlightProps> = ({ blogs, handleNavigate }) => {
  const displayBlogs = blogs && blogs.length > 0 ? blogs.slice(0, 3) : [
    {
      id: 1782443263146,
      title: "Top 10 Saree Draping Styles for Festive Season 2026",
      excerpt: "Master the art of contemporary and traditional saree draping — from the regal royal pleated style to effortless modern dhoti silhouettes.",
      category: "Saree Styling",
      author: "Renu Agarwal",
      date: "Oct 2026",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: 1782443263147,
      title: "How to Style Kurtis for Office and Casual Festive Wear",
      excerpt: "A comprehensive guide on styling versatile cotton, silk, and georgette kurtis for office meetings, brunch outings, and festive pujas.",
      category: "Kurti Guides",
      author: "Renu Agarwal",
      date: "Oct 2026",
      readTime: "4 min read",
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: 1782443263148,
      title: "Complete Guide to Choosing the Perfect Bridal Lehenga",
      excerpt: "From color palettes that complement Indian skin tones to understanding zardozi embroidery weight, here is what brides must know.",
      category: "Bridal Couture",
      author: "Renu Agarwal",
      date: "Sep 2026",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=80"
    }
  ];

  return (
    <section className="py-16 md:py-24 border-t border-stone-200/80 dark:border-stone-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-rose-600 dark:text-rose-400 mb-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Fashion Editorial</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
              Style Guides & Lookbooks
            </h2>
          </div>
          
          <Link
            to="/blog"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate("/blog");
            }}
            className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 group"
          >
            <span>View All Guides</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 3-Column Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {displayBlogs.map((blog) => {
            const cleanId = blog.id;
            const imageUrl = blog.image || blog.url || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=80";
            
            return (
              <article
                key={cleanId}
                className="group flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-[#12100E] border border-stone-200/80 dark:border-stone-800/80 hover:border-rose-400/50 dark:hover:border-rose-500/40 shadow-xs hover:shadow-xl transition-all duration-300"
              >
                {/* Article Cover Image */}
                <Link
                  to={`/blog/${cleanId}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate(`/blog/${cleanId}`);
                  }}
                  className="aspect-[16/10] overflow-hidden bg-stone-100 dark:bg-stone-800 block"
                >
                  <img
                    src={imageUrl}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                      if (target.parentElement) {
                        target.parentElement.classList.add("bg-gradient-to-br", "from-rose-950", "via-stone-900", "to-stone-950");
                      }
                    }}
                  />
                </Link>

                {/* Article Content */}
                <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between gap-4">
                  <div>
                    {/* Unboxed Metadata (Zero-Pill Rule) */}
                    <div className="flex items-center gap-2 text-[10px] text-stone-500 dark:text-stone-400 mb-2 font-medium">
                      <span className="text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
                        {blog.category || "Style Advice"}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{blog.readTime || "4 min read"}</span>
                      </span>
                    </div>

                    {/* Article Title */}
                    <Link
                      to={`/blog/${cleanId}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigate(`/blog/${cleanId}`);
                      }}
                      className="text-inherit no-underline block"
                    >
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-50 leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                    </Link>

                    {/* Excerpt */}
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                      {blog.excerpt || blog.content?.replace(/<[^>]+>/g, "").slice(0, 120)}...
                    </p>
                  </div>

                  {/* Read Link */}
                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80">
                    <Link
                      to={`/blog/${cleanId}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigate(`/blog/${cleanId}`);
                      }}
                      className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 flex items-center gap-1"
                    >
                      <span>Read Full Guide</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>

              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
};
