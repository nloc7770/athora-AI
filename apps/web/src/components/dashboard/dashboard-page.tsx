"use client"

import { motion, type Variants } from "framer-motion"
import {
  BookOpen,
  Brain,
  Clock,
  FileText,
  Headphones,
  MessageSquare,
  Notebook,
  PlayCircle,
  Sparkles,
  Upload,
  Video,
  Zap,
} from "lucide-react"

import { courses, documents } from "@/data/mock"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

const courseThumbnails: Record<string, string> = {
  cs101: "/images/course-cs.png",
  math201: "/images/course-math.png",
  bio150: "/images/course-bio.png",
  phil100: "/images/course-phil.png",
}

export default function DashboardPage() {
  const recentDoc = documents[0]
  const recentCourse = courses.find((c) => c.id === recentDoc.courseId)
  const recentDocuments = documents.filter((d) => d.lastStudied).slice(0, 4)

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

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
          <img src="/images/dashboard-banner.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-soft-light" />
          <div className="relative">
            <h2 className="text-2xl font-bold text-white">Welcome back, Alex</h2>
            <p className="mt-1 text-indigo-100">You've studied 12 hours this week. Keep it up!</p>
            <Button className="mt-4 bg-white text-indigo-600 hover:bg-indigo-50">Continue learning</Button>
          </div>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div
        variants={item}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        <Button variant="default" size="lg">
          <Upload className="size-4" data-icon="inline-start" />
          Upload
        </Button>
      </motion.div>

      {/* Continue Learning */}
      <motion.div variants={item}>
        <Card className="border-l-4 border-l-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20">
          <CardHeader>
            <CardDescription>Continue Learning</CardDescription>
            <CardTitle className="text-lg">{recentDoc.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="size-3.5" />
              <span>{recentCourse?.name}</span>
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
              <Clock className="size-3.5" />
              <span>{recentDoc.lastStudied}</span>
            </div>
            <Progress value={recentCourse?.progress ?? 0} />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {recentCourse?.progress}% complete
              </span>
              <Button size="sm">
                <PlayCircle className="size-3.5" data-icon="inline-start" />
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Courses Grid */}
      <motion.div variants={item}>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Your Courses
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((course) => (
            <motion.div key={course.id} variants={item}>
              <Card className="group h-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {courseThumbnails[course.id] && (
                      <div className="overflow-hidden rounded-lg ring-1 ring-zinc-200">
                        <img
                          src={courseThumbnails[course.id]}
                          alt={course.name}
                          className="h-10 w-10 object-cover opacity-80"
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <div
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: course.color }}
                        />
                        <CardDescription>{course.code}</CardDescription>
                      </div>
                      <CardTitle className="line-clamp-1">{course.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={course.progress} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{course.documentsCount} documents</span>
                    <span>{course.lastStudied}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Documents + Study Stats row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Documents */}
        <motion.div variants={item} className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Recent Documents
          </h2>
          <Card>
            <CardContent className="divide-y divide-border">
              {recentDocuments.map((doc) => (
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
                      {doc.lastStudied}
                    </p>
                  </div>
                  <Badge variant="secondary">{doc.courseName}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Study Stats */}
        <motion.div variants={item}>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            This Week
          </h2>
          <Card className="h-fit border-l-2 border-l-emerald-400">
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10">
                  <Clock className="size-4 text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-medium tabular-nums">12 hours</p>
                  <p className="text-xs text-muted-foreground">Study time</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <Brain className="size-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-sm font-medium tabular-nums">45 cards</p>
                  <p className="text-xs text-muted-foreground">Reviewed</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <FileText className="size-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium tabular-nums">3 documents</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
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
          >
            <Upload className="size-5 text-cyan-500" />
            <span className="text-xs">Upload Document</span>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
