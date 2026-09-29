"use client"

import { useEffect, useState } from "react"
import { hasCompletedFirstStudy } from "@/hooks/use-first-study"
import {
  BarChart3,
  Brain,
  Clock,
  Flame,
  GraduationCap,
  Loader2,
  Lock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { apiClient } from "@/lib/api"
import {
  PageContainer,
  PageHeader,
  EmptyState,
  SegmentedControl,
} from "@/components/page"

const SUBTITLE = "Your study progress at a glance"

const RANGE_OPTIONS = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
]

type TimeRange = "week" | "month" | "all"

interface AnalyticsSummary {
  streak: number
  totalStudyMinutes: number
  flashcardsReviewed: number
  averageExamScore: number
  documentsUploaded: number
  weeklyActivity: { date: string; count: number }[]
  examTrend: { date: string; score: number; exam_name: string }[]
  flashcardMastery?: { mastered: number; learning: number; new: number }
}

function getDateCutoff(range: TimeRange): Date | null {
  if (range === "all") return null
  const now = new Date()
  const days = range === "week" ? 7 : 30
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)
  cutoff.setHours(0, 0, 0, 0)
  return cutoff
}

function filterByDateRange<T extends { date: string }>(
  items: T[],
  range: TimeRange
): T[] {
  const cutoff = getDateCutoff(range)
  if (!cutoff) return items
  return items.filter((item) => new Date(item.date) >= cutoff)
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`
}

function TrendBadge({ value, suffix = "%" }: { value: number; suffix?: string }) {
  if (value === 0) return null
  const isPositive = value > 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isPositive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
      }`}
    >
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {Math.abs(value)}{suffix}
    </span>
  )
}

function ActivityChart({ data }: { data: { date: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="flex items-end gap-[3px] sm:gap-1.5 h-36 sm:h-44 pt-4">
      {data.map((day) => {
        const height = Math.max((day.count / maxCount) * 100, 3)
        const dayLabel = new Date(day.date).toLocaleDateString("en", { weekday: "short" })
        return (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 group">
            <div className="relative w-full flex items-end justify-center h-full">
              <div
                className="w-full max-w-[32px] rounded-md bg-primary/70 transition-colors duration-150 group-hover:bg-primary"
                style={{ height: `${height}%` }}
              />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-[var(--br-text)] bg-[var(--br-bg3)] border border-[var(--br-border)] rounded px-1.5 py-0.5 shadow-sm pointer-events-none whitespace-nowrap">
                {day.count} activities
              </div>
            </div>
            <span className="text-[10px] sm:text-xs text-[var(--br-text3)]">
              {dayLabel.charAt(0)}
              <span className="hidden sm:inline">{dayLabel.slice(1, 3)}</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

function ExamScoreChart({ data }: { data: { date: string; score: number; exam_name: string }[] }) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[var(--br-text3)]">
        Take some practice exams to see your improvement over time.
      </p>
    )
  }

  const maxScore = 100
  const points = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * 100,
    y: 100 - (d.score / maxScore) * 100,
    ...d,
  }))

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ")

  return (
    <div className="relative h-40 sm:h-48">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="var(--br-border)"
            strokeWidth="0.5"
          />
        ))}
        <path
          d={pathD}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.5"
            className="fill-primary"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--br-accent-ink)" />
            <stop offset="100%" stopColor="var(--br-accent)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
        {data.length > 1 && (
          <>
            <span className="text-[10px] text-[var(--br-text3)]">
              {new Date(data[0].date).toLocaleDateString("en", { month: "short", day: "numeric" })}
            </span>
            <span className="text-[10px] text-[var(--br-text3)]">
              {new Date(data[data.length - 1].date).toLocaleDateString("en", { month: "short", day: "numeric" })}
            </span>
          </>
        )}
      </div>
      <div className="absolute top-0 left-0 flex flex-col justify-between h-full py-1 -translate-x-full pr-2">
        <span className="text-[10px] text-[var(--br-text3)]">100%</span>
        <span className="text-[10px] text-[var(--br-text3)]">50%</span>
        <span className="text-[10px] text-[var(--br-text3)]">0%</span>
      </div>
    </div>
  )
}

function DonutChart({ mastered, learning, newCards }: { mastered: number; learning: number; newCards: number }) {
  const total = mastered + learning + newCards
  if (total === 0) {
    return (
      <p className="py-10 text-center text-sm text-[var(--br-text3)]">
        Review some flashcards to see your mastery breakdown.
      </p>
    )
  }

  const radius = 40
  const circumference = 2 * Math.PI * radius
  const masteredPct = mastered / total
  const learningPct = learning / total
  const newPct = newCards / total

  const masteredOffset = 0
  const learningOffset = masteredPct * circumference
  const newOffset = (masteredPct + learningPct) * circumference

  return (
    <div className="flex items-center justify-center gap-8">
      <div className="relative w-32 h-32 sm:w-36 sm:h-36">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--br-border)"
            strokeWidth="12"
          />
          {masteredPct > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth="12"
              strokeDasharray={`${masteredPct * circumference} ${circumference}`}
              strokeDashoffset={-masteredOffset}
              strokeLinecap="round"
            />
          )}
          {learningPct > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="12"
              strokeDasharray={`${learningPct * circumference} ${circumference}`}
              strokeDashoffset={-learningOffset}
              strokeLinecap="round"
            />
          )}
          {newPct > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="var(--br-accent)"
              strokeWidth="12"
              strokeDasharray={`${newPct * circumference} ${circumference}`}
              strokeDashoffset={-newOffset}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-[var(--br-text)]">{total}</span>
          <span className="text-[10px] text-[var(--br-text3)]">total</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {[
          { dot: "bg-green-500", label: "Mastered", count: mastered },
          { dot: "bg-amber-500", label: "Learning", count: learning },
          { dot: "bg-primary", label: "New", count: newCards },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            <div aria-hidden className={`size-3 rounded-full ${row.dot}`} />
            <div>
              <p className="text-sm font-medium text-[var(--br-text2)]">{row.label}</p>
              <p className="text-xs text-[var(--br-text3)]">{row.count} cards</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Header is identical on every branch of this page, so it lives in one place. */
function AnalyticsHeader({ actions }: { actions?: React.ReactNode }) {
  return (
    <PageHeader
      title="Analytics"
      subtitle={SUBTITLE}
      icon={<BarChart3 />}
      actions={actions}
    />
  )
}

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>("week")

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await apiClient.get<AnalyticsSummary>('/analytics/summary')
        setData(res)
      } catch (err: unknown) {
        const apiErr = err as { response?: { status?: number } }
        if (apiErr?.response?.status === 403) {
          setError('pro_required')
        } else {
          setError('failed')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <PageContainer>
        <AnalyticsHeader />
        <div role="status" className="flex items-center justify-center py-20">
          <Loader2 aria-hidden className="size-6 animate-spin text-primary" />
          <span className="sr-only">Loading your analytics…</span>
        </div>
      </PageContainer>
    )
  }

  if (error === 'pro_required') {
    if (!hasCompletedFirstStudy()) {
      return <NoDataYetPage />
    }
    return <ProRequiredPage />
  }

  if (error || !data) {
    return (
      <PageContainer>
        <AnalyticsHeader />
        <p role="alert" className="py-20 text-center text-sm text-[var(--br-text3)]">
          Failed to load analytics. Try again later.
        </p>
      </PageContainer>
    )
  }

  const activityData = filterByDateRange(data.weeklyActivity, timeRange)
  const filteredExamTrend = filterByDateRange(data.examTrend, timeRange)
  const mastery = data.flashcardMastery ?? { mastered: 0, learning: 0, new: 0 }

  // Recompute stats based on time range
  const totalStudyMinutes = timeRange === "all"
    ? data.totalStudyMinutes
    : activityData.reduce((sum, d) => sum + d.count, 0)
  const flashcardsReviewed = timeRange === "all"
    ? data.flashcardsReviewed
    : activityData.reduce((sum, d) => sum + d.count, 0)
  const averageExamScore = filteredExamTrend.length > 0
    ? Math.round(
        filteredExamTrend.reduce((sum, d) => sum + d.score, 0) /
          filteredExamTrend.length
      )
    : data.averageExamScore

  return (
    <PageContainer>
      <AnalyticsHeader
        actions={
          <SegmentedControl
            value={timeRange}
            onValueChange={(v) => setTimeRange(v as TimeRange)}
            label="Time range"
            options={RANGE_OPTIONS}
          />
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<Clock className="size-5 text-blue-400" />}
          iconBg="bg-blue-500/15"
          value={formatMinutes(totalStudyMinutes)}
          label="Study time"
        />
        <StatCard
          icon={<Brain className="size-5 text-primary" />}
          iconBg="bg-[var(--br-accent-wash)]"
          value={String(flashcardsReviewed)}
          label="Cards reviewed"
        />
        <StatCard
          icon={<GraduationCap className="size-5 text-green-400" />}
          iconBg="bg-green-500/15"
          value={`${averageExamScore}%`}
          label="Avg exam score"
        />
        <StatCard
          icon={<Flame className="size-5 text-orange-400" />}
          iconBg="bg-orange-500/15"
          value={String(data.streak)}
          label="Day streak"
        />
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="size-4 text-primary" />
            Daily Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {activityData.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--br-text3)]">
              No activity yet. Start studying to see your progress!
            </p>
          ) : (
            <ActivityChart data={activityData} />
          )}
        </CardContent>
      </Card>

      {/* Two-column charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Exam Scores */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="size-4 text-green-400" />
              Exam Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-10 pr-4 pb-6">
            <ExamScoreChart data={filteredExamTrend.slice(-10)} />
          </CardContent>
        </Card>

        {/* Flashcard Mastery */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Brain className="size-4 text-primary" />
              Flashcard Mastery
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <DonutChart
              mastered={mastery.mastered}
              learning={mastery.learning}
              newCards={mastery.new}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

function StatCard({
  icon,
  iconBg,
  value,
  label,
  trend,
  trendSuffix = "%",
}: {
  icon: React.JSX.Element
  iconBg: string
  value: string
  label: string
  trend?: number
  trendSuffix?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`flex size-9 items-center justify-center rounded-lg ${iconBg}`}>
            {icon}
          </div>
          {trend != null && <TrendBadge value={trend} suffix={trendSuffix} />}
        </div>
        <p className="text-2xl font-bold tracking-tight text-[var(--br-text)]">
          {value}
        </p>
        <p className="mt-0.5 text-xs text-[var(--br-text3)]">{label}</p>
      </CardContent>
    </Card>
  )
}

function NoDataYetPage() {
  return (
    <PageContainer>
      <AnalyticsHeader />
      {/* illustration="sessions": this is has-no-data-yet, not a failed query, so
          not "search"; and what is missing is study ACTIVITY (a flashcard review,
          an exam attempt) rather than uploaded files, so "sessions" fits better
          than "documents". */}
      <EmptyState
        illustration="sessions"
        title="No study data yet"
        description="Complete your first flashcard review or exam to start tracking your progress here."
        action={
          <Button render={<Link href="/flashcards" />}>Start studying</Button>
        }
      />
    </PageContainer>
  )
}

function ProRequiredPage() {
  return (
    <PageContainer>
      <AnalyticsHeader />

      {/* Blurred Stats Preview */}
      <div
        aria-hidden
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 blur-sm pointer-events-none select-none"
      >
        <StatCard
          icon={<Clock className="size-5 text-blue-400" />}
          iconBg="bg-blue-500/15"
          value="4h 32m"
          label="Study time"
        />
        <StatCard
          icon={<Brain className="size-5 text-primary" />}
          iconBg="bg-[var(--br-accent-wash)]"
          value="248"
          label="Cards reviewed"
        />
        <StatCard
          icon={<GraduationCap className="size-5 text-green-400" />}
          iconBg="bg-green-500/15"
          value="85%"
          label="Avg exam score"
        />
        <StatCard
          icon={<Flame className="size-5 text-orange-400" />}
          iconBg="bg-orange-500/15"
          value="14"
          label="Day streak"
        />
      </div>

      {/* CTA Overlay */}
      <div className="relative">
        <div aria-hidden className="blur-sm pointer-events-none select-none">
          <Card>
            <CardContent className="h-48 p-6" />
          </Card>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-[var(--br-accent-line)] bg-[var(--br-accent-wash)]">
            <Lock className="size-7 text-primary" />
          </div>
          <h2 className="mb-1 text-lg font-semibold text-[var(--br-text)]">
            Unlock Analytics
          </h2>
          <p className="mb-4 max-w-xs text-sm text-[var(--br-text3)]">
            Get detailed study insights, streak tracking, exam score trends, and weekly activity breakdowns.
          </p>
          <Button render={<Link href="/settings" />}>Upgrade to Pro</Button>
        </div>
      </div>
    </PageContainer>
  )
}
