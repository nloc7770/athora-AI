"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  BookOpen,
  Headphones,
  Layers,
  Bot,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Brain,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useChatSessions, useChatMessages } from "@/hooks/use-chat"
import { useAiGeneration } from "@/hooks/use-ai-generation"
import { useDocuments } from "@/hooks/use-documents"

interface ChatMessageItem {
  id: string
  sessionId: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

function formatMarkdownBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

interface DocumentViewerProps {
  document: { id: string; name: string; type: string; pageCount?: number } | null
  isLoading: boolean
}

function DocumentViewer({ document, isLoading }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = document?.pageCount ?? 1

  const documentLines = [
    { width: "85%" }, { width: "92%" }, { width: "78%" }, { width: "95%" },
    { width: "88%" }, { width: "45%" }, { width: "0%" }, { width: "90%" },
    { width: "82%" }, { width: "96%" }, { width: "74%" }, { width: "91%" },
    { width: "87%" }, { width: "60%" }, { width: "0%" }, { width: "93%" },
    { width: "85%" }, { width: "79%" }, { width: "94%" }, { width: "88%" },
    { width: "52%" }, { width: "0%" }, { width: "86%" }, { width: "91%" },
    { width: "77%" }, { width: "95%" }, { width: "83%" }, { width: "69%" },
  ]

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <FileText className="size-10 opacity-40" />
        <p className="text-sm">No document selected</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10">
          <FileText className="size-4 text-indigo-500" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{document.name}</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {document.type}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {totalPages} {totalPages === 1 ? "page" : "pages"}
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-[#fafaf9] dark:bg-zinc-900/50">
        <ScrollArea className="h-full">
          <div className="flex justify-center p-6 md:p-10">
            <div
              className="w-full max-w-[620px] rounded-sm border border-zinc-200 bg-white p-8 shadow-sm md:p-12 dark:border-zinc-700 dark:bg-zinc-800/80"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            >
              <div className="mb-6 h-5 w-[65%] rounded-sm bg-zinc-300 dark:bg-zinc-600" />
              <div className="mb-8 h-3 w-[40%] rounded-sm bg-zinc-200 dark:bg-zinc-700" />
              <div className="space-y-2.5">
                {documentLines.map((line, i) =>
                  line.width === "0%" ? (
                    <div key={i} className="h-4" />
                  ) : (
                    <div
                      key={i}
                      className="h-2.5 rounded-sm bg-zinc-200/70 dark:bg-zinc-700/60"
                      style={{ width: line.width }}
                    />
                  )
                )}
              </div>
              <div className="my-8 flex h-32 items-center justify-center rounded-md border-2 border-dashed border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                <span className="text-xs text-muted-foreground">
                  Document preview placeholder
                </span>
              </div>
              <div className="space-y-2.5">
                {documentLines.slice(0, 12).map((line, i) => (
                  <div
                    key={`b-${i}`}
                    className="h-2.5 rounded-sm bg-zinc-200/80 dark:bg-zinc-700/60"
                    style={{ width: line.width === "0%" ? "88%" : line.width }}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      <div className="flex items-center justify-between border-t px-3 py-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-[4rem] text-center text-xs text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
            disabled={zoom <= 50}
          >
            <ZoomOut />
          </Button>
          <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setZoom(Math.min(150, zoom + 10))}
            disabled={zoom >= 150}
          >
            <ZoomIn />
          </Button>
        </div>
      </div>
    </div>
  )
}

function ChatMessage({ message, index }: { message: ChatMessageItem; index: number }) {
  const isUser = message.role === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-zinc-100 text-foreground shadow-sm dark:bg-zinc-800"
            : "border-l-2 border-l-indigo-200 text-foreground"
        }`}
      >
        {message.content.split("\n").map((line, i) => (
          <p key={i} className={i > 0 ? "mt-1.5" : ""}>
            {formatMarkdownBold(line)}
          </p>
        ))}
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          {formatTimestamp(message.createdAt)}
        </p>
      </div>
    </motion.div>
  )
}

interface AIProfessorPanelProps {
  documentId: string | null
}

function AIProfessorPanel({ documentId }: AIProfessorPanelProps) {
  const [inputValue, setInputValue] = useState("")
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [generatingType, setGeneratingType] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { sessions, createSession } = useChatSessions(documentId ?? undefined)
  const { messages, sendMessage, isLoading: messagesLoading, isStreaming } = useChatMessages(activeSessionId)
  const { generations, generate, isLoading: generationsLoading, refresh: refreshGenerations } = useAiGeneration(documentId)

  // Auto-select or create session
  useEffect(() => {
    if (!documentId) {
      setActiveSessionId(null)
      return
    }

    if (sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id)
    }
  }, [sessions, documentId, activeSessionId])

  const ensureSession = useCallback(async (): Promise<string> => {
    if (activeSessionId) return activeSessionId

    if (!documentId) throw new Error("No document selected")

    const session = await createSession({ documentId, type: "document_chat" })
    setActiveSessionId(session.id)
    return session.id
  }, [activeSessionId, documentId, createSession])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    const content = inputValue.trim()
    if (!content) return

    setInputValue("")
    await ensureSession()
    await sendMessage(content)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleGenerate = async (type: "summary" | "flashcards" | "exam" | "mindmap") => {
    if (!documentId) return
    setGeneratingType(type)
    try {
      await generate(type)
    } finally {
      setGeneratingType(null)
    }
  }

  const summaryGeneration = generations.find((g) => g.type === "summary")
  const flashcardsGeneration = generations.find((g) => g.type === "flashcards")
  const examGeneration = generations.find((g) => g.type === "exam")

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
          <Bot className="size-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">AI Professor</h3>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="chat" className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b px-4 pt-1">
          <TabsList variant="line" className="h-8">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex flex-1 flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="space-y-4 p-4">
              {messagesLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <Bot className="size-8 text-indigo-400 opacity-60" />
                  <p className="text-sm text-muted-foreground">
                    Ask a question about this document
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {messages.map((msg, i) => (
                    <ChatMessage key={msg.id} message={msg} index={i} />
                  ))}
                </AnimatePresence>
              )}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border-l-2 border-l-indigo-200 px-4 py-2.5">
                    <Loader2 className="size-3.5 animate-spin text-indigo-500" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about this document..."
                className="flex-1 rounded-full border-zinc-200 bg-zinc-50 px-4 text-sm dark:border-zinc-700 dark:bg-zinc-800/50"
                disabled={!documentId}
              />
              <Button
                size="icon"
                className="shrink-0 rounded-full bg-indigo-600 hover:scale-105 hover:bg-indigo-700 transition-transform"
                disabled={!inputValue.trim() || isStreaming || !documentId}
                onClick={handleSend}
              >
                <Send className="size-3.5" />
              </Button>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="xs"
                className="text-muted-foreground hover:bg-zinc-100 rounded-lg transition-colors"
                onClick={() => handleGenerate("summary")}
                disabled={generatingType !== null || !documentId}
              >
                {generatingType === "summary" ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                Summarize
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="text-muted-foreground hover:bg-zinc-100 rounded-lg transition-colors"
                onClick={() => handleGenerate("flashcards")}
                disabled={generatingType !== null || !documentId}
              >
                {generatingType === "flashcards" ? <Loader2 className="size-3 animate-spin" /> : <Layers className="size-3" />}
                Flashcards
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="text-muted-foreground hover:bg-zinc-100 rounded-lg transition-colors"
                onClick={() => handleGenerate("exam")}
                disabled={generatingType !== null || !documentId}
              >
                {generatingType === "exam" ? <Loader2 className="size-3 animate-spin" /> : <BookOpen className="size-3" />}
                Exam
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="text-muted-foreground hover:bg-zinc-100 rounded-lg transition-colors"
                onClick={() => handleGenerate("mindmap")}
                disabled={generatingType !== null || !documentId}
              >
                {generatingType === "mindmap" ? <Loader2 className="size-3 animate-spin" /> : <Brain className="size-3" />}
                Mind Map
              </Button>
            </div>
            {examGeneration?.status === "completed" && (
              <Link
                href="/exam"
                className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
              >
                <BookOpen className="size-3" />
                View in Exams
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        </TabsContent>

        <TabsContent value="summary" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Document Summary</h4>
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-muted-foreground"
                  onClick={() => handleGenerate("summary")}
                  disabled={generatingType !== null || !documentId}
                >
                  {generatingType === "summary" ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />}
                  {summaryGeneration ? "Regenerate" : "Generate"}
                </Button>
              </div>

              {generationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : summaryGeneration?.result ? (
                <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                  <p className="whitespace-pre-wrap">{String(summaryGeneration.result)}</p>
                  <Separator />
                  <p className="text-xs text-muted-foreground">
                    Generated {new Date(summaryGeneration.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              ) : summaryGeneration?.status === "processing" ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8">
                  <Loader2 className="size-5 animate-spin text-indigo-500" />
                  <p className="text-sm text-muted-foreground">Generating summary...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                  <Sparkles className="size-8 text-indigo-400 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No summary yet. Click Generate to create one.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="flashcards" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="mb-4">
                <Button
                  className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => handleGenerate("flashcards")}
                  disabled={generatingType !== null || !documentId}
                >
                  {generatingType === "flashcards" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  {flashcardsGeneration ? "Regenerate flashcards" : "Generate from this document"}
                </Button>
              </div>

              {generationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : flashcardsGeneration?.result ? (
                <>
                  <div className="space-y-3">
                    <p className="mb-3 text-xs font-medium text-muted-foreground">
                      Flashcards generated
                    </p>
                  {Array.isArray(flashcardsGeneration.result) ? (
                    (flashcardsGeneration.result as Array<{ front: string; back: string; difficulty?: string }>).map((card, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="rounded-xl border bg-background p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          {card.difficulty && (
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${
                                card.difficulty === "easy"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : card.difficulty === "hard"
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              }`}
                            >
                              {card.difficulty}
                            </Badge>
                          )}
                          <BookOpen className="size-3 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">{card.front}</p>
                        <Separator className="my-2" />
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {card.back}
                        </p>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {String(flashcardsGeneration.result)}
                    </p>
                  )}
                </div>
                <Link
                  href="/flashcards"
                  className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                >
                  <Layers className="size-3.5" />
                  View in Flashcards
                  <ArrowRight className="size-3.5" />
                </Link>
                </>
              ) : flashcardsGeneration?.status === "processing" ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8">
                  <Loader2 className="size-5 animate-spin text-indigo-500" />
                  <p className="text-sm text-muted-foreground">Generating flashcards...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                  <Layers className="size-8 text-indigo-400 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No flashcards yet. Click the button above to generate.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function WorkspacePage() {
  const searchParams = useSearchParams()
  const documentId = searchParams.get("documentId")

  const { documents, isLoading: documentsLoading } = useDocuments()
  const activeDocument = documents.find((d) => d.id === documentId) ?? null

  const [mobileView, setMobileView] = useState<"document" | "chat">("document")
  const [showPanel, setShowPanel] = useState(true)

  return (
    <div className="flex h-full flex-col overflow-x-hidden">
      {!documentId && !documentsLoading && (
        <div className="flex items-center gap-2 border-b bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
          <AlertCircle className="size-4 shrink-0" />
          <p>No document selected. Open a document from your library to start.</p>
        </div>
      )}

      {/* Mobile toggle */}
      <div className="flex items-center border-b p-2 md:hidden">
        <Button
          variant={mobileView === "document" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1"
          onClick={() => setMobileView("document")}
        >
          <FileText className="size-3.5" />
          Document
        </Button>
        <Button
          variant={mobileView === "chat" ? "secondary" : "ghost"}
          size="sm"
          className="flex-1"
          onClick={() => setMobileView("chat")}
        >
          <Bot className="size-3.5" />
          AI Professor
        </Button>
      </div>

      {/* Desktop split layout */}
      <div className="hidden flex-1 overflow-hidden md:flex">
        <div
          className="flex-1 overflow-hidden border-r border-zinc-200/60 transition-all dark:border-zinc-700/60"
          style={{ flex: showPanel ? "1 1 50%" : "1 1 100%" }}
        >
          <DocumentViewer document={activeDocument} isLoading={documentsLoading} />
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/80 to-transparent dark:from-zinc-900/80" />
          <button
            onClick={() => setShowPanel(!showPanel)}
            className="flex h-full w-6 items-center justify-center border-r border-zinc-200/60 bg-zinc-50 text-muted-foreground transition-colors hover:bg-zinc-100 hover:text-foreground dark:border-zinc-700/60 dark:bg-zinc-900/50 dark:hover:bg-zinc-800"
          >
            {showPanel ? (
              <PanelLeftClose className="size-3.5" />
            ) : (
              <PanelLeftOpen className="size-3.5" />
            )}
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white/80 to-transparent dark:from-zinc-900/80" />
        </div>

        {showPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "50%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <AIProfessorPanel documentId={documentId} />
          </motion.div>
        )}
      </div>

      {/* Mobile view */}
      <div className="flex flex-1 overflow-hidden md:hidden">
        {mobileView === "document" ? (
          <DocumentViewer document={activeDocument} isLoading={documentsLoading} />
        ) : (
          <AIProfessorPanel documentId={documentId} />
        )}
      </div>
    </div>
  )
}
