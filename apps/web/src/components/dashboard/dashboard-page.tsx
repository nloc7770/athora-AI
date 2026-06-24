"use client"

import { useCallback, useRef, useState } from "react"
import { motion, type Variants } from "framer-motion"
import {
  BookOpen,
  Brain,
  Clock,
  FileText,
  Headphones,
  Loader2,
  MessageSquare,
  Notebook,
  Plus,
  PlayCircle,
  Sparkles,
  Upload,
  Video,
  Zap,
} from "lucide-react"

import { useCourses } from "@/hooks/use-courses"
import { useDocuments } from "@/hooks/use-documents"
import { useAuthStore } from "@/stores/auth-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

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
      return <FileText className="size-4 text-zinc-400" />
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

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className ?? ""}`}
    />
  )
}

function CourseSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

function DocumentSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 px-3">
      <Skeleton className="size-8 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

interface CreateCourseFormProps {
  onSubmit: (data: { name: string; code?: string; color?: string; description?: string }) => Promise<void>
  isSubmitting: boolean
}

function CreateCourseForm({ onSubmit, isSubmitting }: CreateCourseFormProps) {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [color, setColor] = useState("#6366f1")
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await onSubmit({
      name: name.trim(),
      code: code.trim() || undefined,
      color,
      description: description.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="course-name" className="text-sm font-medium">
          Course Name *
        </label>
        <Input
          id="course-name"
          placeholder="e.g. Introduction to Computer Science"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label htmlFor="course-code" className="text-sm font-medium">
            Code
          </label>
          <Input
            id="course-code"
            placeholder="e.g. CS101"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="course-color" className="text-sm font-medium">
            Color
          </label>
          <div className="flex items-center gap-2">
            <input
              id="course-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-input"
            />
            <span className="text-xs text-muted-foreground">{color}</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="course-desc" className="text-sm font-medium">
          Description
        </label>
        <Input
          id="course-desc"
          placeholder="Brief description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={!name.trim() || isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Create Course
        </Button>
      </DialogFooter>
    </form>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { courses, isLoading: coursesLoading, createCourse } = useCourses()
  const { documents, isLoading: documentsLoading, uploadDocument } = useDocuments()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4)

  const mostRecentDoc = recentDocuments[0] ?? null
  const mostRecentCourse = mostRecentDoc
    ? courses.find((c) => c.id === mostRecentDoc.courseId)
    : null

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  const handleCreateCourse = useCallback(
    async (data: { name: string; code?: string; color?: string; description?: string }) => {
      setIsCreating(true)
      try {
        await createCourse(data)
        setCreateDialogOpen(false)
      } finally {
        setIsCreating(false)
      }
    },
    [createCourse]
  )

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      await uploadDocument({ file })
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [uploadDocument]
  )

  const documentsCount = documents.length
  const coursesCount = courses.length

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-6xl space-y-6 p-6"
    >
      {/* Welcome Banner */}
      <motion.div variants={item}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/90 to-violet-500/80 p-8 mb-8 shadow-inner shadow-white/10">
          <img
            src="/images/dashboard-banner.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-soft-light"
          />
          <div className="relative">
            <h2 className="text-2xl font-bold text-white">
              Welcome back, {user?.name ?? user?.email ?? "Student"}
            </h2>
            <p className="mt-1 text-indigo-100">
              {coursesCount > 0
                ? `You have ${coursesCount} course${coursesCount > 1 ? "s" : ""} and ${documentsCount} document${documentsCount !== 1 ? "s" : ""}.`
                : "Get started by creating your first course."}
            </p>
            <Button className="mt-4 bg-white text-indigo-600 hover:bg-indigo-50">
              Continue learning
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.mp3,.mp4,.wav"
            onChange={handleFileChange}
          />
          <Button variant="default" size="lg" onClick={handleUploadClick}>
            <Upload className="size-4" data-icon="inline-start" />
            Upload
          </Button>
        </div>
      </motion.div>

      {/* Continue Learning */}
      {mostRecentDoc && (
        <motion.div variants={item}>
          <Card className="border-l-4 border-l-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20">
            <CardHeader>
              <CardDescription>Continue Learning</CardDescription>
              <CardTitle className="text-lg">{mostRecentDoc.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="size-3.5" />
                <span>{mostRecentCourse?.name ?? "No course"}</span>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <Clock className="size-3.5" />
                <span>{formatRelativeDate(mostRecentDoc.updatedAt)}</span>
              </div>
              <Progress value={0} />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {mostRecentDoc.status === "ready" ? "Ready to study" : mostRecentDoc.status}
                </span>
                <Button size="sm">
                  <PlayCircle className="size-3.5" data-icon="inline-start" />
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Courses Grid */}
      <motion.div variants={item}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Your Courses
          </h2>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger
              render={
                <Button variant="outline" size="sm">
                  <Plus className="size-3.5" data-icon="inline-start" />
                  New Course
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Course</DialogTitle>
                <DialogDescription>
                  Organize your study materials by course.
                </DialogDescription>
              </DialogHeader>
              <CreateCourseForm
                onSubmit={handleCreateCourse}
                isSubmitting={isCreating}
              />
            </DialogContent>
          </Dialog>
        </div>

        {coursesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CourseSkeleton key={i} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="size-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No courses yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Create your first course to start organizing materials.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="size-3.5" data-icon="inline-start" />
              Create Course
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((course) => {
              const courseDocCount = documents.filter(
                (d) => d.courseId === course.id
              ).length
              return (
                <motion.div key={course.id} variants={item}>
                  <Card className="group h-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex size-10 items-center justify-center rounded-lg text-white font-bold text-sm"
                          style={{ backgroundColor: course.color ?? "#6366f1" }}
                        >
                          {(course.code ?? course.name).slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: course.color ?? "#6366f1" }}
                            />
                            <CardDescription>
                              {course.code ?? "—"}
                            </CardDescription>
                          </div>
                          <CardTitle className="line-clamp-1">
                            {course.name}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Progress value={0} />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {courseDocCount} document{courseDocCount !== 1 ? "s" : ""}
                        </span>
                        <span>{formatRelativeDate(course.updatedAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Recent Documents + Study Stats row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Documents */}
        <motion.div variants={item} className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Recent Documents
          </h2>
          {documentsLoading ? (
            <Card>
              <CardContent className="divide-y divide-border">
                {Array.from({ length: 4 }).map((_, i) => (
                  <DocumentSkeleton key={i} />
                ))}
              </CardContent>
            </Card>
          ) : recentDocuments.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="size-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No documents yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Upload a PDF, audio, or video to get started.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleUploadClick}
              >
                <Upload className="size-3.5" data-icon="inline-start" />
                Upload Document
              </Button>
            </Card>
          ) : (
            <Card>
              <CardContent className="divide-y divide-border">
                {recentDocuments.map((doc) => {
                  const docCourse = courses.find((c) => c.id === doc.courseId)
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg px-3 -mx-3 transition-colors"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        {getDocumentIcon(doc.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {doc.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeDate(doc.updatedAt)}
                        </p>
                      </div>
                      {docCourse && (
                        <Badge variant="secondary">{docCourse.name}</Badge>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Study Stats */}
        <motion.div variants={item}>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Overview
          </h2>
          <Card className="h-fit border-l-2 border-l-emerald-400">
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10">
                  <BookOpen className="size-4 text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-medium tabular-nums">
                    {coursesCount} course{coursesCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <FileText className="size-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-sm font-medium tabular-nums">
                    {documentsCount} document{documentsCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">Uploaded</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Brain className="size-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium tabular-nums">
                    {documents.filter((d) => d.status === "ready").length} ready
                  </p>
                  <p className="text-xs text-muted-foreground">To study</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Button
            variant="outline"
            size="lg"
            className="h-auto flex-col gap-1.5 py-4"
          >
            <MessageSquare className="size-5 text-indigo-500" />
            <span className="text-xs">Ask AI</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-auto flex-col gap-1.5 py-4"
          >
            <Zap className="size-5 text-amber-500" />
            <span className="text-xs">Review Flashcards</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-auto flex-col gap-1.5 py-4"
          >
            <Sparkles className="size-5 text-violet-500" />
            <span className="text-xs">Start Exam</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-auto flex-col gap-1.5 py-4"
            onClick={handleUploadClick}
          >
            <Upload className="size-5 text-cyan-500" />
            <span className="text-xs">Upload Document</span>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
