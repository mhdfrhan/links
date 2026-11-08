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

  const isId = language === "id"
  const sectionTitle = isId ? "Aktivitas Kontribusi GitHub" : "GitHub Contribution Activity"
  const sectionSub = isId
    ? "Visualisasi aktivitas commit dan kontribusi dalam tampilan 2D heat map dan 3D isometric skyline."
    : "Yearly activity visualization rendered as an interactive 2D heat map and 3D isometric skyline."

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
        }
      } catch (err) {
        // Fallback to dummy data gracefully
        console.warn("[GithubActivitySection] Menggunakan data dummy:", err)
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
      {/* Section label & heading */}
      <div className="flex items-center gap-3 mb-3">
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "0.75rem",
            color: "var(--accent)",
            letterSpacing: "0.04em",
          }}
        >
          ACTIVITY
        </span>
        <h2
          style={{
            fontWeight: 500,
            fontSize: "1.5rem",
            letterSpacing: "-0.015em",
            color: "var(--text-primary)",
            fontStyle: "normal",
          }}
        >
          {sectionTitle}
        </h2>
        <div
          className="flex-1"
          style={{ height: "1px", background: "var(--border)" }}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <p
          className="text-sm text-[var(--text-secondary)]"
          style={{ maxWidth: "680px", lineHeight: 1.6 }}
        >
          {sectionSub}
        </p>

        {/* Source indicator */}
        <span
          className="text-xs font-mono px-2.5 py-1 rounded-md border w-fit flex items-center gap-1.5"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--text-muted)",
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: dataSource === "dummy" ? "var(--text-muted)" : "var(--green)",
            }}
          />
          {dataSource === "dummy"
            ? (isId ? "Preview Data" : "Preview Mode")
            : `@${username}`}
        </span>
      </div>

      {/* Skyline Component */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full overflow-hidden"
      >
        <ContributionSkyline
          data={data}
          palette="github"
          defaultView="3d"
          heightScale={1.1}
          orbit={true}
          unit={isId ? "kontribusi" : "contribution"}
          unitPlural={isId ? "kontribusi" : "contributions"}
          locale={isId ? "id-ID" : "en-US"}
          className="bg-[var(--bg-secondary)] border-[var(--border)]"
        />
      </motion.div>
    </section>
  )
}
