'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Send,
  BookOpen,
  Sparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { suggestedQuestions } from '@/data/mock'

type TutorState = 'idle' | 'listening' | 'speaking'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const courseOptions = [
  { id: 'cs101', label: 'CS 101' },
  { id: 'math201', label: 'MATH 201' },
  { id: 'bio150', label: 'BIO 150' },
]

const displayedSuggestions = suggestedQuestions.slice(0, 4)

export default function TutorPage() {
  const [state, setState] = useState<TutorState>('idle')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [activeCourse, setActiveCourse] = useState(courseOptions[0])

  const statusText: Record<TutorState, string> = {
    idle: 'Ready to help',
    listening: 'Listening...',
    speaking: 'Speaking...',
  }

  function toggleVoice() {
    setState((prev) => (prev === 'listening' ? 'idle' : 'listening'))
  }

  function handleSend() {
    if (!inputValue.trim()) return
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue.trim(),
    }
    const aiMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content:
        "That's a great question! Let me think about this in the context of your course material...",
    }
    setMessages((prev) => [...prev, userMsg, aiMsg])
    setInputValue('')
    setState('speaking')
    setTimeout(() => setState('idle'), 2000)
  }

  function handleSuggestionClick(question: string) {
    setInputValue(question)
  }

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

        {/* Speaking wave animation */}
        <AnimatePresence>
          {state === 'speaking' && (
            <motion.div
              className="absolute inset-0 rounded-full bg-indigo-500/10"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.15, 1.05, 1.2, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </AnimatePresence>

        {/* Subtle idle ring pulse */}
        {state === 'idle' && (
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
        key={state}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-sm font-medium text-zinc-400"
      >
        {statusText[state]}
      </motion.p>

      {/* Conversation area */}
      <div className="w-full max-w-2xl flex-1">
        {messages.length > 0 && (
          <ScrollArea className="mb-8 max-h-[320px] w-full">
            <div className="space-y-4 px-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
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
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Suggested questions */}
        {messages.length === 0 && (
          <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {displayedSuggestions.map((question, index) => (
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

        {/* Text input row */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend()
            }}
            placeholder="Ask anything..."
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-indigo-300"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="size-10 rounded-xl"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>

      {/* Voice interaction button */}
      <div className="mt-8">
        <motion.button
          onClick={toggleVoice}
          whileTap={{ scale: 0.92 }}
          className={`relative flex size-16 items-center justify-center rounded-full shadow-lg shadow-indigo-500/20 transition-colors ${
            state === 'listening'
              ? 'bg-red-500 text-white shadow-red-500/20'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}
          aria-label={state === 'listening' ? 'Stop listening' : 'Start voice input'}
        >
          {state === 'listening' && (
            <motion.span
              className="absolute inset-0 rounded-full bg-red-400/30"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          {state === 'idle' && (
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
