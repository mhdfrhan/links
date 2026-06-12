"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { PortfolioSection } from "../components/PortfolioSection";
import { usePortfolioData } from "../../lib/hooks/usePortfolioData";
import { ThemeToggle } from "../components/ThemeToggle";

/**
 * PortfolioPage — Halaman semua project
 * Filter by category + subcategory, sort order
 * Semua data dari usePortfolioData — backend tidak diubah sama sekali
 * Styling konsisten dengan design system "Clean Developer Space"
 */
export default function PortfolioPage() {
  const { data, loading } = usePortfolioData();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...data.projects];

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.categoryId === selectedCategory);
    }

    // Filter by subcategory
    if (selectedSubCategory !== "all") {
      result = result.filter((p) => p.subCategoryId === selectedSubCategory);
    }

    // Sort based on admin drag-and-drop order
    result.sort((a, b) => {
      if (sortOrder === "newest") {
        return (a.order || 0) - (b.order || 0);
      } else {
        return (b.order || 0) - (a.order || 0);
      }
    });

    return result;
  }, [data.projects, selectedCategory, selectedSubCategory, sortOrder]);

  // ---- Loading state ----
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
        suppressHydrationWarning
      >
        <div className="flex flex-col items-center gap-3">
          <div
            style={{
              width: "24px",
              height: "24px",
              border: "1px solid var(--border)",
              borderTopColor: "var(--accent)",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              letterSpacing: "0.03em",
            }}
          >
            loading...
          </span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const activeCategory = data.categories.find(
    (c: any) => c.id === selectedCategory,
  );
  const hasSubCategories =
    selectedCategory !== "all" && activeCategory?.subCategories?.length > 0;

  return (
    <div
      style={{ background: "var(--bg-primary)", minHeight: "100vh" }}
      suppressHydrationWarning
    >
      {/* ---- Navbar ---- */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "color-mix(in srgb, var(--bg-primary) 85%, transparent)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 1.5rem",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Back link */}
          <Link
            href="/"
            className="group"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontFamily: "var(--font-sans), sans-serif",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--text-secondary)",
              textDecoration: "none",
              transition: "color 200ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
            }}
          >
            <div className="w-8 h-8 border border-[var(--border)] flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] group-hover:text-white transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </div>
            Back to Home
          </Link>

          {/* Right side: theme toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ---- Main Content ---- */}
      <main
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "4rem 1.5rem 8rem",
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: "4rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-serif), serif",
              fontWeight: 400,
              fontSize: "clamp(3rem, 6vw, 5rem)",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              lineHeight: 1.1,
              marginBottom: "1.5rem",
            }}
          >
            All Projects
          </h1>
          <p
            style={{
              fontSize: "1.125rem",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              maxWidth: "600px",
            }}
          >
            A comprehensive archive of my work, exploring digital experiences across web apps, systems, and creative profiles.
          </p>
        </div>

        {/* ---- Filter + Sort Bar ---- */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            marginBottom: "4rem",
            padding: "1.5rem",
            background: "var(--bg-tertiary)",
            borderRadius: 0,
            border: "1px solid var(--border)",
          }}
        >
          {/* Category filter pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <FilterPill
              active={selectedCategory === "all"}
              onClick={() => {
                setSelectedCategory("all");
                setSelectedSubCategory("all");
              }}
            >
              All Works
            </FilterPill>
            {data.categories.map((cat: any) => (
              <FilterPill
                key={cat.id}
                active={selectedCategory === cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubCategory("all");
                }}
              >
                {cat.name}
              </FilterPill>
            ))}
          </div>

          {/* SubCategory filter */}
          {hasSubCategories && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                paddingTop: "1rem",
                borderTop: "1px dashed var(--border)",
              }}
            >
              <FilterPill
                active={selectedSubCategory === "all"}
                onClick={() => setSelectedSubCategory("all")}
                small
              >
                All {activeCategory?.name}
              </FilterPill>
              {activeCategory?.subCategories?.map((sub: any) => (
                <FilterPill
                  key={sub.id}
                  active={selectedSubCategory === sub.id}
                  onClick={() => setSelectedSubCategory(sub.id)}
                  small
                >
                  {sub.name}
                </FilterPill>
              ))}
            </div>
          )}

          {/* Sort dropdown */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-3rem", pointerEvents: "none" }}>
            <div style={{ pointerEvents: "auto" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: 0,
                  padding: "0.375rem 1rem",
                }}
              >
                <select
                  value={sortOrder}
                  onChange={(e) =>
                    setSortOrder(e.target.value as "newest" | "oldest")
                  }
                  style={{
                    fontFamily: "var(--font-sans), sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                    paddingRight: "1rem",
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-[var(--text-secondary)]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Projects Grid ---- */}
        {filteredAndSortedProjects.length === 0 ? (
          <div
            style={{
              padding: "8rem 0",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontSize: "1.125rem",
                color: "var(--text-muted)",
              }}
            >
              No projects found in this category.
            </p>
          </div>
        ) : (
          <PortfolioSection
            projects={filteredAndSortedProjects}
            showAllButton={false}
            categories={data.categories}
            columns={3}
          />
        )}
      </main>
    </div>
  );
}

/* ---- Filter Pill Component ---- */
function FilterPill({
  active,
  onClick,
  children,
  small = false,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "var(--font-sans), sans-serif",
        fontSize: small ? "0.8125rem" : "0.875rem",
        fontWeight: 500,
        color: active ? "#fff" : "var(--text-secondary)",
        background: active ? "var(--accent)" : "transparent",
        border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 0,
        padding: small ? "0.375rem 1rem" : "0.5rem 1.25rem",
        cursor: "pointer",
        transition: "all 300ms ease",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLElement;
          el.style.color = "var(--text-primary)";
          el.style.borderColor = "var(--text-secondary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLElement;
          el.style.color = "var(--text-secondary)";
          el.style.borderColor = "var(--border)";
        }
      }}
    >
      {children}
    </button>
  );
}
