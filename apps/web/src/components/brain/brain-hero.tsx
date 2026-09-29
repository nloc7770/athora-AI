'use client'

import { Component, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Loader2, Search, Upload, X } from 'lucide-react'

import { buildGraphData, type BrainGraphNode } from '@/lib/brain-graph'
import { useBrainGraph } from '@/hooks/use-brain-graph'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

// WebGL/three never load on the server or in jsdom (dashboard tests mock this file).
const BrainGraph3D = dynamic(() => import('./brain-graph-3d'), { ssr: false, loading: () => null })

class GraphErrorBoundary extends Component<{ fallback: ReactNode; children?: ReactNode }, { crashed: boolean }> {
  state = { crashed: false }
  static getDerivedStateFromError() {
    return { crashed: true }
  }
  render() {
    return this.state.crashed ? this.props.fallback : this.props.children
  }
}

/** Veronica's stat cell: big accent number over a tiny tracked-out key. */
function Stat({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-[10px] px-[18px] py-[7px] transition-colors hover:bg-violet-500/10">
      <span
        className="text-[20px] font-bold leading-[1.05] tabular-nums text-[#ff7a3c]"
        style={{ textShadow: '0 0 14px rgba(255,122,60,0.45)' }}
      >
        {num}
      </span>
      <span className="mt-[3px] text-[9px] tracking-[1.5px] text-[#9a9ab6]">{label}</span>
    </div>
  )
}

/** Spotlight semantics: AND over whitespace-separated terms, case-insensitive. */
function matchesQuery(label: string, terms: string[]): boolean {
  const haystack = label.toLowerCase()
  return terms.every((t) => haystack.includes(t))
}

interface BrainHeroProps {
  onUpload: (file: File) => Promise<void>
  /**
   * Let the shell act on a node IN PLACE — reveal it in the vault, or select it
   * for the tutor — instead of navigating away from the brain. The brain is the
   * map, so a click on a session should unfold that session where it already
   * is, not throw the user onto another page. Return `true` when handled; the
   * fallback navigation then stands down.
   */
  onNodeSelect?: (node: BrainGraphNode) => boolean
}

export function BrainHero({ onUpload, onNodeSelect }: BrainHeroProps) {
  const router = useRouter()
  const { data, isLoading, error } = useBrainGraph()
  const reducedMotion = useReducedMotion()

  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [query, setQuery] = useState('')
  // Each keystroke rebuilds the whole graph; wait for a pause instead.
  const debouncedQuery = useDebouncedValue(query)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const maxNodes = isMobile ? 60 : 400

  // null when idle, a Set when searching — an empty Set legitimately means
  // "no hits, dim everything". See buildGraphData's highlightIds contract.
  const highlightIds = useMemo(() => {
    const terms = debouncedQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (terms.length === 0) return null
    const hits = new Set<string>()
    for (const n of data?.nodes ?? []) {
      if (n.id && n.label && matchesQuery(n.label, terms)) hits.add(n.id)
    }
    return hits
  }, [debouncedQuery, data])

  const graph = useMemo(
    () => buildGraphData(data, { maxNodes, isDark: true, highlightIds }),
    [data, maxNodes, highlightIds],
  )

  const docs = graph.nodes.filter((n) => n.kind === 'document')
  const readyCount = docs.filter((d) => d.status === 'ready').length
  const workingCount = docs.filter((d) => d.status && d.status !== 'ready' && d.status !== 'failed').length
  // Sessions alone leave the nebula with nothing to open: the strip reads
  // 0 FILES and the field explains nothing. That (not "graph is empty") is the
  // state the CTA below is for.
  const needsFirstDoc = !isLoading && !error && docs.length === 0
  const hitCount = highlightIds?.size ?? 0

  // Only real file drags — internal graph interaction must not arm the drop zone.
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('Files')) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragging(true)
  }, [])

  const runUpload = useCallback(
    async (file: File | undefined) => {
      if (!file) return
      setIsUploading(true)
      try {
        await onUpload(file)
      } finally {
        setIsUploading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [onUpload],
  )

  const handleNodeOpen = useCallback(
    (n: BrainGraphNode) => {
      // The shell gets first refusal: it can unfold the node in the columns
      // beside the graph, which is where the answer visually is.
      if (onNodeSelect?.(n)) return
      if (n.kind === 'document') router.push(n.sessionId ? `/sessions/${n.sessionId}` : '/library')
      else if (n.kind === 'concept') router.push(`/tutor?q=${encodeURIComponent(n.label)}`)
      else router.push('/sessions')
    },
    [onNodeSelect, router],
  )

  return (
    <section
      aria-label="Knowledge brain"
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        setIsDragging(false)
        if (!e.dataTransfer.files?.length) return
        e.preventDefault()
        void runUpload(e.dataTransfer.files[0])
      }}
      // Veronica is dark-first: the nebula keeps its own dark field in both
      // themes. No border/radius of its own — it fills the HUD card, which
      // already draws them (two borders made a visible double edge).
      className="relative h-full overflow-hidden bg-[#0e0e16]"
    >
      {/* data-brain-upload lets the HUD's VAULT column reuse this one picker
          instead of mounting a second file input. */}
      <input
        ref={inputRef}
        data-brain-upload
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.mp3,.mp4,.wav,.m4a,.ogg,.webm"
        onChange={(e) => void runUpload(e.target.files?.[0])}
      />

      {/* Dragover glow — veronica's .hud-center.is-dragover::after, inset 10px. */}
      {isDragging && (
        <div className="pointer-events-none absolute inset-[10px] z-30 rounded-[18px] border-2 border-dashed border-[#8b93ff8c] bg-[#8b93ff10]" />
      )}

      {/* Spotlight search — floats at the top of the column. */}
      <div className="absolute inset-x-0 top-3 z-20 flex justify-center px-4">
        <div className="flex w-full max-w-sm items-center gap-2 rounded-full border border-[#b98cff5c] bg-[#100e1c8c] px-3 py-1.5 backdrop-blur-[10px]">
          <Search className="size-3.5 shrink-0 text-[#9a9ab6]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your brain…"
            aria-label="Search the brain"
            className="min-w-0 flex-1 bg-transparent text-xs text-[#f3f3fb] placeholder:text-[#9a9ab6] focus:outline-none"
          />
          {query && (
            <>
              <span className="shrink-0 text-[10px] tabular-nums text-[#ffab81]">{hitCount}</span>
              <button onClick={() => setQuery('')} aria-label="Clear search" className="shrink-0 text-[#9a9ab6] hover:text-[#f3f3fb]">
                <X className="size-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Graph canvas */}
      <div className="relative flex h-full min-h-[340px] items-center justify-center">
        {isLoading ? (
          // role="status" so the loading state is announced. The dashboard's
          // document skeletons used to carry this; they are gone, so this is
          // now the HUD's loading announcement.
          <div
            role="status"
            className="flex flex-col items-center gap-3"
            aria-label="Loading brain graph"
          >
            <Loader2 className="size-6 animate-spin text-[#ff7a3c]" />
            <p className="text-xs text-[#9a9ab6]">Building your brain…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <p className="text-sm font-medium text-[#f3f3fb]">Could not load your brain</p>
            <p className="max-w-xs text-xs text-[#9a9ab6]">{error}</p>
          </div>
        ) : (
          <GraphErrorBoundary
            fallback={
              <p className="px-6 text-center text-xs text-[#9a9ab6]">
                This browser can&apos;t render the 3D brain — your data is still safe.
              </p>
            }
          >
            <BrainGraph3D
              nodes={graph.nodes}
              links={graph.links}
              reducedMotion={reducedMotion}
              onNodeOpen={handleNodeOpen}
            />
          </GraphErrorBoundary>
        )}
      </div>

      {/* No documents yet — floats OVER the scene rather than replacing it, so
          the 3D field (the point of the page) stays visible. Sits under the
          search pill, above the node cloud. Same upload path as the drag/drop
          on the section: runUpload → the one data-brain-upload input. */}
      {needsFirstDoc && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-4">
          <div className="pointer-events-auto flex max-w-sm flex-col items-center gap-1.5 rounded-2xl border border-[#b98cff5c] bg-[#100e1c8c] px-6 py-3.5 text-center backdrop-blur-[12px]">
            <p className="text-sm font-medium text-[#f3f3fb]">Your brain has no documents yet</p>
            <p className="text-xs leading-relaxed text-[#9a9ab6]">
              Drop a file here or choose one — every document you study becomes a node.
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#ff7a3c] px-4 py-1.5 text-xs font-semibold text-[#1a1400] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              Upload document
            </button>
          </div>
        </div>
      )}

      {/* Orb state pill and stats strip are withheld until the graph resolves:
          both are absolutely positioned, so hiding them costs no layout, and
          "FILES 0" / "READY" while the request is still in flight is a lie
          the user has no way to tell apart from a genuinely empty account. */}
      {!isLoading && (
        <>
          {/* Orb state pill — veronica's breathing dot + status label. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-[86px] z-20 flex justify-center">
            <div className="inline-flex items-center gap-[9px] rounded-full border border-[#b98cff5c] bg-[#100e1c8c] px-[18px] py-[7px] text-xs font-semibold text-[#f3f3fb] backdrop-blur-[10px]">
              <span
                className={`size-2 rounded-full ${workingCount > 0 ? 'bg-[#ff7a3c]' : 'bg-[#34d36b]'} ${
                  reducedMotion ? '' : 'animate-pulse'
                }`}
                style={{ boxShadow: `0 0 10px ${workingCount > 0 ? '#ff7a3c' : '#34d36b'}` }}
              />
              {workingCount > 0 ? 'PROCESSING' : 'READY'}
            </div>
          </div>

          {/* Stats strip — glass panel, dividers between cells. */}
          <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
            <div
              className="flex gap-1 rounded-[14px] border border-[#b98cff5c] bg-[#100e1c8c] p-[5px] backdrop-blur-[12px]"
              style={{ boxShadow: '0 6px 26px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)' }}
            >
              <Stat num={docs.length} label="FILES" />
              <div className="w-px self-stretch bg-[#b98cff40]" />
              <Stat num={readyCount} label="LEARNED" />
              <div className="w-px self-stretch bg-[#b98cff40]" />
              <Stat num={workingCount} label="LEARNING" />
            </div>
          </div>
        </>
      )}
    </section>
  )
}
