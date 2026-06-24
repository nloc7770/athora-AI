'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  BookOpen,
  Sparkles,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useChatSessions, useChatMessages } from '@/hooks/use-chat'
import { useCourses } from '@/hooks/use-courses'

type TutorState = 'idle' | 'speaking'

const genericQuestions = [
  'What would you like to learn about today?',
  'Help me understand a concept from my notes',
  'Quiz me on my recent uploads',
]

function getSuggestedQuestions(courseName: string | null): string[] {
  if (!courseName) return genericQuestions
  return [
    `Explain a key concept from ${courseName}`,
    `Quiz me on ${courseName} topics`,
    `Summarize my ${courseName} notes`,
    `What should I focus on for my ${courseName} exam?`,
  ]
}

export default function TutorPage() {
  const [state, setState] = useState<TutorState>('idle')
  const [inputValue, setInputValue] = useState('')
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { courses, isLoading: coursesLoading } = useCourses()
  const { sessions, isLoading: sessionsLoading, createSession } = useChatSessions()
  const { messages, isLoading: messagesLoading, sendMessage, isStreaming } = useChatMessages(sessionId)

  // Set initial active course when courses load
  useEffect(() => {
    if (courses.length > 0 && !activeCourseId) {
      setActiveCourseId(courses[0].id)
    }
  }, [courses, activeCourseId])

  const activeCourse = courses.find((c) => c.id === activeCourseId) ?? null

  // Create or resume a tutor session on mount
  useEffect(() => {
    if (sessionsLoading) return

    const tutorSession = sessions.find((s) => s.type === 'tutor')
    if (tutorSession) {
      setSessionId(tutorSession.id)
    } else {
      createSession({ type: 'tutor' })
        .then((session) => setSessionId(session.id))
        .catch(() => {
          // Session creation failed - user can still see the UI
        })
    }
  }, [sessions, sessionsLoading, createSession])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isStreaming])

  const statusText: Record<TutorState, string> = {
    idle: 'Ready to help',
    speaking: 'Thinking...',
  }


  async function handleSend() {
    const content = inputValue.trim()
    if (!content || !sessionId || isStreaming) return

    setInputValue('')
    setState('speaking')

    try {
      const courseContext = activeCourse?.name ?? undefined
      await sendMessage(content, courseContext)
    } catch {
      // Error is handled in the hook
    } finally {
      setState('idle')
    }
  }

  function handleSuggestionClick(question: string) {
    setInputValue(question)
  }

  const isInitializing = sessionsLoading || (!sessionId && !sessionsLoading)

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-8 md:py-12">
      {/* Course context selector */}
      <div className="mb-8 flex items-center gap-2">
        <Sparkles className="size-4 text-zinc-400" />
        <span className="text-sm text-zinc-500">Context:</span>
        <div className="flex gap-1.5">
          {coursesLoading ? (
            <Loader2 className="size-3.5 animate-spin text-zinc-400" />
          ) : courses.length === 0 ? (
            <span className="text-xs text-zinc-400">No courses yet</span>
          ) : (
            courses.map((course) => (
              <Badge
                key={course.id}
                variant={activeCourseId === course.id ? 'default' : 'outline'}
                className="cursor-pointer transition-colors"
                onClick={() => setActiveCourseId(course.id)}
              >
                {course.code ?? course.name}
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* AI Professor Avatar */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* Radial glow behind avatar */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,_rgba(129,140,248,0.15)_0%,_transparent_70%)] pointer-events-none" />

        {/* Speaking/thinking wave animation */}
        <AnimatePresence>
          {(state === 'speaking' || isStreaming) && (
            <motion.div
              className="absolute inset-0 rounded-full bg-indigo-500/10"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.15, 1.05, 1.2, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>

        {/* Subtle idle ring pulse */}
        {state === 'idle' && !isStreaming && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-indigo-300/30"
            animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.15, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <img
          src="/images/tutor-avatar.png"
          alt="AI Professor"
          className="relative z-10 h-24 w-24 rounded-full object-cover ring-4 ring-indigo-500/20 shadow-xl shadow-indigo-500/10"
        />
      </div>

      {/* Status text */}
      <motion.p
        key={isStreaming ? 'streaming' : state}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-sm font-medium text-zinc-400"
      >
        {isStreaming ? 'Thinking...' : statusText[state]}
      </motion.p>

      {/* Conversation area */}
      <div className="w-full max-w-2xl flex-1">
        {isInitializing ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-zinc-400" />
            <span className="ml-2 text-sm text-zinc-400">Setting up your tutor session...</span>
          </div>
        ) : (
          <>
            {messages.length > 0 && (
              <ScrollArea className="mb-8 max-h-[320px] w-full" ref={scrollRef}>
                <div className="space-y-4 px-2">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card text-card-foreground'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}

                  {/* Streaming indicator */}
                  {isStreaming && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-2.5 text-sm text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>
            )}

            {/* Suggested questions */}
            {messages.length === 0 && !messagesLoading && (
              <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {getSuggestedQuestions(activeCourse?.name ?? null).map((question, index) => (
                  <motion.div
                    key={question}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                  >
                    <Card
                      className="cursor-pointer bg-card border border-border border-l-2 border-l-indigo-400 hover:border-indigo-200 hover:bg-indigo-50/60 p-4 transition-all duration-200"
                      onClick={() => handleSuggestionClick(question)}
                    >
                      <div className="flex items-start gap-3">
                        <BookOpen className="mt-0.5 size-4 shrink-0 text-indigo-400" />
                        <span className="text-sm leading-snug text-zinc-700">
                          {question}
                        </span>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Loading state for messages */}
            {messagesLoading && messages.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-4 animate-spin text-zinc-400" />
                <span className="ml-2 text-sm text-zinc-400">Loading messages...</span>
              </div>
            )}
          </>
        )}

        {/* Text input row */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) handleSend()
            }}
            placeholder="Ask anything..."
            disabled={isInitializing || isStreaming}
            className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isInitializing || isStreaming}
            className="size-10 rounded-xl"
          >
            {isStreaming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>

    </div>
  )
}
