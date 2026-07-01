"use client"

import { useEffect, useState } from "react"
import { hasCompletedFirstStudy } from "@/hooks/use-first-study"
import {
  BarChart3,
  Brain,
  Clock,
  Flame,
  GraduationCap,
  Lock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { apiClient } from "@/lib/api"

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
                className="w-full max-w-[32px] rounded-md bg-purple-500/80 dark:bg-purple-400/70 group-hover:bg-purple-600 dark:group-hover:bg-purple-300 transition-colors duration-150"
                style={{ height: `${height}%` }}
              />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded px-1.5 py-0.5 shadow-sm pointer-events-none whitespace-nowrap">
                {day.count} activities
              </div>
            </div>
            <span className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500">
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
      <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-10">
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
            stroke="currentColor"
            className="text-stone-100 dark:text-stone-800"
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
            className="fill-purple-600 dark:fill-purple-400"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6C47FF" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
        {data.length > 1 && (
          <>
            <span className="text-[10px] text-stone-400 dark:text-stone-500">
              {new Date(data[0].date).toLocaleDateString("en", { month: "short", day: "numeric" })}
            </span>
            <span className="text-[10px] text-stone-400 dark:text-stone-500">
              {new Date(data[data.length - 1].date).toLocaleDateString("en", { month: "short", day: "numeric" })}
            </span>
          </>
        )}
      </div>
      <div className="absolute top-0 left-0 flex flex-col justify-between h-full py-1 -translate-x-full pr-2">
        <span className="text-[10px] text-stone-400 dark:text-stone-500">100%</span>
        <span className="text-[10px] text-stone-400 dark:text-stone-500">50%</span>
        <span className="text-[10px] text-stone-400 dark:text-stone-500">0%</span>
      </div>
    </div>
  )
}

function DonutChart({ mastered, learning, newCards }: { mastered: number; learning: number; newCards: number }) {
  const total = mastered + learning + newCards
  if (total === 0) {
    return (
      <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-10">
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
            stroke="currentColor"
            className="text-stone-100 dark:text-stone-800"
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
              stroke="#8b5cf6"
              strokeWidth="12"
              strokeDasharray={`${newPct * circumference} ${circumference}`}
              strokeDashoffset={-newOffset}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-stone-900 dark:text-stone-100">{total}</span>
          <span className="text-[10px] text-stone-500 dark:text-stone-400">total</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <div>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">Mastered</p>
            <p className="text-xs text-stone-400 dark:text-stone-500">{mastered} cards</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <div>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">Learning</p>
            <p className="text-xs text-stone-400 dark:text-stone-500">{learning} cards</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <div>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">New</p>
            <p className="text-xs text-stone-400 dark:text-stone-500">{newCards} cards</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProGateOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm rounded-xl">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/40 mb-3">
        <Lock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
      </div>
      <p className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Pro Feature</p>
      <p className="text-xs text-stone-500 dark:text-stone-400 text-center max-w-[200px] mb-3">
        Unlock detailed analytics and insights
      </p>
      <Link href="/settings">
        <Button
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-5 text-xs"
        >
          Upgrade to Pro
        </Button>
      </Link>
    </div>
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400" />
      </div>
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
      <div className="text-center py-20 px-6">
        <p className="text-stone-500 dark:text-stone-400">Failed to load analytics. Try again later.</p>
      </div>
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Analytics</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Your study progress at a glance
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
          {([
            { key: "week", label: "This Week" },
            { key: "month", label: "This Month" },
            { key: "all", label: "All Time" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTimeRange(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 ${
                timeRange === key
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          value={formatMinutes(totalStudyMinutes)}
          label="Study time"
        />
        <StatCard
          icon={<Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          iconBg="bg-purple-50 dark:bg-purple-900/30"
          value={String(flashcardsReviewed)}
          label="Cards reviewed"
        />
        <StatCard
          icon={<GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />}
          iconBg="bg-green-50 dark:bg-green-900/30"
          value={`${averageExamScore}%`}
          label="Avg exam score"
        />
        <StatCard
          icon={<Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
          iconBg="bg-orange-50 dark:bg-orange-900/30"
          value={String(data.streak)}
          label="Day streak"
        />
      </div>

      {/* Activity Chart */}
      <Card className="border-stone-200 dark:border-stone-800 rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
            <BarChart3 className="h-4 w-4 text-purple-500" />
            Daily Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {activityData.length === 0 ? (
            <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-10">
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
        <Card className="border-stone-200 dark:border-stone-800 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Exam Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-10 pr-4 pb-6">
            <ExamScoreChart data={filteredExamTrend.slice(-10)} />
          </CardContent>
        </Card>

        {/* Flashcard Mastery */}
        <Card className="border-stone-200 dark:border-stone-800 rounded-xl relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
              <Brain className="h-4 w-4 text-purple-500" />
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
    </div>
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
    <Card className="border-stone-200 dark:border-stone-800 rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
            {icon}
          </div>
          {trend != null && <TrendBadge value={trend} suffix={trendSuffix} />}
        </div>
        <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
          {value}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  )
}

function NoDataYetPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Analytics</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
          Your study progress at a glance
        </p>
      </div>

      <div className="flex flex-col items-center justify-center text-center py-20 px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/40 mb-4">
          <BarChart3 className="h-7 w-7 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-1">
          No study data yet
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center max-w-xs mb-4">
          Complete your first flashcard review or exam to start tracking your progress here.
        </p>
        <Link href="/flashcards">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6">
            Start Studying
          </Button>
        </Link>
      </div>
    </div>
  )
}

function ProRequiredPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Analytics</h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
          Your study progress at a glance
        </p>
      </div>

      {/* Blurred Stats Preview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 blur-sm pointer-events-none select-none">
        <StatCard
          icon={<Clock className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50"
          value="4h 32m"
          label="Study time"
        />
        <StatCard
          icon={<Brain className="h-5 w-5 text-purple-600" />}
          iconBg="bg-purple-50"
          value="248"
          label="Cards reviewed"
        />
        <StatCard
          icon={<GraduationCap className="h-5 w-5 text-green-600" />}
          iconBg="bg-green-50"
          value="85%"
          label="Avg exam score"
        />
        <StatCard
          icon={<Flame className="h-5 w-5 text-orange-600" />}
          iconBg="bg-orange-50"
          value="14"
          label="Day streak"
        />
      </div>

      {/* CTA Overlay */}
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">
          <Card className="border-stone-200 rounded-xl">
            <CardContent className="p-6 h-48 bg-stone-50" />
          </Card>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/40 mb-4">
            <Lock className="h-7 w-7 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-1">
            Unlock Analytics
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 text-center max-w-xs mb-4">
            Get detailed study insights, streak tracking, exam score trends, and weekly activity breakdowns.
          </p>
          <Link href="/settings">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6">
              Upgrade to Pro
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
