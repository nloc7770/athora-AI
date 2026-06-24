"use client"

import { useState, useRef, useEffect } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { documents, chatMessages, suggestedQuestions } from "@/data/mock"
import type { Message } from "@/data/mock"

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

function DocumentViewer() {
  const [zoom, setZoom] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)
  const document = documents[0]
  const totalPages = document.pages ?? 42

  const documentLines = [
    { width: "85%" },
    { width: "92%" },
    { width: "78%" },
    { width: "95%" },
    { width: "88%" },
    { width: "45%" },
    { width: "0%" },
    { width: "90%" },
    { width: "82%" },
    { width: "96%" },
    { width: "74%" },
    { width: "91%" },
    { width: "87%" },
    { width: "60%" },
    { width: "0%" },
    { width: "93%" },
    { width: "85%" },
    { width: "79%" },
    { width: "94%" },
    { width: "88%" },
    { width: "52%" },
    { width: "0%" },
    { width: "86%" },
    { width: "91%" },
    { width: "77%" },
    { width: "95%" },
    { width: "83%" },
    { width: "69%" },
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Document header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10">
          <FileText className="size-4 text-indigo-500" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{document.name}</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {document.courseName}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {totalPages} pages
            </span>
          </div>
        </div>
      </div>

      {/* Course thumbnail bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-zinc-100 bg-zinc-50/50">
        <img src="/images/course-cs.png" alt="CS 101" className="h-8 w-8 rounded object-cover" />
        <div>
          <p className="text-sm font-medium text-zinc-900">Chapter 5 - Data Structures</p>
          <p className="text-xs text-zinc-500">CS 101 • Page 1 of 42</p>
        </div>
      </div>

      {/* Document content area */}
      <div className="relative flex-1 overflow-hidden bg-[#fafaf9] dark:bg-zinc-900/50">
        <ScrollArea className="h-full">
          <div className="flex justify-center p-6 md:p-10">
            <div
              className="w-full max-w-[620px] rounded-sm border border-zinc-200 bg-white p-8 shadow-sm md:p-12 dark:border-zinc-700 dark:bg-zinc-800/80"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            >
              {/* Simulated heading */}
              <div className="mb-6 h-5 w-[65%] rounded-sm bg-zinc-300 dark:bg-zinc-600" />
              <div className="mb-8 h-3 w-[40%] rounded-sm bg-zinc-200 dark:bg-zinc-700" />

              {/* Simulated text lines */}
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

              {/* Simulated figure placeholder */}
              <div className="my-8 flex h-32 items-center justify-center rounded-md border-2 border-dashed border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                <span className="text-xs text-muted-foreground">
                  Figure 5.3 — Hash Table with Chaining
                </span>
              </div>

              {/* More text lines */}
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

        {/* Page indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Document toolbar */}
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

function ChatMessage({ message, index }: { message: Message; index: number }) {
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
          {message.timestamp}
        </p>
      </div>
    </motion.div>
  )
}

function AIProfessorPanel() {
  const [inputValue, setInputValue] = useState("")
  const [messages] = useState<Message[]>(chatMessages)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
          <Bot className="size-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <img src="/images/tutor-avatar.png" alt="AI Professor" className="h-6 w-6 rounded-full" />
            <h3 className="text-sm font-semibold">AI Professor</h3>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="chat" className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b px-4 pt-1">
          <TabsList variant="line" className="h-8">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          </TabsList>
        </div>

        {/* Chat tab */}
        <TabsContent value="chat" className="flex flex-1 flex-col overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1">
            <div className="space-y-4 p-4">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, i) => (
                  <ChatMessage key={msg.id} message={msg} index={i} />
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />

              {/* Suggested questions */}
              <div className="pt-2">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Suggested questions
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedQuestions.slice(0, 4).map((q, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-foreground"
                      onClick={() => setInputValue(q)}
                    >
                      {q}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about this document..."
                className="flex-1 rounded-full border-zinc-200 bg-zinc-50 px-4 text-sm dark:border-zinc-700 dark:bg-zinc-800/50"
              />
              <Button
                size="icon"
                className="shrink-0 rounded-full bg-indigo-600 hover:scale-105 hover:bg-indigo-700 transition-transform"
                disabled={!inputValue.trim()}
              >
                <Send className="size-3.5" />
              </Button>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <Button variant="ghost" size="xs" className="text-muted-foreground hover:bg-zinc-100 rounded-lg transition-colors">
                <Sparkles className="size-3" />
                Summarize
              </Button>
              <Button variant="ghost" size="xs" className="text-muted-foreground hover:bg-zinc-100 rounded-lg transition-colors">
                <Layers className="size-3" />
                Flashcards
              </Button>
              <Button variant="ghost" size="xs" className="text-muted-foreground hover:bg-zinc-100 rounded-lg transition-colors">
                <Headphones className="size-3" />
                Audio Lesson
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Summary tab */}
        <TabsContent value="summary" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Chapter Summary</h4>
                <Button variant="ghost" size="xs" className="text-muted-foreground">
                  <RotateCcw className="size-3" />
                  Regenerate
                </Button>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">
                  Chapter 5: Data Structures — Key Takeaways
                </p>
                <ul className="list-inside space-y-2">
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-indigo-500">•</span>
                    <span>
                      <strong className="text-foreground">Hash Tables</strong> provide O(1) average-case
                      lookup by mapping keys to array indices via a hash function. Collisions are
                      handled through chaining or open addressing.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-indigo-500">•</span>
                    <span>
                      <strong className="text-foreground">Load Factor</strong> (alpha = n/m) determines
                      when to resize. Typical threshold is 0.75 to balance space and performance.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-indigo-500">•</span>
                    <span>
                      <strong className="text-foreground">Binary Search Trees</strong> maintain sorted
                      order with O(log n) operations when balanced. AVL and Red-Black trees guarantee
                      balance.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-indigo-500">•</span>
                    <span>
                      <strong className="text-foreground">Graphs</strong> represent relationships via
                      adjacency lists or matrices. BFS and DFS are fundamental traversal algorithms
                      with distinct use cases.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 shrink-0 text-indigo-500">•</span>
                    <span>
                      <strong className="text-foreground">Heaps</strong> enable efficient priority queue
                      operations. Min-heaps and max-heaps support O(log n) insert and extract.
                    </span>
                  </li>
                </ul>
                <Separator />
                <p className="text-xs text-muted-foreground">
                  Generated from pages 1-42 • Last updated 2 minutes ago
                </p>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Flashcards tab */}
        <TabsContent value="flashcards" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="mb-4">
                <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <Sparkles className="size-3.5" />
                  Generate from this document
                </Button>
              </div>

              <p className="mb-3 text-xs font-medium text-muted-foreground">
                Preview (3 cards generated)
              </p>

              <div className="space-y-3">
                {[
                  {
                    front: "What is the time complexity of hash table lookup (average case)?",
                    back: "O(1) — constant time via direct array index access through hashing.",
                    difficulty: "easy",
                  },
                  {
                    front: "Name two collision resolution strategies for hash tables.",
                    back: "1. Chaining (linked lists at each bucket)\n2. Open addressing (linear/quadratic probing, double hashing)",
                    difficulty: "medium",
                  },
                  {
                    front: "When should a hash table be resized?",
                    back: "When the load factor (n/m) exceeds the threshold (typically 0.75). Resizing doubles the array and rehashes all entries — O(n) but amortized O(1).",
                    difficulty: "medium",
                  },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-xl border bg-background p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          card.difficulty === "easy"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                      >
                        {card.difficulty}
                      </Badge>
                      <BookOpen className="size-3 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">{card.front}</p>
                    <Separator className="my-2" />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {card.back}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function WorkspacePage() {
  const [mobileView, setMobileView] = useState<"document" | "chat">("document")
  const [showPanel, setShowPanel] = useState(true)

  return (
    <div className="flex h-full flex-col overflow-x-hidden">
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
        {/* Left panel — document viewer */}
        <div
          className="flex-1 overflow-hidden border-r border-zinc-200/60 transition-all dark:border-zinc-700/60"
          style={{ flex: showPanel ? "1 1 50%" : "1 1 100%" }}
        >
          <DocumentViewer />
        </div>

        {/* Toggle panel button */}
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

        {/* Right panel — AI professor */}
        {showPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "50%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <AIProfessorPanel />
          </motion.div>
        )}
      </div>

      {/* Mobile view */}
      <div className="flex flex-1 overflow-hidden md:hidden">
        {mobileView === "document" ? <DocumentViewer /> : <AIProfessorPanel />}
      </div>
    </div>
  )
}
