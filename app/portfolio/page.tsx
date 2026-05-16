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
            className="rounded-full"
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
    (c: any) => c.id === selectedCategory
  );
  const hasSubCategories =
    selectedCategory !== "all" &&
    activeCategory?.subCategories?.length > 0;

  return (
    <div
      style={{ background: "var(--bg-primary)", minHeight: "100vh" }}
      suppressHydrationWarning
    >
      {/* Grain overlay tipis */}
      <div className="grain-overlay" aria-hidden="true" />

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
            maxWidth: "1080px",
            margin: "0 auto",
            padding: "0 1.5rem",
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Back link */}
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              textDecoration: "none",
              transition: "color 150ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color =
                "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              style={{ width: "14px", height: "14px" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            ~/mhdfarhan
          </Link>

          {/* Right side: page label + theme toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                letterSpacing: "0.02em",
              }}
            >
              /portfolio
            </span>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ---- Main Content ---- */}
      <main
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          padding: "3rem 1.5rem 6rem",
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: "3rem" }}>
          <p
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              letterSpacing: "0.04em",
              marginBottom: "0.5rem",
            }}
          >
            ~/projects
          </p>
          <h1
            style={{
              fontWeight: 500,
              fontSize: "2.25rem",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              fontStyle: "normal",
              marginBottom: "0.75rem",
            }}
          >
            Semua Projek
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              fontStyle: "normal",
              maxWidth: "520px",
            }}
          >
            Kumpulan hasil karya dan proyek yang pernah saya kerjakan, mulai dari
            web app, sistem informasi, hingga company profile.
          </p>
        </div>

        {/* ---- Filter + Sort Bar ---- */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            marginBottom: "2.5rem",
          }}
        >
          {/* Category filter pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <FilterPill
              active={selectedCategory === "all"}
              onClick={() => {
                setSelectedCategory("all");
                setSelectedSubCategory("all");
              }}
            >
              semua
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
                {cat.name.toLowerCase()}
              </FilterPill>
            ))}
          </div>

          {/* SubCategory filter (muncul jika kategori dipilih & punya subcategories) */}
          {hasSubCategories && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.375rem",
                paddingLeft: "0.25rem",
              }}
            >
              <FilterPill
                active={selectedSubCategory === "all"}
                onClick={() => setSelectedSubCategory("all")}
                small
              >
                semua {activeCategory?.name?.toLowerCase()}
              </FilterPill>
              {activeCategory?.subCategories?.map((sub: any) => (
                <FilterPill
                  key={sub.id}
                  active={selectedSubCategory === sub.id}
                  onClick={() => setSelectedSubCategory(sub.id)}
                  small
                >
                  {sub.name.toLowerCase()}
                </FilterPill>
              ))}
            </div>
          )}

          {/* Sort dropdown — kanan */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "0.25rem 0.625rem",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                style={{
                  width: "13px",
                  height: "13px",
                  color: "var(--text-muted)",
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                />
              </svg>
              <select
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(e.target.value as "newest" | "oldest")
                }
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                  padding: "0.25rem 0",
                }}
              >
                <option
                  value="newest"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                  }}
                >
                  terbaru
                </option>
                <option
                  value="oldest"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                  }}
                >
                  terlama
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* ---- Project count label ---- */}
        <p
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            letterSpacing: "0.02em",
            marginBottom: "1.25rem",
          }}
        >
          {filteredAndSortedProjects.length} project
          {filteredAndSortedProjects.length !== 1 ? "s" : ""} ditemukan
        </p>

        {/* ---- Projects Grid ---- */}
        {filteredAndSortedProjects.length === 0 ? (
          <div
            style={{
              padding: "5rem 0",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
              }}
            >
              belum ada projek di kategori ini.
            </p>
          </div>
        ) : (
          <PortfolioSection
            projects={filteredAndSortedProjects}
            showAllButton={false}
            categories={data.categories}
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
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: small ? "0.6875rem" : "0.75rem",
        fontWeight: 400,
        fontStyle: "normal",
        color: active ? "var(--accent)" : "var(--text-muted)",
        background: active ? "var(--bg-secondary)" : "transparent",
        border: `1px solid ${active ? "var(--border-hover)" : "var(--border)"}`,
        borderRadius: "6px",
        padding: small ? "0.2rem 0.5rem" : "0.3rem 0.625rem",
        cursor: "pointer",
        transition: "color 150ms ease, border-color 150ms ease, background 150ms ease",
        letterSpacing: "0.02em",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLElement;
          el.style.color = "var(--text-secondary)";
          el.style.borderColor = "var(--border-hover)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLElement;
          el.style.color = "var(--text-muted)";
          el.style.borderColor = "var(--border)";
        }
      }}
    >
      {children}
    </button>
  );
}
