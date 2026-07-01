'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Plus,
  MessageSquare,
  Loader2,
  Trash2,
  Sparkles,
  History,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/ui/markdown'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useChatSessions, useChatMessages } from '@/hooks/use-chat'
import { useCourses } from '@/hooks/use-courses'

export default function TutorPage() {
  const [inputValue, setInputValue] = useState('')
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { courses } = useCourses()
  const { sessions, isLoading: sessionsLoading, createSession, deleteSession } = useChatSessions()
  const { messages, isLoading: messagesLoading, sendMessage, isStreaming, error } = useChatMessages(activeSessionId)

  // Auto-select most recent session
  useEffect(() => {
    if (!sessionsLoading && sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id)
    }
  }, [sessions, sessionsLoading, activeSessionId])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isStreaming])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [inputValue])

  const handleNewChat = useCallback(async () => {
    try {
      const session = await createSession({ type: 'tutor' })
      setActiveSessionId(session.id)
      setSidebarOpen(false)
    } catch {
      // handled by hook
    }
  }, [createSession])

  const handleSend = useCallback(async () => {
    const content = inputValue.trim()
    if (!content || isStreaming) return

    if (!activeSessionId) {
      try {
        const session = await createSession({ type: 'tutor' })
        setActiveSessionId(session.id)
        setInputValue('')
        setTimeout(async () => {
          await sendMessage(content)
        }, 100)
        return
      } catch {
        return
      }
    }

    setInputValue('')
    await sendMessage(content)
  }, [inputValue, activeSessionId, isStreaming, createSession, sendMessage])

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (confirmDeleteId !== sessionId) {
      setConfirmDeleteId(sessionId)
      return
    }
    try {
      setConfirmDeleteId(null)
      await deleteSession(sessionId)
      if (activeSessionId === sessionId) {
        setActiveSessionId(null)
      }
    } catch {
      // silent
    }
  }, [activeSessionId, confirmDeleteId, deleteSession])

  const getSessionTitle = (session: any) => {
    if (session.title && session.title !== 'AI Tutor Session') return session.title
    const date = new Date(session.createdAt)
    return `Chat ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId)

  return (
    <div className="flex h-full flex-col bg-white dark:bg-stone-950">
      {/* Top Bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-stone-200 px-3 dark:border-stone-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewChat}
          className="gap-1.5 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">New chat</span>
        </Button>

        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
          {activeSession ? getSessionTitle(activeSession) : 'AI Tutor'}
        </span>

        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              aria-label="Chat history"
            >
              <History className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col bg-stone-50 p-0 dark:bg-stone-900">
            <SheetHeader className="border-b border-stone-200 px-4 py-3 dark:border-stone-800">
              <SheetTitle className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Chat History
              </SheetTitle>
            </SheetHeader>

            {/* New Chat inside sheet */}
            <div className="px-3 pt-3">
              <Button
                onClick={handleNewChat}
                className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto px-2 py-3">
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="px-3 py-8 text-center text-xs text-stone-400">
                  No conversations yet
                </p>
              ) : (
                <div className="space-y-0.5">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => {
                        setActiveSessionId(session.id)
                        setSidebarOpen(false)
                      }}
                      className={`group flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        activeSessionId === session.id
                          ? 'bg-purple-50 text-purple-900 dark:bg-purple-950/40 dark:text-purple-200'
                          : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                      <span className="flex-1 truncate text-sm">
                        {getSessionTitle(session)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSession(session.id)
                        }}
                        onBlur={() => setConfirmDeleteId(null)}
                        className={`shrink-0 rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 ${
                          confirmDeleteId === session.id
                            ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                            : 'text-stone-400 hover:text-red-500 dark:text-stone-500 dark:hover:text-red-400'
                        }`}
                        aria-label={confirmDeleteId === session.id ? 'Confirm delete' : 'Delete chat'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        {!activeSessionId && !sessionsLoading ? (
          /* Empty state */
          <div className="flex h-full flex-col items-center justify-center px-4">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950/50">
              <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-stone-900 dark:text-stone-100">
              What would you like to study?
            </h2>
            <p className="mb-8 max-w-sm text-center text-sm text-stone-500 dark:text-stone-400">
              I have access to all your uploaded documents. Ask me anything.
            </p>
            <div className="grid w-full max-w-md gap-2">
              {[
                'Explain a key concept from my notes',
                'Quiz me on my recent uploads',
                'Summarize my latest document',
                'Help me prepare for my exam',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInputValue(suggestion)}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-left text-sm text-stone-700 transition-all duration-150 hover:border-purple-300 hover:bg-purple-50/50 hover:text-purple-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-purple-700 dark:hover:bg-purple-950/30 dark:hover:text-purple-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : messagesLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4">
            <p className="text-sm text-stone-400 dark:text-stone-500">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* AI Avatar */}
                  {msg.role === 'assistant' && (
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-2xl rounded-br-sm bg-purple-600 px-4 py-2.5 text-white'
                        : 'rounded-2xl rounded-bl-sm bg-stone-100 px-4 py-2.5 text-stone-800 dark:bg-stone-800 dark:text-stone-200'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="relative">
                        <Markdown content={msg.content} />
                        {isStreaming && msg.id === messages[messages.length - 1]?.id && msg.content && (
                          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-stone-600 align-text-bottom dark:bg-stone-300" />
                        )}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Streaming dots */}
            {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-600">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-stone-100 px-4 py-3 dark:bg-stone-800">
                  <span className="h-2 w-2 rounded-full bg-stone-400 animate-[bounce_1.4s_ease-in-out_infinite]" />
                  <span className="h-2 w-2 rounded-full bg-stone-400 animate-[bounce_1.4s_ease-in-out_0.2s_infinite]" />
                  <span className="h-2 w-2 rounded-full bg-stone-400 animate-[bounce_1.4s_ease-in-out_0.4s_infinite]" />
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="mx-4 mb-2 flex items-center justify-between rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400"
        >
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => sendMessage(messages.filter(m => m.role === 'user').pop()?.content ?? '')}
            className="ml-2 text-red-700 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="shrink-0 border-t border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-950">
        <div className="relative mx-auto max-w-3xl">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask anything..."
            disabled={isStreaming}
            rows={1}
            className="w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-4 pr-12 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all duration-150 focus:border-purple-300 focus:bg-white focus:shadow-sm disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-purple-700 dark:focus:bg-stone-900"
            aria-label="Chat message input"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-30"
            aria-label="Send message"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Send className="h-4 w-4 text-white" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
