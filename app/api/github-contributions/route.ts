import { NextRequest, NextResponse } from "next/server"
import { createRateLimiter, getClientIp } from "@/lib/utils/rateLimit"
import { isValidGitHubUsername } from "@/lib/utils/validators"

export const dynamic = "force-dynamic"
export const revalidate = 60

const checkRateLimit = createRateLimiter({
  maxRequests: 30,
  windowMs: 60_000,
})

interface ContributionDay {
  date: string
  count: number
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers)
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests", data: null },
      { status: 429 }
    )
  }

  const { searchParams } = new URL(req.url)
  const rawUsername = searchParams.get("username")?.trim()
  const username = rawUsername || "mhdfrhan"

  if (!isValidGitHubUsername(username)) {
    return NextResponse.json(
      { error: "Invalid GitHub username", data: null },
      { status: 400 }
    )
  }

  const token = process.env.GITHUB_TOKEN?.trim()

  try {
    // 1. Jika ada GITHUB_TOKEN, gunakan Official GitHub GraphQL API
    if (token) {
      const query = `
        query($login: String!) {
          user(login: $login) {
            contributionsCollection {
              restrictedContributionsCount
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    contributionCount
                    date
                  }
                }
              }
            }
          }
        }
      `

      const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "portfolio-skyline",
        },
        body: JSON.stringify({ query, variables: { login: username } }),
        next: { revalidate: 60 }, // Cache 60 detik (fresh)
      })

      if (response.ok) {
        const json = await response.json()
        const coll = json?.data?.user?.contributionsCollection
        const calendar = coll?.contributionCalendar
        if (calendar) {
          const days: ContributionDay[] = []
          for (const week of calendar.weeks) {
            for (const d of week.contributionDays) {
              days.push({ date: d.date, count: d.contributionCount })
            }
          }
          const restricted = coll?.restrictedContributionsCount || 0
          return NextResponse.json({
            source: "github-graphql",
            total: calendar.totalContributions,
            restrictedContributions: restricted,
            data: days,
          })
        }
      }
    }

    // 2. Alternatif: Public contributions API tanpa perlu token
    const publicApiRes = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`,
      {
        next: { revalidate: 3600 },
        headers: { "User-Agent": "portfolio-skyline" },
      }
    )

    if (publicApiRes.ok) {
      const publicData = await publicApiRes.json()
      if (Array.isArray(publicData.contributions)) {
        const days: ContributionDay[] = (
          publicData.contributions as Array<{ date: string; count: number }>
        ).map((item) => ({
          date: item.date,
          count: item.count,
        }))
        return NextResponse.json({
          source: "public-api",
          total: publicData.total?.[new Date().getFullYear()] ?? days.reduce((a, b) => a + b.count, 0),
          data: days,
        })
      }
    }

    // 3. Fallback jika network membatasi
    return NextResponse.json(
      { message: "No data available from GitHub, using generated dummy data", data: null },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error("[GitHub Contributions API Error]:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch GitHub contributions", data: null },
      { status: 500 }
    )
  }
}
