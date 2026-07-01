"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, type Variants } from "framer-motion"
import { BookOpen, Brain, FileText, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

const ONBOARDING_FLAG = "athora_onboarding_complete"

interface PostUploadSuccessProps {
  flashcardCount: number
  quizCount: number
  hasSummary?: boolean
  onDismiss?: () => void
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

const particleFade: Variants = {
  hidden: { opacity: 0, scale: 0 },
  show: {
    opacity: [0, 1, 1, 0],
    scale: [0.5, 1, 1.2, 0.8],
    transition: { duration: 2.4, ease: "easeOut" },
  },
}

function ConfettiParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 3,
        delay: Math.random() * 1.2,
        color:
          i % 4 === 0
            ? "bg-purple-400"
            : i % 4 === 1
              ? "bg-indigo-400"
              : i % 4 === 2
                ? "bg-pink-400"
                : "bg-amber-400",
      })),
    []
  )

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          variants={particleFade}
          initial="hidden"
          animate="show"
          transition={{ delay: p.delay }}
          className={`absolute rounded-full ${p.color} opacity-60`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  )
}

export function usePostUploadOnboarding() {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const completed = localStorage.getItem(ONBOARDING_FLAG)
    setShouldShow(!completed)
  }, [])

  const markComplete = useCallback(() => {
    localStorage.setItem(ONBOARDING_FLAG, "true")
    setShouldShow(false)
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem(ONBOARDING_FLAG)
    setShouldShow(true)
  }, [])

  return { shouldShow, markComplete, reset }
}

export function PostUploadSuccess({
  flashcardCount,
  quizCount,
  hasSummary = true,
  onDismiss,
}: PostUploadSuccessProps) {
  const router = useRouter()
  const { markComplete } = usePostUploadOnboarding()

  const handleStartStudying = useCallback(() => {
    markComplete()
    onDismiss?.()
    router.push("/flashcards")
  }, [markComplete, onDismiss, router])

  const handleBrowseLibrary = useCallback(() => {
    markComplete()
    onDismiss?.()
    router.push("/library")
  }, [markComplete, onDismiss, router])

  const stats = useMemo(() => {
    const parts: string[] = []
    if (flashcardCount > 0) {
      parts.push(`${flashcardCount} flashcard${flashcardCount !== 1 ? "s" : ""}`)
    }
    if (quizCount > 0) {
      parts.push(`${quizCount} quiz question${quizCount !== 1 ? "s" : ""}`)
    }
    if (hasSummary) {
      parts.push("Study summary")
    }
    return parts.join(" • ")
  }, [flashcardCount, quizCount, hasSummary])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-[#6C47FF] via-[#7C5CFF] to-[#9B7DFF] p-[1px] shadow-2xl"
      >
        <ConfettiParticles />

        <div className="relative rounded-[15px] bg-white dark:bg-stone-950 px-6 py-10 sm:px-8 sm:py-12">
          {/* Icon cluster */}
          <motion.div
            variants={item}
            className="mx-auto flex items-center justify-center gap-2"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40">
              <Brain className="size-5 text-[#6C47FF]" />
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
              <FileText className="size-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-pink-100 dark:bg-pink-900/40">
              <Sparkles className="size-5 text-pink-600 dark:text-pink-400" />
            </div>
          </motion.div>

          {/* Header */}
          <motion.h2
            variants={item}
            className="mt-6 text-center text-xl font-bold text-stone-900 dark:text-stone-100 sm:text-2xl"
          >
            Your study materials are ready!
          </motion.h2>

          {/* Stats pill */}
          <motion.p
            variants={item}
            className="mx-auto mt-3 w-fit rounded-full bg-purple-50 dark:bg-purple-950/40 px-4 py-1.5 text-center text-sm font-medium text-purple-700 dark:text-purple-300"
          >
            {stats}
          </motion.p>

          {/* Description */}
          <motion.p
            variants={item}
            className="mt-4 text-center text-sm text-stone-500 dark:text-stone-400"
          >
            We analyzed your document and created personalized study materials.
            Jump in and start learning.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={item} className="mt-8 flex flex-col gap-3">
            <Button
              onClick={handleStartStudying}
              className="w-full gap-2 bg-[#6C47FF] text-white hover:bg-[#5835DB] focus-visible:ring-[#6C47FF]"
              size="lg"
            >
              <BookOpen className="size-4" />
              Start studying
            </Button>
            <Button
              onClick={handleBrowseLibrary}
              variant="ghost"
              className="w-full text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              size="lg"
            >
              Browse library
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default PostUploadSuccess
