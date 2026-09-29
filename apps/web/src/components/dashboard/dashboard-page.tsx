"use client"

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, type Variants } from "framer-motion"
import { Loader2, Upload } from "lucide-react"

import { useCourses } from "@/hooks/use-courses"
import { useDocuments } from "@/hooks/use-documents"
import { useSessions } from "@/hooks/use-sessions"
import { Button } from "@/components/ui/button"
import { BrainHud } from "@/components/brain/brain-hud"

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
  const { courses, isLoading: coursesLoading } = useCourses()
  const { documents, isLoading: documentsLoading, uploadDocument } = useDocuments()
  const { createSession } = useSessions()

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

  if (isFirstTimeUser) {
    return <OnboardingHero onUpload={handleOnboardingUpload} />
  }

  // The dashboard IS the HUD — full-screen, no page chrome. Everything the old
  // AppLayout shell provided for this route (navigation, greeting, account menu,
  // sign-out, notification bell, recent documents) now lives inside BrainHud.
  //
  // No wrapper element here on purpose: BrainHud renders BrainShell, which is
  // already the `.athora-brain` element and already owns the 100dvh. Wrapping it
  // again put TWO `.athora-brain` elements in the DOM, which doubled the theme
  // scope and made any `.athora-brain` locator a strict-mode violation.
  return <BrainHud onUpload={handleOnboardingUpload} />
}
