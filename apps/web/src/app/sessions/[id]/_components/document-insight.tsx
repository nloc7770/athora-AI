'use client'

import { useState } from 'react'
import {
  FileText,
  BookOpen,
  Brain,
  ClipboardList,
  Network,
  Sparkles,
  Loader2,
  AlertCircle,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { MindMapFlow } from '@/components/ui/mindmap-flow'
import { useDocumentStatus } from '@/hooks/use-documents'
import { useAiGeneration } from '@/hooks/use-ai-generation'

type InsightTab = 'summary' | 'flashcards' | 'exam' | 'mindmap'
type GenerationType = 'summary' | 'flashcards' | 'exam' | 'mindmap'

interface DocumentInsightProps {
  documentId: string
  document: any
}

const TAB_CONFIG: { key: InsightTab; label: string; icon: typeof BookOpen }[] = [
  { key: 'summary', label: 'Summary', icon: BookOpen },
  { key: 'flashcards', label: 'Flashcards', icon: Brain },
  { key: 'exam', label: 'Exam', icon: ClipboardList },
  { key: 'mindmap', label: 'Mind Map', icon: Network },
]

export function DocumentInsight({ documentId, document }: DocumentInsightProps) {
  const { generations, generate, isLoading: genLoading } = useAiGeneration(documentId)
  // Use real-time status polling
  const { status: docStatus } = useDocumentStatus(documentId)
  const isDocReady = docStatus === 'ready'
  const [activeTab, setActiveTab] = useState<InsightTab>('summary')
  const [flippedCard, setFlippedCard] = useState<number | null>(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set())
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set())

  const getGeneration = (type: GenerationType) => {
    const completed = generations.find((g) => g.type === type && g.status === 'completed')
    return {
      completed,
      pending: generations.find(
        (g) => g.type === type && (g.status === 'pending' || g.status === 'processing')
      ),
      error: completed ? undefined : generations.find((g) => g.type === type && g.status === 'error'),
    }
  }

  const summary = getGeneration('summary')
  const flashcards = getGeneration('flashcards')
  const exam = getGeneration('exam')
  const mindmap = getGeneration('mindmap')

  function getCount(tab: InsightTab): number | null {
    switch (tab) {
      case 'flashcards':
        return flashcards.completed?.result?.cards?.length ?? null
      case 'exam':
        return exam.completed?.result?.questions?.length ?? null
      case 'mindmap':
        return mindmap.completed?.result?.nodes?.length ?? null
      default:
        return null
    }
  }

  function toggleChapter(idx: number) {
    setExpandedChapters((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  function toggleAnswer(idx: number) {
    setRevealedAnswers((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header: file name + size */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
          <FileText className="h-4 w-4 text-purple-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {document?.name ?? 'Document'}
          </h3>
          <p className="text-xs text-gray-400">
            {document?.file_size
              ? `${(document.file_size / 1024 / 1024).toFixed(1)} MB`
              : ''}
            {document?.type ? ` • ${document.type.toUpperCase()}` : ''}
          </p>
        </div>
      </div>

      {/* Processing state */}
      {!isDocReady ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
          <div className="relative mb-4">
            <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-700">Processing document</p>
          <p className="mt-1 text-xs text-gray-400 text-center max-w-[200px]">
            Insights will be available once processing completes
          </p>
        </div>
      ) : (
        <>
          {/* Pill Tabs */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex gap-1 rounded-xl bg-gray-100/80 p-1">
              {TAB_CONFIG.map(({ key, label, icon: Icon }) => {
                const count = getCount(key)
                const isActive = activeTab === key
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 flex-1 justify-center ${
                      isActive
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                    {count !== null && (
                      <span
                        className={`ml-0.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                          isActive
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full p-4"
              >
                {activeTab === 'summary' && (
                  <SummaryContent
                    data={summary}
                    genLoading={genLoading}
                    generate={generate}
                    expandedChapters={expandedChapters}
                    toggleChapter={toggleChapter}
                  />
                )}
                {activeTab === 'flashcards' && (
                  <FlashcardsContent
                    data={flashcards}
                    genLoading={genLoading}
                    generate={generate}
                    flippedCard={flippedCard}
                    setFlippedCard={setFlippedCard}
                    currentCardIndex={currentCardIndex}
                    setCurrentCardIndex={setCurrentCardIndex}
                  />
                )}
                {activeTab === 'exam' && (
                  <ExamContent
                    data={exam}
                    genLoading={genLoading}
                    generate={generate}
                    revealedAnswers={revealedAnswers}
                    toggleAnswer={toggleAnswer}
                  />
                )}
                {activeTab === 'mindmap' && (
                  <MindMapContent
                    data={mindmap}
                    genLoading={genLoading}
                    generate={generate}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Shared Sub-Components ─── */

function EmptyState({
  icon: Icon,
  title,
  buttonLabel,
  onGenerate,
  disabled,
}: {
  icon: typeof BookOpen
  title: string
  buttonLabel: string
  onGenerate: () => void
  disabled: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100">
        <Icon className="h-7 w-7 text-gray-300" />
      </div>
      <p className="text-sm text-gray-500 mb-4 text-center max-w-[220px]">{title}</p>
      <Button
        onClick={onGenerate}
        disabled={disabled}
        className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
      >
        <Sparkles className="h-4 w-4" />
        {disabled ? 'Generating...' : buttonLabel}
      </Button>
    </div>
  )
}

function ErrorState({
  onRetry,
  disabled,
}: {
  onRetry: () => void
  disabled: boolean
}) {
  return (
    <div className="mx-auto max-w-sm rounded-xl border border-red-100 bg-red-50/50 p-6 text-center">
      <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-300" />
      <p className="text-sm font-medium text-red-700 mb-1">Generation failed</p>
      <p className="text-xs text-red-400 mb-4">Something went wrong. Please try again.</p>
      <Button
        size="sm"
        variant="outline"
        onClick={onRetry}
        disabled={disabled}
        className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Retry
      </Button>
    </div>
  )
}

function LoadingSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-4 py-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2.5 animate-pulse">
          <div
            className="h-4 rounded-lg bg-gradient-to-r from-purple-100 via-purple-50 to-purple-100 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
            style={{ width: `${90 - i * 10}%` }}
          />
          {i < lines - 1 && (
            <div
              className="h-3 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite_0.2s]"
              style={{ width: `${75 - i * 8}%` }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="rounded-xl border border-purple-100 bg-purple-50/30 p-5 space-y-3">
        <div className="h-4 rounded-lg bg-purple-100 w-3/4" />
        <div className="h-3 rounded-lg bg-purple-50 w-1/2" />
      </div>
      <div className="rounded-xl border border-purple-100 bg-purple-50/30 p-5 space-y-3">
        <div className="h-4 rounded-lg bg-purple-100 w-2/3" />
        <div className="h-3 rounded bg-gray-50 w-1/3" />
      </div>
    </div>
  )
}

/* ─── Summary Content ─── */

function SummaryContent({
  data,
  genLoading,
  generate,
  expandedChapters,
  toggleChapter,
}: {
  data: { completed: any; pending: any; error: any }
  genLoading: boolean
  generate: (type: GenerationType) => void
  expandedChapters: Set<number>
  toggleChapter: (idx: number) => void
}) {
  if (data.error) return <ErrorState onRetry={() => generate('summary')} disabled={genLoading} />
  if (data.pending) return <LoadingSkeleton lines={5} />
  if (!data.completed?.result) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Generate a concise summary of this document"
        buttonLabel="Generate Summary"
        onGenerate={() => generate('summary')}
        disabled={genLoading}
      />
    )
  }

  const { overview, chapters, takeaways } = data.completed.result

  return (
    <div className="space-y-4">
      {/* Overview */}
      {overview && (
        <p className="text-sm text-gray-700 leading-relaxed">{overview}</p>
      )}

      {/* Chapters */}
      {chapters?.map((ch: any, i: number) => {
        const isExpanded = expandedChapters.has(i)
        return (
          <div key={i} className="rounded-xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => toggleChapter(i)}
              className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-gray-50/50 transition"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
              )}
              <span className="text-sm font-medium text-gray-800">{ch.title}</span>
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <ul className="px-4 pb-3 space-y-1.5">
                    {ch.keyPoints?.map((kp: string, j: number) => (
                      <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
                        {kp}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}

      {/* Takeaways */}
      {takeaways && takeaways.length > 0 && (
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 p-4">
          <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-2">
            Key Takeaways
          </p>
          <ul className="space-y-1.5">
            {takeaways.map((t: string, i: number) => (
              <li key={i} className="text-sm text-purple-900 flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* ─── Flashcards Content ─── */

function FlashcardsContent({
  data,
  genLoading,
  generate,
  flippedCard,
  setFlippedCard,
  currentCardIndex,
  setCurrentCardIndex,
}: {
  data: { completed: any; pending: any; error: any }
  genLoading: boolean
  generate: (type: GenerationType) => void
  flippedCard: number | null
  setFlippedCard: (idx: number | null) => void
  currentCardIndex: number
  setCurrentCardIndex: (idx: number) => void
}) {
  if (data.error) return <ErrorState onRetry={() => generate('flashcards')} disabled={genLoading} />
  if (data.pending) return <CardSkeleton />
  if (!data.completed?.result?.cards) {
    return (
      <EmptyState
        icon={Layers}
        title="Create flashcards from this document for quick review"
        buttonLabel="Generate Flashcards"
        onGenerate={() => generate('flashcards')}
        disabled={genLoading}
      />
    )
  }

  const cards = data.completed.result.cards
  const total = cards.length
  const card = cards[currentCardIndex]
  const isFlipped = flippedCard === currentCardIndex

  return (
    <div className="flex flex-col items-center">
      {/* Counter */}
      <p className="text-xs text-gray-400 font-medium mb-3">
        Card {currentCardIndex + 1} of {total}
      </p>

      {/* Flashcard */}
      <div
        onClick={() => setFlippedCard(isFlipped ? null : currentCardIndex)}
        className="w-full max-w-sm cursor-pointer perspective-1000"
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="relative w-full min-h-[180px] preserve-3d"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-gray-100 bg-white p-6 shadow-sm backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Question</p>
            <p className="text-sm font-medium text-gray-800 text-center leading-relaxed">
              {card.front}
            </p>
            <p className="mt-4 text-[10px] text-gray-300">Tap to reveal</p>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-purple-100 bg-purple-50/50 p-6 shadow-sm backface-hidden"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-xs text-purple-600 uppercase tracking-wide mb-2">Answer</p>
            <p className="text-sm text-gray-700 text-center leading-relaxed">
              {card.back}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-5">
        <Button
          size="sm"
          variant="outline"
          disabled={currentCardIndex === 0}
          onClick={() => {
            setFlippedCard(null)
            setCurrentCardIndex(currentCardIndex - 1)
          }}
          className="h-8 px-3 text-xs"
        >
          Previous
        </Button>
        <div className="flex gap-1">
          {cards.slice(0, Math.min(total, 8)).map((_: any, i: number) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition ${
                i === currentCardIndex ? 'bg-purple-500' : 'bg-gray-200'
              }`}
            />
          ))}
          {total > 8 && <span className="text-[10px] text-gray-300 ml-1">...</span>}
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={currentCardIndex === total - 1}
          onClick={() => {
            setFlippedCard(null)
            setCurrentCardIndex(currentCardIndex + 1)
          }}
          className="h-8 px-3 text-xs"
        >
          Next
        </Button>
      </div>
    </div>
  )
}

/* ─── Exam Content ─── */

function ExamContent({
  data,
  genLoading,
  generate,
  revealedAnswers,
  toggleAnswer,
}: {
  data: { completed: any; pending: any; error: any }
  genLoading: boolean
  generate: (type: GenerationType) => void
  revealedAnswers: Set<number>
  toggleAnswer: (idx: number) => void
}) {
  if (data.error) return <ErrorState onRetry={() => generate('exam')} disabled={genLoading} />
  if (data.pending) return <CardSkeleton />
  if (!data.completed?.result?.questions) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Generate practice questions to test your knowledge"
        buttonLabel="Generate Exam"
        onGenerate={() => generate('exam')}
        disabled={genLoading}
      />
    )
  }

  const questions = data.completed.result.questions

  return (
    <div className="space-y-3">
      {questions.map((q: any, i: number) => {
        const isRevealed = revealedAnswers.has(i)
        return (
          <div key={i} className="rounded-xl border border-gray-100 p-4">
            <p className="text-sm font-medium text-gray-800 mb-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-[11px] font-semibold text-purple-700 mr-2">
                {i + 1}
              </span>
              {q.question ?? q.text}
            </p>
            {q.options && (
              <ul className="space-y-1.5 ml-7 mb-2">
                {q.options.map((opt: string, j: number) => (
                  <li key={j} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gray-100 text-[11px] font-medium text-gray-500">
                      {String.fromCharCode(65 + j)}
                    </span>
                    {opt}
                  </li>
                ))}
              </ul>
            )}
            {(q.answer || q.explanation) && (
              <div className="ml-7">
                <button
                  onClick={() => toggleAnswer(i)}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium transition"
                >
                  {isRevealed ? 'Hide answer' : 'Reveal answer'}
                </button>
                <AnimatePresence>
                  {isRevealed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 rounded-lg bg-green-50 border border-green-100 px-3 py-2">
                        {q.answer && (
                          <p className="text-xs font-medium text-green-700">
                            Answer: {q.answer}
                          </p>
                        )}
                        {q.explanation && (
                          <p className="text-xs text-green-600 mt-1">{q.explanation}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Mind Map Content ─── */

function MindMapContent({
  data,
  genLoading,
  generate,
}: {
  data: { completed: any; pending: any; error: any }
  genLoading: boolean
  generate: (type: GenerationType) => void
}) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  if (data.error) return <ErrorState onRetry={() => generate('mindmap')} disabled={genLoading} />
  if (data.pending) return <LoadingSkeleton lines={4} />
  if (!data.completed?.result?.nodes) {
    return (
      <EmptyState
        icon={Network}
        title="Map the key concepts and their relationships"
        buttonLabel="Generate Mind Map"
        onGenerate={() => generate('mindmap')}
        disabled={genLoading}
      />
    )
  }

  const { nodes, edges } = data.completed.result

  return (
    <div className="space-y-2">
      <span className="text-xs text-gray-400">{nodes.length} nodes · {edges?.length ?? 0} connections</span>
      <MindMapFlow rawNodes={nodes} edges={edges} height="450px" />
    </div>
  )
}
