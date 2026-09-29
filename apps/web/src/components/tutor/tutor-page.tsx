'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Plus,
  Loader2,
  Trash2,
  History,
  MessageSquare,
  FileText,
  Quote,
  X,
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  PageContainer,
  PageHeader,
  EmptyState,
  ListItem,
  ListSkeleton,
} from '@/components/page'
import { useChatSessions, useChatMessages } from '@/hooks/use-chat'
import type { ChunkSource } from '@/hooks/use-chat'
import { useDocuments } from '@/hooks/use-documents'
import { BrainShell } from '@/components/brain/brain-shell'

/**
 * READING MEASURE. PageContainer is full-bleed, but a chat transcript is prose —
 * at 1440px a message line would run ~1300px, which is unreadable. So the page
 * shell is full-bleed and only the transcript and the composer are capped at
 * `max-w-3xl` and centred, which is the exception the refactor brief allows.
 */
const MEASURE = 'mx-auto w-full max-w-3xl'

const SUGGESTIONS = [
  'Explain a key concept from my notes',
  'Quiz me on my recent uploads',
  'Summarize my latest document',
  'Help me prepare for my exam',
] as const

/** The subset of a chat session this view reads. Structurally satisfied by the hook's type. */
interface ChatSessionLike {
  id: string
  title?: string
  createdAt: string
}

// Filler words that would light up half an excerpt without saying anything.
const STOPWORDS = new Set([
  'the', 'and', 'for', 'what', 'how', 'why', 'with', 'this', 'that', 'are', 'from', 'about', 'explain',
  'của', 'các', 'những', 'một', 'này', 'không', 'trong', 'với', 'như', 'thế', 'nào', 'cho', 'được', 'hãy',
])

/** The question's meaningful words, longest first so a longer term wins the regex alternation. */
export function queryTerms(question: string): string[] {
  const words = question.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  return [...new Set(words.filter((w) => w.length >= 3 && !STOPWORDS.has(w)))].sort(
    (a, b) => b.length - a.length,
  )
}

/** Split text around the terms; odd indexes are the matches. */
export function splitHighlights(text: string, terms: string[]): string[] {
  if (terms.length === 0) return [text]
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return text.split(new RegExp(`(${escaped.join('|')})`, 'giu'))
}

function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  // Bring the first hit into view — a long chunk can bury it below the fold.
  const firstMark = useCallback((el: HTMLElement | null) => {
    el?.scrollIntoView?.({ block: 'center' })
  }, [])
  return (
    <>
      {splitHighlights(text, terms).map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            ref={i === 1 ? firstMark : undefined}
            className="rounded-sm bg-primary/30 px-0.5 text-inherit"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  )
}

function getSessionTitle(session: ChatSessionLike) {
  if (session.title && session.title !== 'AI Tutor Session') return session.title
  const date = new Date(session.createdAt)
  return `Chat ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

export default function TutorPage() {
  const [inputValue, setInputValue] = useState('')
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<ChatSessionLike | null>(null)
  /**
   * The source excerpt open in the reader dialog, plus the question it answered
   * so the terms the student asked about can be highlighted inside it.
   */
  const [openSource, setOpenSource] = useState<{ src: ChunkSource; n: number; question: string } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // The brain's ASK YOUR BRAIN column hands over the vault selection as
  // `?docs=id,id` and the typed question as `?q=`. Ids only — names are
  // resolved here so a renamed document can never arrive stale.
  const searchParams = useSearchParams()
  const { documents } = useDocuments()
  const [contextIds, setContextIds] = useState<string[] | null>(null)

  const urlDocIds = searchParams.get('docs')
  const urlQuestion = searchParams.get('q')
  const urlSessionId = searchParams.get('session')

  // The URL seeds this once; after that the chips are user-owned, so removing
  // one must not be undone by a re-render reading the same URL.
  useEffect(() => {
    setContextIds(urlDocIds ? urlDocIds.split(',').filter(Boolean) : [])
  }, [urlDocIds])

  // The brain's ASK column creates the chat session against the picked
  // documents and hands its id over here, so the conversation opens already
  // scoped instead of landing on whatever was last used. A ref rather than a
  // state guard: the auto-select below runs in this same commit and would
  // otherwise win the race and overwrite the choice with the newest session.
  const urlClaimedSession = useRef(false)
  useEffect(() => {
    if (!urlSessionId) return
    urlClaimedSession.current = true
    setActiveSessionId(urlSessionId)
  }, [urlSessionId])

  useEffect(() => {
    if (urlQuestion) setInputValue(urlQuestion)
  }, [urlQuestion])

  const contextDocs = useMemo(() => {
    if (!contextIds || contextIds.length === 0) return []
    const byId = new Map(documents.map((d) => [d.id, d]))
    return contextIds.map((id) => ({ id, name: byId.get(id)?.name ?? null }))
  }, [contextIds, documents])

  // Sent as `courseContext`, the only context field the chat API accepts. Names
  // not yet resolved are dropped rather than sent as ids the tutor cannot read.
  const courseContext = useMemo(() => {
    const names = contextDocs.map((d) => d.name).filter((n): n is string => Boolean(n))
    if (names.length === 0) return undefined
    return `The student is asking about these documents: ${names
      .map((n) => `"${n}"`)
      .join(', ')}. Focus your answer on them.`
  }, [contextDocs])

  const { sessions, isLoading: sessionsLoading, createSession, deleteSession } = useChatSessions()
  const { messages, isLoading: messagesLoading, sendMessage, isStreaming, error } = useChatMessages(activeSessionId)

  // Auto-select most recent session — unless the brain already named one.
  useEffect(() => {
    if (urlClaimedSession.current) return
    if (!sessionsLoading && sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id)
    }
  }, [sessions, sessionsLoading, activeSessionId])

  /**
   * Are we pinned to the bottom? A student who scrolls UP to re-read an earlier
   * answer while the tutor is still streaming must NOT be yanked back down —
   * and the old unconditional `scrollTop = scrollHeight` did exactly that, on
   * every token. So auto-scroll only while they are already near the bottom;
   * scrolling back down re-arms it.
   */
  const stickBottom = useRef(true)

  const onTranscriptScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    stickBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }, [])

  // The last message's TEXT, not just the count: while streaming, the same
  // message's content grows and `messages.length` never changes. Keying the
  // scroll on length alone would scroll once and then let the text run past the
  // bottom of the frame.
  const lastText = messages[messages.length - 1]?.content ?? ''

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !stickBottom.current) return
    // Jump, don't smooth-scroll: at streaming cadence the animations stack and
    // the transcript visibly stutters.
    el.scrollTop = el.scrollHeight
  }, [messages.length, lastText, isStreaming])

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
        // overrideSessionId rather than the old setTimeout(100): the hook's own
        // sessionId has not re-rendered yet, and a fixed delay was a race.
        await sendMessage(content, courseContext, session.id)
        return
      } catch {
        return
      }
    }

    setInputValue('')
    await sendMessage(content, courseContext)
  }, [inputValue, activeSessionId, isStreaming, courseContext, createSession, sendMessage])

  // Was a two-click inline red confirm on the row itself; now one Dialog, so the
  // destructive step is announced and Escape-cancellable.
  const confirmDelete = useCallback(async () => {
    const target = sessionToDelete
    if (!target) return
    setSessionToDelete(null)
    try {
      await deleteSession(target.id)
      if (activeSessionId === target.id) {
        setActiveSessionId(null)
      }
    } catch {
      // silent
    }
  }, [activeSessionId, deleteSession, sessionToDelete])

  const activeSession = sessions.find((s) => s.id === activeSessionId)
  const lastMessage = messages[messages.length - 1]
  const isBusy = sessionsLoading || Boolean(activeSessionId && messagesLoading && messages.length === 0)

  /**
   * The conversation list, rendered in two places: the shell's persistent right
   * column on desktop, and the mobile sheet. Defined once so the two can never
   * drift — the desktop column is the primary surface now, and the sheet only
   * exists because brain-theme.css collapses that column into a full-bleed
   * overlay below 1024px, where a permanently-open list would bury the chat.
   */
  const historyList = sessionsLoading ? (
    <ListSkeleton count={4} label="Loading conversations" />
  ) : sessions.length === 0 ? (
    <EmptyState
      illustration="search"
      title="No conversations yet"
      description="Start a chat and it will show up here."
    />
  ) : (
    <div className="flex flex-col gap-2">
      {sessions.map((session) => (
        <ListItem
          key={session.id}
          icon={<MessageSquare />}
          title={getSessionTitle(session)}
          // What the conversation is grounded in. Without it every row reads
          // the same and there is no way to tell a document-scoped chat from
          // an open-ended one.
          meta={
            (session.docCount ?? 0) > 0 ? (
              <span className="flex items-center gap-1">
                <FileText className="size-3" aria-hidden />
                {session.docCount} {session.docCount === 1 ? 'document' : 'documents'}
              </span>
            ) : (
              <span>All documents</span>
            )
          }
          selected={activeSessionId === session.id}
          onClick={() => {
            setActiveSessionId(session.id)
            // No-op on desktop (the sheet is closed); on mobile this is what
            // dismisses the overlay after picking a conversation.
            setSidebarOpen(false)
          }}
          action={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete chat ${getSessionTitle(session)}`}
              onClick={() => setSessionToDelete(session)}
            >
              <Trash2 />
            </Button>
          }
        />
      ))}
    </div>
  )

  return (
    <BrainShell
      rightColumn={
        // `hidden lg:flex`, not always-on: below 1024px brain-theme.css turns
        // the last column into `position:absolute; inset:0`, so rendering it on
        // mobile would park an opaque history panel over the whole chat with no
        // way to close it. Below that width the sheet is the surface instead.
        <aside
          className="br-column hidden lg:flex"
          style={{ borderLeft: '1px solid var(--br-border)' }}
        >
          <div className="br-column-head">
            <span>CHAT HISTORY</span>
          </div>
          <div className="br-scroll" style={{ padding: 12 }}>
            {historyList}
          </div>
        </aside>
      }
    >
    <PageContainer className="h-full min-h-0 gap-4 pb-4 sm:gap-5 sm:pb-6">
      <PageHeader
        title="AI Tutor"
        subtitle={
          activeSession
            ? getSessionTitle(activeSession)
            : 'Ask anything — the tutor can read every document you have uploaded.'
        }
        count={sessions.length > 0 ? `${sessions.length} ${sessions.length === 1 ? 'chat' : 'chats'}` : undefined}
        icon={<img src="/images/logo.png" alt="" width={20} height={20} className="size-5 rounded-[6px]" />}
        actions={
          <>
            <Button onClick={handleNewChat}>
              <Plus />
              New chat
            </Button>

            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              {/* Mobile only. From 1024px up the conversation list is a
                  permanent column in the shell, so a button that opens the same
                  list as an overlay is a second door to a room you are already
                  standing in. Below that width brain-theme.css collapses the
                  column into a full-bleed overlay, so the button is the only way
                  to reach — and dismiss — the list. */}
              <SheetTrigger
                render={<Button variant="outline" aria-label="Chat history" className="lg:hidden" />}
              >
                <History />
                <span className="hidden sm:inline">History</span>
              </SheetTrigger>

              <SheetContent side="left" className="flex w-80 flex-col gap-0 p-0 sm:max-w-sm">
                <SheetHeader className="border-b border-[var(--br-border)] px-4 py-3">
                  <SheetTitle>Chat history</SheetTitle>
                </SheetHeader>

                <div className="px-4 pt-4">
                  <Button onClick={handleNewChat} className="w-full">
                    <Plus />
                    New chat
                  </Button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4">{historyList}</div>
              </SheetContent>
            </Sheet>
          </>
        }
      />

      {/* Context bar — the vault selection carried over from the brain. Only
          rendered when something was actually passed, so a direct visit to
          /tutor looks exactly as it did before. */}
      {contextDocs.length > 0 && (
        <div className={`${MEASURE} flex flex-wrap items-center gap-2`}>
          <span className="text-xs text-[var(--br-text3)]">Focused on</span>
          {contextDocs.map((doc) => (
            <span key={doc.id} className="br-chip">
              <FileText className="size-3 shrink-0" aria-hidden />
              <span className="max-w-[180px] truncate">{doc.name ?? 'Loading…'}</span>
              <button
                type="button"
                onClick={() => setContextIds((prev) => (prev ?? []).filter((id) => id !== doc.id))}
                aria-label={`Stop focusing on ${doc.name ?? 'this document'}`}
                className="flex cursor-pointer border-0 bg-transparent p-0 text-inherit"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Transcript. The scroll lives here, not on the page, so the composer
          below stays pinned while the messages move. */}
      <div
        ref={scrollRef}
        onScroll={onTranscriptScroll}
        className="scrollbar-hide min-h-0 flex-1 overflow-y-auto"
      >
        {isBusy ? (
          <div role="status" className="flex h-full items-center justify-center py-12">
            <Loader2 aria-hidden className="size-5 animate-spin text-primary" />
            <span className="sr-only">Loading conversation…</span>
          </div>
        ) : messages.length === 0 ? (
          <div className={`${MEASURE} flex min-h-full flex-col justify-center`}>
            <EmptyState
              illustration="search"
              title="What would you like to study?"
              description="I have access to all your uploaded documents. Ask me anything."
              className="py-6 sm:py-8"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  onClick={() => setInputValue(suggestion)}
                  className="h-auto justify-start whitespace-normal rounded-xl px-4 py-3 text-left text-sm font-normal"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className={`${MEASURE} space-y-6`}>
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <img
                      src="/images/logo.png"
                      alt=""
                      aria-hidden
                      width={28}
                      height={28}
                      className="mt-1 size-7 shrink-0 rounded-full"
                    />
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-br-sm bg-primary text-primary-foreground'
                        : 'rounded-bl-sm bg-[var(--br-bg2)] text-[var(--br-text)]'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="relative">
                        <Markdown content={msg.content} />
                        {isStreaming && msg.id === lastMessage?.id && msg.content && (
                          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-text-bottom" />
                        )}

                        {/* Sources. An answer retrieved from the student's own
                            documents should say so — otherwise it is
                            indistinguishable from one the model invented. */}
                        {(msg.sources?.length ?? 0) > 0 && (
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--br-border)] pt-2 text-xs">
                            <span className="inline-flex items-center gap-1 text-[var(--br-text3)]">
                              <Quote className="size-3" aria-hidden />
                              Sources:
                            </span>
                            {msg.sources!.map((src, i) => (
                              <button
                                key={src.chunkId || i}
                                type="button"
                                onClick={() =>
                                  setOpenSource({
                                    src,
                                    n: i + 1,
                                    // The question this answer replied to.
                                    question: messages[idx - 1]?.role === 'user' ? messages[idx - 1].content : '',
                                  })
                                }
                                className="cursor-pointer border-0 bg-transparent p-0 font-medium text-primary underline-offset-2 hover:underline"
                              >
                                [{i + 1}]
                                {Number.isFinite(src.score) && (
                                  <span className="ml-1 tabular-nums text-[var(--br-text3)]">
                                    {(src.score * 100).toFixed(0)}%
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
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
            {isStreaming && lastMessage?.role !== 'assistant' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
                role="status"
              >
                <span className="sr-only">The tutor is replying…</span>
                <img
                  src="/images/logo.png"
                  alt=""
                  aria-hidden
                  width={28}
                  height={28}
                  className="size-7 shrink-0 rounded-full"
                />
                <div
                  aria-hidden
                  className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-[var(--br-bg2)] px-4 py-3"
                >
                  <span className="size-2 rounded-full bg-primary/60 animate-[bounce_1.4s_ease-in-out_infinite]" />
                  <span className="size-2 rounded-full bg-primary/60 animate-[bounce_1.4s_ease-in-out_0.2s_infinite]" />
                  <span className="size-2 rounded-full bg-primary/60 animate-[bounce_1.4s_ease-in-out_0.4s_infinite]" />
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
          className={`${MEASURE} flex items-center justify-between rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400`}
        >
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => sendMessage(messages.filter((m) => m.role === 'user').pop()?.content ?? '')}
            className="ml-2 text-red-700 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Composer. Still a <textarea> rather than ui/input — the send-on-Enter,
          Shift+Enter-for-newline and auto-grow-to-160px behaviour needs a
          multiline control, and there is no ui/textarea to reuse. Retokened to
          --br-* / primary so it matches the rest of the shell. */}
      <div className={`${MEASURE} relative`}>
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
          placeholder="Ask anything…"
          disabled={isStreaming}
          rows={1}
          className="w-full resize-none rounded-2xl border border-[var(--br-border)] bg-[var(--br-field-bg)] py-3 pl-4 pr-12 text-sm text-[var(--br-text)] outline-none transition-colors placeholder:text-[var(--br-text3)] focus:border-[var(--br-accent-line)] focus:ring-3 focus:ring-ring/40 disabled:opacity-50"
          aria-label="Chat message input"
        />
        <Button
          onClick={handleSend}
          disabled={!inputValue.trim() || isStreaming}
          size="icon"
          className="absolute bottom-2 right-2 rounded-full disabled:opacity-30"
          aria-label="Send message"
        >
          {isStreaming ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </div>
      </PageContainer>

      {/* Source reader. The excerpt the answer was grounded in, with the
          question's terms highlighted so the relevant passage is findable. */}
      <Dialog
        open={Boolean(openSource)}
        onOpenChange={(open) => {
          if (!open) setOpenSource(null)
        }}
      >
        <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Source [{openSource?.n}]</DialogTitle>
            <DialogDescription>
              {openSource && Number.isFinite(openSource.src.score)
                ? `${(openSource.src.score * 100).toFixed(0)}% match with your question`
                : 'Excerpt from your documents'}
            </DialogDescription>
          </DialogHeader>
          <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap rounded-lg bg-[var(--br-bg2,rgba(255,255,255,0.04))] p-4 text-sm leading-relaxed">
            {openSource && (
              <Highlighted text={openSource.src.content} terms={queryTerms(openSource.question)} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Page level, not inside the sheet. The delete buttons now live in TWO
          places — the desktop column and the mobile sheet — and a Dialog nested
          in SheetContent unmounts with the sheet, so the desktop column's delete
          had nothing to open. One dialog here serves both. */}
      <Dialog
        open={Boolean(sessionToDelete)}
        onOpenChange={(open) => {
          if (!open) setSessionToDelete(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this chat?</DialogTitle>
            <DialogDescription>
              {sessionToDelete
                ? `“${getSessionTitle(sessionToDelete)}” and all of its messages will be permanently removed. This cannot be undone.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 />
              Delete chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BrainShell>
  )
}
