"use client"

import * as React from "react"
import { motion } from "framer-motion"
import ContributionSkyline, { ContributionDay } from "@/components/ui/contribution-skyline"
import { useLanguage } from "@/lib/contexts/LanguageContext"

interface GithubActivitySectionProps {
  initialData?: ContributionDay[]
  username?: string
}

export function GithubActivitySection({
  initialData,
  username = "mhdfrhan",
}: GithubActivitySectionProps) {
  const { language } = useLanguage()
  const [data, setData] = React.useState<ContributionDay[] | undefined>(initialData)
  const [isLoading, setIsLoading] = React.useState(!initialData)
  const [dataSource, setDataSource] = React.useState<string>("dummy")
  const [totalCount, setTotalCount] = React.useState<number>(0)
  const [paletteMode, setPaletteMode] = React.useState<"github" | "ember">("github")

  const isId = language === "id"
  const sectionTitle = isId ? "Aktivitas GitHub" : "GitHub Activity"
  const sectionSub = isId
    ? "Visualisasi kontribusi dan commit interaktif dalam format 2D heat map dan 3D isometric skyline."
    : "Interactive contribution visualizer rendered as a 2D heat map and 3D isometric skyline."

  // Fetch real GitHub data asynchronously
  React.useEffect(() => {
    let active = true

    async function fetchContributions() {
      try {
        const res = await fetch(`/api/github-contributions?username=${username}`)
        if (!res.ok) return
        const result = await res.json()
        if (active && result?.data && Array.isArray(result.data) && result.data.length > 0) {
          setData(result.data)
          setDataSource(result.source || "real")
          if (typeof result.total === "number") {
            setTotalCount(result.total)
          } else {
            const sum = result.data.reduce((acc: number, d: ContributionDay) => acc + (d.count || 0), 0)
            setTotalCount(sum)
          }
        }
      } catch (err) {
        console.warn("[GithubActivitySection] Menggunakan data fallback:", err)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    fetchContributions()

    return () => {
      active = false
    }
  }, [username])

  return (
    <section id="activity" className="w-full">
      {/* Editorial Section Header — Selaras 100% dengan Proyek, Keahlian & Pengalaman */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14 gap-6">
        <div>
          <span
            style={{
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              fontSize: "0.875rem",
              color: "var(--accent)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              fontWeight: 600,
              display: "block",
              marginBottom: "0.5rem",
            }}
          >
            02b.
          </span>
          <h2
            style={{
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              lineHeight: 1.1,
              marginBottom: "0.75rem",
            }}
          >
            {sectionTitle}
          </h2>

          <div
            className="inline-flex items-center gap-2.5 px-3 py-1.5"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="w-1.5 h-1.5 inline-block"
              style={{
                background: dataSource === "dummy" ? "var(--text-muted)" : "var(--accent)",
              }}
            />
            <span
              className="text-[11px] font-semibold uppercase tracking-wider tabular-nums"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-plus-jakarta), sans-serif",
              }}
            >
              {totalCount > 0
                ? `${totalCount.toLocaleString()} ${isId ? "Kontribusi Terbaca" : "Contributions"}`
                : isId ? "Memuat Aktivitas..." : "Loading Activity..."}{" "}
              • @{username}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-3">
          <p
            className="text-sm text-[var(--text-secondary)] max-w-md leading-relaxed sm:text-right"
            style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
          >
            {sectionSub}
          </p>

          {/* Palette selector pills */}
          <div
            className="inline-flex items-center gap-1 p-1"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            <button
              type="button"
              onClick={() => setPaletteMode("github")}
              className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200"
              style={{
                background: paletteMode === "github" ? "var(--bg-tertiary)" : "transparent",
                color: paletteMode === "github" ? "var(--text-primary)" : "var(--text-muted)",
                fontFamily: "var(--font-plus-jakarta), sans-serif",
              }}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5 bg-[#26a641]" />
              GitHub
            </button>
            <button
              type="button"
              onClick={() => setPaletteMode("ember")}
              className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200"
              style={{
                background: paletteMode === "ember" ? "var(--bg-tertiary)" : "transparent",
                color: paletteMode === "ember" ? "var(--text-primary)" : "var(--text-muted)",
                fontFamily: "var(--font-plus-jakarta), sans-serif",
              }}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5 bg-[#ed5d31]" />
              Orange
            </button>
          </div>
        </div>
      </div>

      {/* Architectural Bento Showcase Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="group relative overflow-hidden transition-colors duration-300"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Top Animated Accent Sweep on hover */}
        <div
          className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ease-out"
          style={{ background: "var(--accent)" }}
        />

        {/* Subtle Background Watermark */}
        <span
          aria-hidden="true"
          className="pointer-events-none select-none absolute -bottom-6 right-4 font-sans font-bold leading-none opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500"
          style={{
            fontSize: "clamp(5rem, 12vw, 9rem)",
            color: "var(--text-primary)",
          }}
        >
          SKYLINE
        </span>

        {/* Skyline Interactive Component */}
        <div className="relative z-10 p-4 sm:p-7">
          <ContributionSkyline
            data={data}
            palette={paletteMode}
            defaultView="3d"
            heightScale={1.15}
            orbit={true}
            unit={isId ? "kontribusi" : "contribution"}
            unitPlural={isId ? "kontribusi" : "contributions"}
            locale={isId ? "id-ID" : "en-US"}
            className="!border-0 !p-0 !bg-transparent shadow-none"
          />
        </div>
      </motion.div>
    </section>
  )
}
