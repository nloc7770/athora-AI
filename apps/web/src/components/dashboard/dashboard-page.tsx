"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, type Variants } from "framer-motion"
import {
  BookOpen,
  Brain,
  Clock,
  FileText,
  Flame,
  Headphones,
  Loader2,
  MessageSquare,
  Notebook,
  Sparkles,
  Target,
  Upload,
  Video,
  Zap,
} from "lucide-react"

import { useCourses } from "@/hooks/use-courses"
import { useDocuments } from "@/hooks/use-documents"
import { useSessions } from "@/hooks/use-sessions"
import { useStreak } from "@/hooks/use-streak"
import { useAuthStore } from "@/stores/auth-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
}

function getDocumentIcon(type: string) {
  switch (type) {
    case "pdf":
      return <FileText className="size-4 text-red-500" />
    case "audio":
      return <Headphones className="size-4 text-violet-500" />
    case "video":
      return <Video className="size-4 text-blue-500" />
    case "note":
      return <Notebook className="size-4 text-emerald-500" />
    default:
      return <FileText className="size-4 text-muted-foreground" />
  }
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-stone-200 dark:bg-stone-700 ${className ?? ""}`}
    />
  )
}

function StatSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading stat"
      className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-8" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

function DocumentSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <Skeleton className="size-8 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

function OnboardingHero({
  onUpload,
}: {
  onUpload: (file: File) => Promise<void>
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (!file) return
      setIsUploading(true)
      try {
        await onUpload(file)
      } finally {
        setIsUploading(false)
      }
    },
    [onUpload]
  )

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setIsUploading(true)
      try {
        await onUpload(file)
      } finally {
        setIsUploading(false)
        if (inputRef.current) inputRef.current.value = ""
      }
    },
    [onUpload]
  )

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-6 py-24"
    >
      <motion.div variants={item} className="w-full">
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload your first document"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleClick()
          }}
          className={`relative flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-20 text-center transition-all duration-200 ${
            isDragging
              ? "border-[#6C47FF] bg-purple-50 dark:bg-purple-950/30"
              : "border-stone-300 bg-stone-50/50 hover:border-[#6C47FF]/60 hover:bg-purple-50/50 dark:border-stone-700 dark:bg-stone-900/50 dark:hover:border-[#6C47FF]/60 dark:hover:bg-purple-950/20"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.mp3,.mp4,.wav"
            onChange={handleFileChange}
          />
          {isUploading ? (
            <Loader2 className="size-14 animate-spin text-[#6C47FF]" />
          ) : (
            <div className="rounded-2xl bg-purple-100 dark:bg-purple-900/40 p-4">
              <Upload className="size-10 text-[#6C47FF]" />
            </div>
          )}
          <h1 className="mt-6 text-2xl font-bold text-stone-900 dark:text-stone-100">
            Drop your first document here
          </h1>
          <p className="mt-2 max-w-md text-sm text-stone-500 dark:text-stone-400">
            We'll generate flashcards, quizzes, and study materials automatically
            so you can start learning right away.
          </p>
          <Button
            className="mt-6 bg-[#6C47FF] hover:bg-[#5835DB] text-white"
            size="lg"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {isUploading ? "Uploading..." : "Choose a file"}
          </Button>
          <p className="mt-3 text-xs text-stone-400 dark:text-stone-500">
            PDF, DOCX, TXT, MP3, MP4, WAV supported
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { courses, isLoading: coursesLoading } = useCourses()
  const { documents, isLoading: documentsLoading, uploadDocument } = useDocuments()
  const { createSession } = useSessions()
  const { streak } = useStreak()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const isFirstTimeUser =
    documents.length === 0 &&
    courses.length === 0 &&
    !documentsLoading &&
    !coursesLoading

  const handleOnboardingUpload = useCallback(
    async (file: File) => {
      const fileName = file.name.replace(/\.[^/.]+$/, "")
      const session = await createSession(fileName)
      await uploadDocument(file, { sessionId: session.id })
      router.push(`/sessions/${session.id}`)
    },
    [createSession, uploadDocument, router]
  )

  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Student"

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      await uploadDocument(file)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [uploadDocument]
  )

  const documentsCount = documents.length
  const coursesCount = courses.length
  const readyCount = documents.filter((d) => d.status === "ready").length
  const processingCount = documents.filter((d) => d.status === "processing").length

  // Daily study brief values
  const streakDays = streak

  const totalCards = documents.filter((d) => d.status === "ready").length * 10
  const cardsDueToday = Math.ceil(totalCards * 0.3)

  const lastExamScore = "No exams yet"

  if (isFirstTimeUser) {
    return <OnboardingHero onUpload={handleOnboardingUpload} />
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-4xl space-y-8 px-6 py-8"
    >
      {/* Greeting */}
      <motion.div variants={item}>
        <p className="text-sm text-stone-500 dark:text-stone-400">{today}</p>
        <h1 className="mt-1 text-2xl font-semibold text-stone-900 dark:text-stone-100">
          {getGreeting()}, {displayName}
        </h1>
      </motion.div>

      {/* Today's Plan */}
      <motion.div variants={item}>
        {documentsLoading || coursesLoading ? (
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
            <Skeleton className="h-5 w-28 mb-4" />
            <div className="flex gap-6">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-28" />
            </div>
            <Skeleton className="mt-4 h-10 w-36" />
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5">
            <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-4">
              Today&apos;s Plan
            </h2>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Flame className="size-5 text-orange-500" />
                <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {streakDays}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  day streak
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="size-5 text-[#6C47FF]" />
                <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {cardsDueToday}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  cards due
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="size-5 text-emerald-500" />
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {lastExamScore}
                </span>
              </div>
            </div>
            <Button
              className="mt-4 gap-2 bg-[#6C47FF] hover:bg-[#5835DB] text-white"
              size="default"
              onClick={() =>
                router.push(cardsDueToday > 0 ? "/flashcards" : "/sessions")
              }
            >
              <Zap className="size-4" />
              Start studying
            </Button>
          </div>
        )}
      </motion.div>

      {/* Secondary Stats */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {documentsLoading || coursesLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-stone-400" />
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {documentsCount}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">docs</span>
              </div>
            </div>
            <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-stone-400" />
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {coursesCount}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">courses</span>
              </div>
            </div>
            <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Brain className="size-4 text-emerald-500" />
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {readyCount}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">ready</span>
              </div>
            </div>
            <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-amber-500" />
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {processingCount}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">processing</span>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <h2 className="mb-3 text-sm font-medium text-stone-500 dark:text-stone-400">
          Quick Actions
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
          <button
            onClick={() => router.push("/sessions")}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition-colors duration-150 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300 dark:hover:bg-purple-900"
          >
            <BookOpen className="size-4" />
            Sessions
          </button>
          <button
            onClick={() => router.push("/flashcards")}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition-colors duration-150 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300 dark:hover:bg-purple-900"
          >
            <Brain className="size-4" />
            Flashcards
          </button>
          <button
            onClick={() => router.push("/exam")}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition-colors duration-150 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300 dark:hover:bg-purple-900"
          >
            <Sparkles className="size-4" />
            Exams
          </button>
          <button
            onClick={() => router.push("/tutor")}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition-colors duration-150 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300 dark:hover:bg-purple-900"
          >
            <MessageSquare className="size-4" />
            AI Tutor
          </button>
          <button
            onClick={handleUploadClick}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition-colors duration-150 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300 dark:hover:bg-purple-900"
          >
            <Upload className="size-4" />
            Upload
          </button>
        </div>
      </motion.div>

      {/* Recent Documents */}
      <motion.div variants={item}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400">
            Recent Documents
          </h2>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.mp3,.mp4,.wav"
            onChange={handleFileChange}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/library")}
            className="text-xs text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          >
            View all
          </Button>
        </div>

        {documentsLoading ? (
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
            {Array.from({ length: 4 }).map((_, i) => (
              <DocumentSkeleton key={i} />
            ))}
          </div>
        ) : recentDocuments.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50 p-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800">
              <FileText className="size-6 text-stone-400" />
            </div>
            <p className="mt-4 text-sm font-medium text-stone-700 dark:text-stone-300">
              No documents yet
            </p>
            <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
              Upload a PDF to start studying with AI
            </p>
            <Button
              size="sm"
              className="mt-4 gap-1.5 bg-[#6C47FF] hover:bg-[#5835DB] text-white"
              onClick={handleUploadClick}
            >
              <Upload className="size-3.5" />
              Upload Document
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 divide-y divide-stone-100 dark:divide-stone-800">
            {recentDocuments.map((doc) => (
              <div
                key={doc.id}
                role="button"
                tabIndex={0}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 hover:bg-stone-50 dark:hover:bg-stone-800/50 focus-visible:ring-2 focus-visible:ring-[#6C47FF] focus-visible:outline-none first:rounded-t-xl last:rounded-b-xl"
                onClick={() =>
                  router.push(
                    doc.session_id ? `/sessions/${doc.session_id}` : "/library"
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    router.push(
                      doc.session_id ? `/sessions/${doc.session_id}` : "/library"
                    )
                  }
                }}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800">
                  {getDocumentIcon(doc.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-200">
                    {doc.name}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    {formatRelativeDate(doc.updatedAt)}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={`shrink-0 text-[10px] font-medium ${
                    doc.status === "ready"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : doc.status === "processing"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                        : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                  }`}
                >
                  {doc.status === "ready"
                    ? "Ready"
                    : doc.status === "processing"
                      ? "Processing"
                      : doc.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
