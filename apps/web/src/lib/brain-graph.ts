/**
 * Pure adapter: /brain/graph API response → data for ForceGraph3D.
 * No React, no DOM — untrusted/absent input in, clean graph out.
 * Mirrors lib/mindmap-layout.ts's "sanitize at the boundary" pattern.
 */

export interface BrainApiResponseNode {
  id?: string
  kind?: string
  label?: string
  docType?: string
  status?: string
  sessionId?: string
  val?: number
}

export interface BrainApiResponseLink {
  source?: string
  target?: string
  kind?: string
}

export interface BrainApiResponse {
  nodes?: BrainApiResponseNode[]
  links?: BrainApiResponseLink[]
}

export interface BrainGraphNode {
  id: string
  kind: 'core' | 'session' | 'document' | 'concept'
  label: string
  val: number
  color: string
  sessionId?: string
  status?: string
  /**
   * Starting position, when a caller already knows one. The mind-map adapter
   * lays out every node (a mind map is read by its ranks), so it sets x/y/z and
   * pins them below. The dashboard's brain leaves both unset and lets the
   * simulation arrange it.
   */
  x?: number
  y?: number
  z?: number
  /** Pin, so the simulation cannot drag a placed node off its slot. */
  fx?: number
  fy?: number
  fz?: number
}

export interface BrainGraphLink {
  source: string
  target: string
  /**
   * Optional edge class, read by BrainGraph3D for link distance and trunk
   * styling. buildGraphData leaves it unset (every dashboard link is a trunk
   * or a plain edge); the mind-map adapter sets it per depth.
   */
  kind?: string
}

export interface BuildGraphDataOptions {
  maxNodes: number
  isDark: boolean
  /**
   * Spotlight search, veronica semantics — the distinction matters:
   *   null      = not searching, every node at full brightness
   *   empty Set = searching with no hits, every node dimmed
   * Collapsing null into an empty Set makes an idle graph look dead.
   */
  highlightIds?: Set<string> | null
}

/** Veronica's dim level for nodes outside the spotlight. */
const DIM_ALPHA = '26'

/** Veronica's core accent (--ln-accent), not athora's purple brand. */
const CORE_COLOR = '#ff7a3c'

/**
 * Veronica's CAT_COLORS_DARK. Sessions cycle through it and their documents
 * inherit the session's colour — that shared hue per cluster is what makes the
 * nebula read as groups instead of confetti.
 */
const CAT_COLORS = [
  '#8b93ff', '#3fdc9a', '#f0a24a', '#ff7a9c', '#4aa8ff', '#b98cff',
  '#f0c853', '#5ad1c4', '#e07ad1', '#7ed957', '#ff9f6b', '#9fb0cf',
]

const PROCESSING_STATUSES = new Set(['uploading', 'processing', 'parsing'])

/** Status overrides the cluster hue; otherwise the document wears it. */
function documentColor(base: string, status: string | undefined): string {
  if (status === 'failed' || status === 'error') return '#a8a29e'
  // Still-working docs render half-faded.
  return PROCESSING_STATUSES.has(status ?? '') ? `${base}80` : base
}

function clampId(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function clampLabel(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.slice(0, 80) : fallback
}

/**
 * Prune order when over maxNodes: concepts first, then oldest documents.
 * Core and sessions are never dropped — a hub without its sessions is noise,
 * but a session without its hub is a broken graph.
 */
export function buildGraphData(
  response: BrainApiResponse | null,
  opts: BuildGraphDataOptions,
): { nodes: BrainGraphNode[]; links: BrainGraphLink[] } {
  if (!response || !Array.isArray(response.nodes)) {
    return { nodes: [], links: [] }
  }

  const cores = response.nodes.filter((n) => n.kind === 'core')
  const sessions = response.nodes.filter((n) => n.kind === 'session')
  const documents = response.nodes.filter((n) => n.kind === 'document')
  const concepts = response.nodes.filter((n) => n.kind === 'concept')

  const conceptBudget = Math.max(0, opts.maxNodes - cores.length - sessions.length - documents.length)

  const kept = new Set<string>()
  const nodes: BrainGraphNode[] = []

  for (const c of cores) {
    const id = clampId(c.id)
    if (!id) continue
    kept.add(id)
    nodes.push({
      id,
      kind: 'core',
      label: clampLabel(c.label, 'My Brain'),
      val: c.val ?? 40,
      color: CORE_COLOR,
      fx: 0,
      fy: 0,
      fz: 0,
    })
  }

  // Each session owns a hue; its documents borrow it so clusters read as groups.
  const hueBySession = new Map<string, string>()
  let hueIndex = 0
  for (const s of sessions) {
    const id = clampId(s.id)
    if (!id || kept.has(id)) continue
    kept.add(id)
    const hue = CAT_COLORS[hueIndex++ % CAT_COLORS.length]
    hueBySession.set(id, hue)
    nodes.push({
      id,
      kind: 'session',
      label: clampLabel(s.label, 'Session'),
      val: s.val ?? 8,
      color: hue,
      status: s.status,
    })
  }

  // Oldest documents drop first when still over budget.
  const docBudget = Math.max(0, opts.maxNodes - nodes.length)
  for (const d of documents.slice(0, docBudget)) {
    const id = clampId(d.id)
    if (!id || kept.has(id)) continue
    kept.add(id)
    nodes.push({
      id,
      kind: 'document',
      label: clampLabel(d.label, 'Document'),
      val: d.val ?? 3,
      color: documentColor(hueBySession.get(d.sessionId ?? '') ?? '#9fb0cf', d.status),
      sessionId: clampId(d.sessionId) ?? undefined,
      status: d.status,
    })
  }

  for (const c of concepts.slice(0, conceptBudget)) {
    const id = clampId(c.id)
    if (!id || kept.has(id)) continue
    kept.add(id)
    nodes.push({
      id,
      kind: 'concept',
      label: clampLabel(c.label, 'Concept'),
      val: c.val ?? 1,
      color: opts.isDark ? '#a8a29e' : '#57534e',
      sessionId: clampId(c.sessionId) ?? undefined,
    })
  }

  // Spotlight: one pass at the end rather than a branch at every push site.
  // The core stays lit — it is the anchor, dimming it just looks broken.
  if (opts.highlightIds) {
    const lit = opts.highlightIds
    for (const n of nodes) {
      if (n.kind === 'core' || lit.has(n.id)) continue
      // Strip any existing alpha suffix before adding the dim one.
      n.color = `${n.color.slice(0, 7)}${DIM_ALPHA}`
    }
  }

  // Links survive only when both endpoints were kept.
  const links: BrainGraphLink[] = []
  if (Array.isArray(response.links)) {
    for (const l of response.links) {
      const source = clampId(l.source)
      const target = clampId(l.target)
      if (!source || !target) continue
      if (!kept.has(source) || !kept.has(target)) continue
      if (source === target) continue
      links.push({ source, target })
    }
  }

  return { nodes, links }
}
