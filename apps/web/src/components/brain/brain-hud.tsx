'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  ChevronRight,
  FileText,
  Headphones,
  Loader2,
  MessagesSquare,
  Notebook,
  PanelLeft,
  PanelRight,
  Upload,
  Video,
  X,
} from 'lucide-react'

import { apiClient } from '@/lib/api'
import { useSessions } from '@/hooks/use-sessions'
import { useDocuments } from '@/hooks/use-documents'
import { useColumnResize } from '@/hooks/use-column-resize'
import { BrainShell } from './brain-shell'
import { BrainHero } from './brain-hero'

/**
 * The brain HUD — veronica's layout: a fixed icon rail, a top bar, and a
 * `br-hud-body` grid whose side columns open on demand. The rail, the top bar
 * and the body grid all come from BrainShell; this file owns what is inside
 * them: the two side columns and the brain graph.
 *
 * Veronica's own rule, kept: both side columns start HIDDEN so the brain owns
 * the screen; they open when the user asks. The centre column is
 * `minmax(0,1fr)` so opening a column can never overflow the viewport.
 */

const ICO36 = { size: 17, strokeWidth: 1.9, 'aria-hidden': true } as const

function docIcon(type: string) {
  if (type === 'audio') return <Headphones className="size-3.5 shrink-0 text-[#d5b5ff]" />
  if (type === 'video') return <Video className="size-3.5 shrink-0 text-[#8fb8ff]" />
  if (type === 'note') return <Notebook className="size-3.5 shrink-0 text-[#7fe0b0]" />
  return <FileText className="size-3.5 shrink-0 text-[#ffab81]" />
}

/**
 * `.br-row` is plain CSS, so it carries no focus ring of its own. These vault
 * rows are the only way keyboard users reach a document, so the ring is added
 * as utilities — the column is dark and the UA default is easy to miss.
 */
const ROW_FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a3c]'

/** A document the user has picked as tutor context. */
export interface PickedDoc {
  id: string
  name: string
  /**
   * The study session this document belongs to. Carried because opening the
   * tutor needs to know whether the picks share one session — the chat API
   * scopes retrieval to a single document OR a single study session, so the
   * picks have to be inspected before a session can be created for them.
   */
  sessionId?: string
}

interface VaultColumnProps {
  onUpload: () => void
  /** ids currently picked — drives each row's checked state. */
  pickedIds: Set<string>
  onTogglePick: (doc: PickedDoc) => void
  /**
   * A session to unfold, set when a session node in the graph is clicked.
   * `nonce` exists so clicking the same session twice still re-opens it —
   * a bare id would compare equal and the effect would not fire again.
   */
  focusSession?: { id: string; nonce: number } | null
}

/** Left column: session → document tree, veronica's VAULT. */
function VaultColumn({ onUpload, pickedIds, onTogglePick, focusSession }: VaultColumnProps) {
  const router = useRouter()
  const { sessions, isLoading } = useSessions()
  const { documents } = useDocuments()
  const [open, setOpen] = useState<Record<string, boolean>>({})

  // Clicking a session node in the graph unfolds that session here, so the
  // node and its documents are both on screen at once.
  useEffect(() => {
    if (!focusSession) return
    setOpen((prev) => (prev[focusSession.id] ? prev : { ...prev, [focusSession.id]: true }))
  }, [focusSession])

  const docsBySession = useMemo(() => {
    const m = new Map<string, typeof documents>()
    for (const d of documents) {
      const key = d.session_id ?? '__orphan'
      const list = m.get(key) ?? []
      list.push(d)
      m.set(key, list)
    }
    return m
  }, [documents])

  // Newest first, 5 max. The dashboard's "Recent Documents" block used to live
  // on the page — the page is gone, so this is where it lives now.
  const recentDocs = useMemo(
    () =>
      [...documents]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
    [documents],
  )

  return (
    <aside className="br-column" style={{ borderRight: '1px solid var(--br-border)' }}>
      <div className="br-column-head">
        <span>VAULT</span>
        <button
          onClick={onUpload}
          aria-label="Upload document"
          style={{
            background: 'transparent',
            border: 0,
            color: 'var(--br-text3)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <Upload className="size-3.5" />
        </button>
      </div>

      <div className="br-scroll" style={{ padding: '6px 8px 12px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <Loader2 className="size-4 animate-spin" style={{ color: 'var(--br-accent)' }} />
          </div>
        ) : sessions.length === 0 ? (
          <p style={{ padding: '24px 8px', textAlign: 'center', fontSize: 12, color: 'var(--br-text3)' }}>
            No study spaces yet. Upload a document to start.
          </p>
        ) : (
          sessions.map((s) => {
            const docs = docsBySession.get(s.id) ?? []
            const isOpen = open[s.id] ?? false
            return (
              <div key={s.id} style={{ marginBottom: 2 }}>
                <button
                  className={`br-row ${ROW_FOCUS}`}
                  aria-expanded={isOpen}
                  onClick={() => setOpen((p) => ({ ...p, [s.id]: !isOpen }))}
                >
                  <ChevronRight
                    className="size-3.5 shrink-0"
                    style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}
                  />
                  <span className="br-row-label">{s.name}</span>
                  <span className="br-row-meta">{docs.length}</span>
                </button>

                {isOpen &&
                  (docs.length === 0 ? (
                    <p style={{ padding: '4px 8px 4px 28px', fontSize: 10, color: 'var(--br-text3)' }}>
                      empty
                    </p>
                  ) : (
                    docs.map((d) => {
                      const picked = pickedIds.has(d.id)
                      return (
                        <button
                          key={d.id}
                          className={`br-row ${ROW_FOCUS}${picked ? ' is-selected' : ''}`}
                          style={{ paddingLeft: 28 }}
                          aria-pressed={picked}
                          onClick={() => onTogglePick({ id: d.id, name: d.name, sessionId: s.id })}
                        >
                          {docIcon(d.type)}
                          <span className="br-row-label">{d.name}</span>
                          {d.status !== 'ready' && <span className="br-row-meta">{d.status}</span>}
                          {picked && <Check className="size-3.5 shrink-0" style={{ color: 'var(--br-accent)' }} />}
                        </button>
                      )
                    })
                  ))}
              </div>
            )
          })
        )}

        {/* RECENT — the dashboard's recent-documents list, relocated into the
            vault. Renders nothing at all when there are no documents: the
            session tree's own empty state already says it. */}
        {recentDocs.length > 0 && (
          <>
            <div className="br-section">RECENT</div>
            {recentDocs.map((d) => {
              const picked = pickedIds.has(d.id)
              return (
                <button
                  key={d.id}
                  className={`br-row ${ROW_FOCUS}${picked ? ' is-selected' : ''}`}
                  aria-pressed={picked}
                  onClick={() => onTogglePick({ id: d.id, name: d.name, sessionId: d.session_id ?? undefined })}
                >
                  {docIcon(d.type)}
                  <span className="br-row-label">{d.name}</span>
                  {d.status !== 'ready' && <span className="br-row-meta">{d.status}</span>}
                  {picked && <Check className="size-3.5 shrink-0" style={{ color: 'var(--br-accent)' }} />}
                </button>
              )
            })}
          </>
        )}
      </div>
    </aside>
  )
}

interface ChatColumnProps {
  picked: PickedDoc[]
  onUnpick: (id: string) => void
  onClear: () => void
}

/** Right column: tutor entry point, veronica's chat/summary column. */
function ChatColumn({ picked, onUnpick, onClear }: ChatColumnProps) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  /**
   * Opening the tutor CREATES the chat session first, then navigates to it, so
   * the conversation is already bound to what was picked rather than starting
   * empty and hoping the picks survive the trip.
   *
   * The scope has to be one thing: the chat API retrieves from a single
   * document or a single study session. So:
   *   one pick            -> scoped to that document
   *   picks, one session  -> scoped to the session (all its documents)
   *   picks, many sessions-> a plain tutor session; the names still travel as
   *                          `?docs=` and reach the model as course context
   */
  const ask = useCallback(async () => {
    if (creating) return
    setCreating(true)
    setCreateError(null)
    try {
      const sessionIds = new Set(picked.map((d) => d.sessionId).filter(Boolean))
      const target =
        picked.length === 1
          ? { type: 'document_chat', documentId: picked[0].id }
          : sessionIds.size === 1
            ? { type: 'document_chat', sessionId: [...sessionIds][0] as string }
            : { type: 'tutor' }

      const session = await apiClient.post<{ id: string }>('/chat/sessions', target)

      const params = new URLSearchParams()
      params.set('session', session.id)
      if (q.trim()) params.set('q', q.trim())
      if (picked.length > 0) params.set('docs', picked.map((d) => d.id).join(','))
      router.push(`/tutor?${params.toString()}`)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not open the tutor')
      setCreating(false)
    }
  }, [creating, picked, q, router])

  return (
    <aside className="br-column" style={{ borderLeft: '1px solid var(--br-border)' }}>
      <div className="br-column-head">
        <span>ASK YOUR BRAIN</span>
        {picked.length > 0 && (
          <button
            onClick={onClear}
            style={{
              background: 'transparent',
              border: 0,
              color: 'var(--br-text3)',
              cursor: 'pointer',
              fontSize: 10,
              letterSpacing: '.04em',
              padding: 4,
            }}
          >
            CLEAR
          </button>
        )}
      </div>

      <div className="br-scroll" style={{ padding: 12 }}>
        {/* The picks, echoed back. Without this the vault's checkmarks are the
            only feedback, and they scroll out of view in a long tree. */}
        {picked.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '.04em',
                color: 'var(--br-text3)',
                marginBottom: 6,
              }}
            >
              {picked.length} {picked.length === 1 ? 'DOCUMENT' : 'DOCUMENTS'} SELECTED
            </div>
            <ul
              style={{ display: 'flex', flexWrap: 'wrap', gap: 6, listStyle: 'none', margin: 0, padding: 0 }}
            >
              {picked.map((d) => (
                <li key={d.id}>
                  <span className="br-chip">
                    <FileText className="size-3 shrink-0" aria-hidden />
                    <span
                      style={{
                        maxWidth: 140,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {d.name}
                    </span>
                    <button
                      onClick={() => onUnpick(d.id)}
                      aria-label={`Remove ${d.name} from context`}
                      style={{
                        background: 'transparent',
                        border: 0,
                        color: 'inherit',
                        cursor: 'pointer',
                        display: 'flex',
                        padding: 0,
                      }}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <textarea
          className="br-field"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ask()
          }}
          rows={4}
          placeholder="Ask anything about your documents…"
          aria-label="Question for the AI Tutor"
          style={{ resize: 'none' }}
        />
        <button
          className="br-btn-accent"
          style={{ marginTop: 8 }}
          onClick={ask}
          disabled={creating}
          aria-busy={creating}
        >
          {creating ? <Loader2 className="size-3.5 animate-spin" /> : <MessagesSquare className="size-3.5" />}
          {creating ? 'Opening…' : 'Open AI Tutor'}
        </button>
        {createError && (
          <p role="alert" style={{ marginTop: 8, fontSize: 11, color: '#ff8a8a' }}>
            {createError}
          </p>
        )}
        <p style={{ marginTop: 8, fontSize: 10, lineHeight: 1.6, color: 'var(--br-text3)' }}>
          {picked.length > 0
            ? `The tutor will focus on the ${picked.length === 1 ? 'document' : `${picked.length} documents`} you picked in the vault.`
            : 'Pick documents in the vault to focus the tutor, or ask about everything you have uploaded.'}{' '}
          Ctrl/⌘+Enter to send.
        </p>
      </div>
    </aside>
  )
}

export function BrainHud({ onUpload }: { onUpload: (file: File) => Promise<void> }) {
  const { setBodyEl, startDrag, resetDrag } = useColumnResize()
  // The vault is the way into everything else, so it starts OPEN — it used to
  // start hidden, which left a first-time user with nothing to click.
  const [vaultOpen, setVaultOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(false)
  const [picked, setPicked] = useState<PickedDoc[]>([])
  // Which session the vault should unfold, and a counter so a repeat click on
  // the same node still counts as a new request.
  const [focusSession, setFocusSession] = useState<{ id: string; nonce: number } | null>(null)

  const pickedIds = useMemo(() => new Set(picked.map((d) => d.id)), [picked])

  // Picking a document is what opens the ask column — the picks are only
  // visible there, so selecting with it closed would look like nothing
  // happened. Unpicking the last one does NOT close it again; that would yank
  // the column out from under the cursor mid-edit.
  const togglePick = useCallback((doc: PickedDoc) => {
    setPicked((prev) =>
      prev.some((d) => d.id === doc.id) ? prev.filter((d) => d.id !== doc.id) : [...prev, doc],
    )
    setRightOpen(true)
  }, [])

  // Selecting from the GRAPH, unlike a vault row, must not toggle off: the
  // node's dot stays where it is, so a second click would look like it did
  // nothing while silently dropping the document from the tutor's context.
  const selectDoc = useCallback((doc: PickedDoc) => {
    setPicked((prev) => (prev.some((d) => d.id === doc.id) ? prev : [...prev, doc]))
    setRightOpen(true)
  }, [])

  /**
   * A node click is answered where the user is looking: a session unfolds in
   * the vault on the left, a document is picked into the ask column on the
   * right. Returns whether it was handled in place — concepts fall through to
   * brain-hero's own navigation (they open the tutor with the concept as the
   * question, which has no in-page equivalent).
   */
  const handleNodeSelect = useCallback(
    (node: { id: string; kind: string; label: string; sessionId?: string; docType?: string; status?: string }): boolean => {
      if (node.kind === 'document') {
        selectDoc({
          id: node.id,
          name: node.label,
          sessionId: node.sessionId,
        })
        return true
      }
      if (node.kind === 'session') {
        setVaultOpen(true)
        setFocusSession((prev) => ({ id: node.id, nonce: (prev?.nonce ?? 0) + 1 }))
        return true
      }
      if (node.kind === 'core') {
        setVaultOpen(true)
        return true
      }
      return false
    },
    [selectDoc],
  )

  const unpick = useCallback((id: string) => {
    setPicked((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const clearPicks = useCallback(() => setPicked([]), [])

  // The VAULT header button borrows brain-hero's single file input.
  const pickFile = useCallback(() => {
    document.querySelector<HTMLInputElement>('input[data-brain-upload]')?.click()
  }, [])

  // No `is-scroll`: this body is a grid whose columns scroll themselves.
  const bodyClass = [vaultOpen ? 'is-vault-open' : '', rightOpen ? 'is-right-open' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <BrainShell
      bodyClassName={bodyClass}
      bodyRef={setBodyEl}
      // The column toggles only exist where the columns do.
      topBarExtra={
        <>
          <button
            className={`br-rail-item${vaultOpen ? ' is-active' : ''}`}
            style={{ width: 36, height: 36, borderRadius: 10 }}
            onClick={() => setVaultOpen((v) => !v)}
            aria-pressed={vaultOpen}
            aria-label="Toggle vault column"
          >
            <PanelLeft {...ICO36} />
          </button>
          <button
            className={`br-rail-item${rightOpen ? ' is-active' : ''}`}
            style={{ width: 36, height: 36, borderRadius: 10 }}
            onClick={() => setRightOpen((v) => !v)}
            aria-pressed={rightOpen}
            aria-label="Toggle ask column"
          >
            <PanelRight {...ICO36} />
          </button>
        </>
      }
    >
      {vaultOpen && (
        <>
          <VaultColumn
            onUpload={pickFile}
            pickedIds={pickedIds}
            onTogglePick={togglePick}
            focusSession={focusSession}
          />
          <div
            className="br-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize vault column"
            onPointerDown={(e) => startDrag('vault', e)}
            onDoubleClick={() => resetDrag('vault')}
          />
        </>
      )}

      {/* No padding: the card supplies its own border, and BrainHero fills
          this box edge-to-edge so its overlays sit against the card's edge. */}
      <div className="br-dropzone" style={{ minHeight: 0, overflow: 'hidden' }}>
        <BrainHero onUpload={onUpload} onNodeSelect={handleNodeSelect} />
      </div>

      {rightOpen && (
        <>
          <div
            className="br-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize ask column"
            onPointerDown={(e) => startDrag('right', e)}
            onDoubleClick={() => resetDrag('right')}
          />
          <ChatColumn picked={picked} onUnpick={unpick} onClear={clearPicks} />
        </>
      )}
    </BrainShell>
  )
}
