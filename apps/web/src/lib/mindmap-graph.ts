/**
 * Adapter from the generator's raw mind-map payload onto the graph shape the
 * nebula renderer consumes.
 *
 * Two payload shapes exist and both must land in the same place: a FLAT list
 * where the hierarchy lives only in `parentId` (what the generator and
 * seed-brain.mjs emit), and the same list carrying an explicit `edges` array.
 * When both are present `parentId` wins, so the two shapes cannot diverge.
 *
 * The layout is radial. Rank distance from the core is fixed per depth, so the
 * map reads as concentric layers rather than as a pile of cards, and every node
 * is pinned — a map is read by its ranks, and a node left to the simulation is
 * a node that can land on top of another one.
 */

export interface MindMapRawNode {
  id?: string
  label?: string
  parentId?: string
}

export interface MindMapRawEdge {
  source: string
  target: string
}

export interface MindMapGraphOptions {
  maxNodes?: number
}

export type MindMapNodeKind = 'core' | 'session' | 'document' | 'concept'
export type MindMapLinkKind = 'trunk' | 'branch'

export interface MindMapGraphNode {
  id: string
  label: string
  kind: MindMapNodeKind
  color: string
  x: number
  y: number
  fx: number
  fy: number
  fz: number
  /**
   * Node weight, in the same units BrainGraphNode uses: the renderer derives
   * both the halo and the centre mark from it (`1 + min(val,40)/60`), so a
   * missing value makes those NaN and the node draws at no size at all — an
   * empty canvas with a perfectly valid graph behind it.
   */
  val: number
}

export interface MindMapGraphLink {
  source: string
  target: string
  kind: MindMapLinkKind
}

export interface MindMapGraph {
  nodes: MindMapGraphNode[]
  links: MindMapGraphLink[]
}

const KIND_BY_DEPTH: MindMapNodeKind[] = [
  'core',
  'session',
  'document',
  'concept',
]

/**
 * Weight per rank, mirroring the ladder buildGraphData uses for the dashboard
 * (lib/brain-graph.ts: core 40, session 8, document 3, concept 1). The renderer
 * scales each node's halo and centre mark by `1 + min(val,40)/60`, so these
 * values are what make a map's root read as heavier than its leaves. They must
 * be present: an undefined val propagates into that arithmetic and the node
 * draws at no size at all.
 */
const WEIGHT_BY_KIND: Record<MindMapNodeKind, number> = {
  core: 40,
  session: 8,
  document: 3,
  concept: 1,
}

/**
 * Distance between neighbouring ranks. Two ranks span 1040px, which clears the
 * narrowest canvas the session view hands the map without pushing the outer
 * rank off-screen.
 */
const RANK_STEP = 260
const ROW_STEP = 96

const CORE_COLOR = '#ffd9b0'

/**
 * One hue per top-level branch, passed down its whole subtree so a branch reads
 * as a colour rather than as a set of unrelated cards.
 */
const BRANCH_COLORS = [
  '#ff7a3c',
  '#8b5cf6',
  '#3fdc9a',
  '#4aa8ff',
  '#f0a24a',
  '#ff7a9c',
  '#f0c853',
  '#5ad1c4',
  '#e07ad1',
  '#7ed957',
]

const EMPTY: MindMapGraph = { nodes: [], links: [] }

export function buildMindMapGraph(
  raw: MindMapRawNode[] | null | undefined,
  edges?: MindMapRawEdge[],
  options?: MindMapGraphOptions,
): MindMapGraph {
  if (!raw || raw.length === 0) return EMPTY

  // --- Keep only addressable nodes, preserving the order they were emitted in.
  // That order is what makes the layout deterministic, and what makes a payload
  // carrying edges lay out identically to the same payload without them.
  const label = new Map<string, string>()
  const order: string[] = []
  const declaredParent = new Set<string>()

  for (const node of raw) {
    const id = node?.id
    if (!id || label.has(id)) continue
    label.set(id, node.label ?? id)
    order.push(id)
    if (node.parentId) declaredParent.add(id)
  }

  if (order.length === 0) return EMPTY

  const known = new Set(order)

  // --- Resolve parents. A declared parentId is authoritative; edges only fill
  // in for nodes that declared nothing, so supplying edges can never move a
  // node that already knows where it belongs.
  const parent = new Map<string, string>()

  for (const node of raw) {
    const id = node?.id
    if (!id) continue
    const p = node.parentId
    if (p && p !== id && known.has(p)) parent.set(id, p)
  }

  for (const edge of edges ?? []) {
    const source = edge?.source
    const target = edge?.target
    if (!source || !target) continue
    // A self-edge is not a parent, and an edge whose endpoint was never emitted
    // has nothing to attach to.
    if (source === target) continue
    if (!known.has(source) || !known.has(target)) continue
    if (declaredParent.has(target) || parent.has(target)) continue
    parent.set(target, source)
  }

  const childrenOf = (): Map<string, string[]> => {
    const out = new Map<string, string[]>()
    for (const id of order) {
      const p = parent.get(id)
      if (!p) continue
      const list = out.get(p)
      if (list) list.push(id)
      else out.set(p, [id])
    }
    return out
  }

  const reachable = (
    from: string,
    children: Map<string, string[]>,
  ): Set<string> => {
    const seen = new Set<string>([from])
    const pending = [from]
    while (pending.length > 0) {
      const id = pending.shift() as string
      for (const child of children.get(id) ?? []) {
        if (seen.has(child)) continue
        seen.add(child)
        pending.push(child)
      }
    }
    return seen
  }

  // --- Pick the core. It is the parentless node that reaches the most of the
  // map. A payload whose nodes all sit inside a cycle has no parentless node at
  // all, so the first one is promoted and its own parent link broken rather
  // than letting the walk re-enter it forever.
  let rootId: string | undefined
  {
    const children = childrenOf()
    let best: { id: string; size: number } | null = null
    for (const id of order) {
      if (parent.has(id)) continue
      const size = reachable(id, children).size
      if (!best || size > best.size) best = { id, size }
    }
    rootId = best?.id ?? order[0]
  }

  if (parent.has(rootId)) parent.delete(rootId)

  let children = childrenOf()

  // --- Depth from the core, breadth first so one rank is one whole column.
  const depth = new Map<string, number>([[rootId, 0]])
  const pending: string[] = [rootId]
  while (pending.length > 0) {
    const id = pending.shift() as string
    for (const child of children.get(id) ?? []) {
      if (depth.has(child)) continue
      depth.set(child, (depth.get(id) as number) + 1)
      pending.push(child)
    }
  }

  // --- Anything the core cannot reach still has to render. It becomes a branch
  // of its own off the core rather than a node the map silently drops.
  for (const id of order) {
    if (id === rootId || depth.has(id)) continue
    const previous = parent.get(id)
    if (previous) {
      const siblings = children.get(previous)
      if (siblings) children.set(previous, siblings.filter((c) => c !== id))
    }
    parent.set(id, rootId)
    const rootChildren = children.get(rootId) ?? []
    rootChildren.push(id)
    children.set(rootId, rootChildren)
    depth.set(id, 1)
  }

  // --- Trim to the budget, deepest first, so nothing is dropped while one of
  // its own descendants survives.
  let kept = order.filter((id) => depth.has(id))
  const maxNodes = options?.maxNodes
  if (maxNodes && maxNodes > 0 && kept.length > maxNodes) {
    const deepestFirst = [...kept].sort(
      (a, b) => (depth.get(b) as number) - (depth.get(a) as number),
    )
    const dropped = new Set(deepestFirst.slice(0, kept.length - maxNodes))
    kept = kept.filter((id) => !dropped.has(id))
    for (const id of kept) {
      const p = parent.get(id)
      if (!p || dropped.has(p)) parent.set(id, rootId)
    }
  }

  const keptSet = new Set(kept)
  children = new Map()
  for (const id of kept) {
    const p = parent.get(id)
    if (!p || !keptSet.has(p)) continue
    const list = children.get(p)
    if (list) list.push(id)
    else children.set(p, [id])
  }

  // --- Colour: each top-level branch takes a hue and paints its whole subtree
  // with it; the core keeps its own.
  const branchOf = new Map<string, number>()
  const colorOf = new Map<string, string>()
  ;(children.get(rootId) ?? []).forEach((branchId, index) => {
    branchOf.set(branchId, index)
    colorOf.set(branchId, BRANCH_COLORS[index % BRANCH_COLORS.length])
  })
  for (const id of kept) {
    if (id === rootId || colorOf.has(id)) continue
    const p = parent.get(id)
    const branch = p ? branchOf.get(p) : undefined
    if (branch === undefined) continue
    colorOf.set(id, BRANCH_COLORS[branch % BRANCH_COLORS.length])
    branchOf.set(id, branch)
  }

  // --- Rows. A post-order walk hands each leaf the next row and a parent takes
  // the mean of its children, which keeps a subtree's cards clustered around the
  // branch that owns them.
  const rowIndex = new Map<string, number>()
  const walked = new Set<string>()
  let nextRow = 0

  const assignRows = (id: string): number => {
    const cached = rowIndex.get(id)
    if (cached !== undefined) return cached
    if (walked.has(id)) return 0
    walked.add(id)

    const kids = children.get(id) ?? []
    let row: number
    if (kids.length === 0) {
      row = nextRow
      nextRow += 1
    } else {
      const rows = kids.map(assignRows)
      row = rows.reduce((sum, value) => sum + value, 0) / rows.length
    }

    rowIndex.set(id, row)
    return row
  }

  assignRows(rootId)

  // Centred on the core's own row, so the map frames on the core with the ranks
  // spread symmetrically either side of it.
  const centre = rowIndex.get(rootId) ?? 0

  // Branches alternate sides so both lanes are used; a single column would be
  // twice as tall as the canvas.
  const sideOf = new Map<string, number>([[rootId, 0]])
  ;(children.get(rootId) ?? []).forEach((branchId, index) => {
    sideOf.set(branchId, index % 2 === 0 ? 1 : -1)
  })
  for (const id of kept) {
    if (sideOf.has(id)) continue
    const p = parent.get(id)
    const inherited = p ? sideOf.get(p) : undefined
    if (inherited !== undefined) sideOf.set(id, inherited)
  }

  const nodes: MindMapGraphNode[] = [...kept]
    .sort((a, b) => (depth.get(a) as number) - (depth.get(b) as number))
    .map((id) => {
      const d = depth.get(id) as number
      const x = (sideOf.get(id) ?? 1) * d * RANK_STEP
      const y = ((rowIndex.get(id) ?? centre) - centre) * ROW_STEP
      const kind = KIND_BY_DEPTH[Math.min(d, KIND_BY_DEPTH.length - 1)]
      return {
        id,
        label: label.get(id) as string,
        kind,
        color:
          id === rootId ? CORE_COLOR : colorOf.get(id) ?? BRANCH_COLORS[0],
        x,
        y,
        // Pinned — the layout owns placement, the simulation does not get a say.
        fx: x,
        fy: y,
        fz: 0,
        // Required by BrainGraphNode, and load-bearing: the renderer's halo and
        // mark scale derive from it.
        val: WEIGHT_BY_KIND[kind],
      }
    })

  const links: MindMapGraphLink[] = []
  for (const id of kept) {
    if (id === rootId) continue
    const p = parent.get(id)
    if (!p || !keptSet.has(p)) continue
    links.push({
      source: p,
      target: id,
      // The core's own spokes are the trunk the branches hang off; anything
      // deeper is a branch of a branch.
      kind: (depth.get(id) as number) <= 1 ? 'trunk' : 'branch',
    })
  }

  return { nodes, links }
}
