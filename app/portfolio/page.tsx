"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { PortfolioSection } from "../components/PortfolioSection";
import { usePortfolioData } from "../../lib/hooks/usePortfolioData";
import { ThemeToggle } from "../components/ThemeToggle";

export default function PortfolioPage() {
  const { data, loading } = usePortfolioData();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...data.projects];

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter(p => p.categoryId === selectedCategory);
    }

    // Filter by subcategory
    if (selectedSubCategory !== "all") {
      result = result.filter(p => p.subCategoryId === selectedSubCategory);
    }

    // Sort
    result.sort((a, b) => {
      // Assuming 'order' defines the sorting if timestamp is not available.
      // Usually, lower order = older or higher order = newer depending on how it's saved.
      // Since order is just 0, 1, 2, 3... let's sort by order.
      // If we want "newest" first, we reverse the order.
      if (sortOrder === "newest") {
        return (b.order || 0) - (a.order || 0);
      } else {
        return (a.order || 0) - (b.order || 0);
      }
    });

    return result;
  }, [data.projects, selectedCategory, selectedSubCategory, sortOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground py-12 px-4 md:px-8 max-w-6xl mx-auto">
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-50">
        <ThemeToggle />
      </div>
      
      <Link 
        href="/"
        className="inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-accent transition-colors font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Kembali ke Beranda
      </Link>

      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Semua Projek</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Kumpulan hasil karya dan proyek yang pernah saya kerjakan.
        </p>
      </div>

      {/* Filters and Sorting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        
        {/* Category Pills */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedSubCategory("all");
              }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                selectedCategory === "all"
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Semua
            </button>
            {data.categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubCategory("all");
                }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-accent text-accent-foreground shadow-md"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* SubCategory Pills (only if category is selected and has subcategories) */}
          {selectedCategory !== "all" && data.categories.find((c: any) => c.id === selectedCategory)?.subCategories?.length > 0 && (
            <div className="flex flex-wrap gap-2 pl-1 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={() => setSelectedSubCategory("all")}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                  selectedSubCategory === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                }`}
              >
                Semua {data.categories.find((c: any) => c.id === selectedCategory)?.name}
              </button>
              {data.categories.find((c: any) => c.id === selectedCategory)?.subCategories.map((sub: any) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubCategory(sub.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                    selectedSubCategory === sub.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-primary/5 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-1 border border-border/50">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-muted-foreground">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
          </svg>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
            className="bg-transparent border-none text-sm font-medium text-foreground outline-none py-2 cursor-pointer focus:ring-0"
          >
            <option value="newest" className="bg-background text-foreground">Terbaru</option>
            <option value="oldest" className="bg-background text-foreground">Terlama</option>
          </select>
        </div>
      </div>

      {filteredAndSortedProjects.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground text-lg">Belum ada projek di kategori ini.</p>
        </div>
      ) : (
        <PortfolioSection projects={filteredAndSortedProjects} showAllButton={false} categories={data.categories} />
      )}
    </div>
  );
}
