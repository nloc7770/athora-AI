'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
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

type TutorState = 'idle' | 'listening' | 'speaking'

const courseOptions = [
  { id: 'cs101', label: 'CS 101' },
  { id: 'math201', label: 'MATH 201' },
  { id: 'bio150', label: 'BIO 150' },
]

const suggestedQuestions = [
  'Explain the concept of recursion with a simple example',
  'What are the key differences between stacks and queues?',
  'Help me understand Big O notation',
  'How does memory allocation work in programming?',
]

export default function TutorPage() {
  const [state, setState] = useState<TutorState>('idle')
  const [inputValue, setInputValue] = useState('')
  const [activeCourse, setActiveCourse] = useState(courseOptions[0])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { sessions, isLoading: sessionsLoading, createSession } = useChatSessions()
  const { messages, isLoading: messagesLoading, sendMessage, isStreaming } = useChatMessages(sessionId)

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
    listening: 'Listening...',
    speaking: 'Thinking...',
  }

  function toggleVoice() {
    setState((prev) => (prev === 'listening' ? 'idle' : 'listening'))
  }

  async function handleSend() {
    const content = inputValue.trim()
    if (!content || !sessionId || isStreaming) return

    setInputValue('')
    setState('speaking')

    try {
      await sendMessage(content)
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
          {courseOptions.map((course) => (
            <Badge
              key={course.id}
              variant={activeCourse.id === course.id ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() => setActiveCourse(course)}
            >
              {course.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* AI Professor Avatar */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* Radial glow behind avatar */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,_rgba(129,140,248,0.15)_0%,_transparent_70%)] pointer-events-none" />
        {/* Pulsing rings when listening */}
        <AnimatePresence>
          {state === 'listening' && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-indigo-400/40"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-indigo-400/30"
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeOut',
                  delay: 0.4,
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-indigo-400/20"
                initial={{ scale: 1, opacity: 0.3 }}
                animate={{ scale: 2.4, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeOut',
                  delay: 0.8,
                }}
              />
            </>
          )}
        </AnimatePresence>

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
                            ? 'bg-indigo-600 text-white'
                            : 'bg-zinc-800 text-zinc-200'
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
                      <div className="flex items-center gap-2 rounded-2xl bg-zinc-800 px-4 py-2.5 text-sm text-zinc-400">
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
                {suggestedQuestions.map((question, index) => (
                  <motion.div
                    key={question}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                  >
                    <Card
                      className="cursor-pointer bg-white border border-zinc-200 border-l-2 border-l-indigo-400 hover:border-indigo-200 hover:bg-indigo-50/60 p-4 transition-all duration-200"
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
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Voice interaction button */}
      <div className="mt-8">
        <motion.button
          onClick={toggleVoice}
          whileTap={{ scale: 0.92 }}
          disabled={isInitializing}
          className={`relative flex size-16 items-center justify-center rounded-full shadow-lg shadow-indigo-500/20 transition-colors ${
            state === 'listening'
              ? 'bg-red-500 text-white shadow-red-500/20'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={state === 'listening' ? 'Stop listening' : 'Start voice input'}
        >
          {state === 'listening' && (
            <motion.span
              className="absolute inset-0 rounded-full bg-red-400/30"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          {state === 'idle' && !isInitializing && (
            <motion.span
              className="absolute inset-0 rounded-full bg-indigo-400/20"
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          {state === 'listening' ? (
            <MicOff className="relative z-10 size-6" />
          ) : (
            <Mic className="relative z-10 size-6" />
          )}
        </motion.button>
      </div>
    </div>
  )
}
