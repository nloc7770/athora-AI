import { describe, it, expect } from 'vitest'
import { buildMindMapGraph } from '../mindmap-graph'
import type { MindMapRawNode } from '../mindmap-graph'

/**
 * The shape the generator actually emits, and the shape seed-brain.mjs
 * writes: a FLAT list where the hierarchy lives only in parentId — no `edges`
 * array at all. Root + 4 branches x 5 concepts, i.e. one connection per
 * non-root node, which is the map the session header counts.
 */
function flatSeedGraph(): MindMapRawNode[] {
  const nodes: MindMapRawNode[] = [{ id: 'root', label: 'Cognitive Psychology' }]
  for (let c = 0; c < 4; c += 1) {
    nodes.push({ id: `c${c}`, label: `Chapter ${c + 1}: memory and attention`, parentId: 'root' })
    for (let k = 0; k < 5; k += 1) {
      nodes.push({ id: `c${c}-${k}`, label: `Concept ${c}.${k}`, parentId: `c${c}` })
    }
  }
  return nodes
}

function depthOf(flowNodes: { id: string }[], nodes: MindMapRawNode[]): Map<string, number> {
  const parentOf = new Map(nodes.map((n) => [n.id!, n.parentId]))
  const depth = new Map<string, number>()
  const walk = (id: string): number => {
    const cached = depth.get(id)
    if (cached !== undefined) return cached
    const parent = parentOf.get(id)
    const d = parent ? walk(parent) + 1 : 0
    depth.set(id, d)
    return d
  }
  flowNodes.forEach((n) => walk(n.id))
  return depth
}

describe('buildMindMapGraph', () => {
  it('returns an empty graph for absent or unusable input', () => {
    expect(buildMindMapGraph(null)).toEqual({ nodes: [], links: [] })
    expect(buildMindMapGraph([])).toEqual({ nodes: [], links: [] })
    // Every id missing → nothing addressable to render.
    expect(buildMindMapGraph([{ label: 'no id' }])).toEqual({ nodes: [], links: [] })
  })

  it('maps tree depth onto node kind and places every node', () => {
    const { nodes } = buildMindMapGraph(
      [
        { id: 'r', label: 'Root' },
        { id: 'b', label: 'Branch' },
        { id: 'd', label: 'Sub' },
        { id: 'l', label: 'Leaf' },
      ],
      [
        { source: 'r', target: 'b' },
        { source: 'b', target: 'd' },
        { source: 'd', target: 'l' },
      ],
    )

    expect(nodes.map((n) => n.kind)).toEqual(['core', 'session', 'document', 'concept'])
    // The core is the one node the layout itself puts on the origin.
    expect(nodes[0]).toMatchObject({ x: 0, y: 0, fx: 0, fy: 0, fz: 0 })
    // A mind map is read by its ranks, so the whole map is placed and pinned;
    // a node left to the simulation is a node that can land on another card.
    expect(nodes.every((n) => typeof n.fx === 'number' && typeof n.fy === 'number')).toBe(true)
    expect(nodes.every((n) => n.fz === 0)).toBe(true)
  })

  it('lays a flat parentId-only node list out with distinct positions', () => {
    const raw = flatSeedGraph()
    const { nodes } = buildMindMapGraph(raw)

    expect(nodes).toHaveLength(raw.length)
    // One connection per non-root node — the header's "N connections".
    expect(raw.filter((n) => n.parentId)).toHaveLength(raw.length - 1)

    // The bug: every node collapsed onto one point, so the cards stacked into
    // an unreadable pile. No two nodes may share a position.
    const seen = new Set(nodes.map((n) => `${n.x},${n.y}`))
    expect(seen.size).toBe(nodes.length)

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i]
        const b = nodes[j]
        expect(a.x === b.x && a.y === b.y).toBe(false)
      }
    }

    // A pile is not merely two nodes agreeing: the map has to be spread out.
    // Siblings occupy distinct rows and the map spans a real width.
    expect(new Set(nodes.map((n) => n.y)).size).toBeGreaterThan(nodes.length / 3)
    expect(new Set(nodes.map((n) => n.x)).size).toBeGreaterThan(1)
    const xs = nodes.map((n) => n.x ?? 0)
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(600)
  })

  it('increases distance from the root along one axis as depth grows', () => {
    const raw = flatSeedGraph()
    const { nodes } = buildMindMapGraph(raw)
    const depth = depthOf(nodes, raw)

    // The layout must express hierarchy: a node sits farther out along X than
    // its parent does. Otherwise depth is not readable at all.
    const out = (id: string) => Math.abs(nodes.find((n) => n.id === id)!.x ?? 0)
    for (const node of nodes) {
      const parent = raw.find((n) => n.id === node.id)?.parentId
      if (!parent) continue
      expect(out(node.id)).toBeGreaterThan(out(parent))
    }

    // Depth advances along X and is strictly monotonic: every node of a rank
    // is the same distance out from the centre, one rank is wider than the
    // last, and the map is mirrored so branch subtrees stay disjoint. That is
    // what makes the map read as layers rather than a pile.
    const atRank = (d: number) =>
      nodes.filter((n) => depth.get(n.id) === d).map((n) => Math.abs(n.x ?? 0))
    const rank1 = atRank(1)
    const rank2 = atRank(2)

    expect(rank1).toHaveLength(4)
    expect(rank2).toHaveLength(20)
    // One rank == one column: within a rank the distance out is the same for
    // every node, and each rank is farther out than the one before it.
    for (const values of [rank1, rank2]) {
      values.forEach((value) => expect(value).toBeCloseTo(values[0], 5))
    }
    expect(rank1[0]).toBeGreaterThan(0)
    expect(rank2[0]).toBeGreaterThan(rank1[0])

    // Both lanes are used: a single column would be twice as tall as the
    // canvas, which is what pushed the map off-screen on narrow viewports.
    const leaves = nodes.filter((n) => depth.get(n.id) === 2)
    expect(leaves.some((n) => (n.x ?? 0) > 0)).toBe(true)
    expect(leaves.some((n) => (n.x ?? 0) < 0)).toBe(true)

    // And it is centred on the origin, which is what the renderer frames.
    const xs = nodes.map((n) => n.x ?? 0)
    const ys = nodes.map((n) => n.y ?? 0)
    expect(Math.max(...xs) + Math.min(...xs)).toBeCloseTo(0, 5)
    expect(Math.max(...ys) + Math.min(...ys)).toBeCloseTo(0, 5)
  })

  it('lays out the same flat list identically when given explicit edges', () => {
    const raw = flatSeedGraph()
    // `id`/`parentId` are optional on the raw shape (the adapter tolerates
    // partial payloads), and a `.filter` does not narrow that for the compiler.
    // The filter is the narrowing: every row kept here has both.
    const edges = raw
      .filter((n) => n.parentId)
      .map((n) => ({ source: n.parentId as string, target: n.id as string }))

    const positions = (g: { nodes: { id: string; x?: number; y?: number }[] }) =>
      g.nodes.map((n) => `${n.id}@${n.x},${n.y}`)

    // The two generator shapes must not diverge: a map regenerated with edges
    // has to land in the same place as the same map without them.
    expect(positions(buildMindMapGraph(raw, edges))).toEqual(positions(buildMindMapGraph(raw)))
  })

  it('gives each top-level branch its own hue and passes it down the subtree', () => {
    const { nodes } = buildMindMapGraph([
      { id: 'r', label: 'Root' },
      { id: 'a', label: 'A', parentId: 'r' },
      { id: 'b', label: 'B', parentId: 'r' },
      { id: 'a1', label: 'A1', parentId: 'a' },
    ])

    const hue = (id: string) => nodes.find((n) => n.id === id)!.color.slice(0, 7)
    expect(hue('a')).not.toBe(hue('b'))
    expect(hue('a1')).toBe(hue('a'))
  })

  it('survives a cycle instead of overflowing the stack', () => {
    const { nodes } = buildMindMapGraph(
      [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'a' },
      ],
    )
    // Both nodes still render; the walk just stops re-entering them.
    expect(nodes.map((n) => n.id).sort()).toEqual(['a', 'b'])
  })

  it('keeps nodes disconnected from the root by attaching them as branches', () => {
    const { nodes, links } = buildMindMapGraph(
      [
        { id: 'r', label: 'Root' },
        { id: 'k', label: 'Known' },
        { id: 'orphan', label: 'Orphan' },
      ],
      [{ source: 'r', target: 'k' }],
    )

    expect(nodes.map((n) => n.id)).toContain('orphan')
    expect(links).toEqual(
      expect.arrayContaining([{ source: 'r', target: 'orphan', kind: 'trunk' }]),
    )
  })

  it('drops edges whose endpoints were never emitted as nodes', () => {
    const { links } = buildMindMapGraph(
      [
        { id: 'r', label: 'Root' },
        { id: 'a', label: 'A' },
      ],
      [
        { source: 'r', target: 'a' },
        { source: 'r', target: 'ghost' },
        { source: 'a', target: 'a' },
      ],
    )
    expect(links).toEqual([{ source: 'r', target: 'a', kind: 'trunk' }])
  })

  it('prunes deepest-last when over maxNodes, never orphaning a survivor', () => {
    const { nodes, links } = buildMindMapGraph(
      [
        { id: 'r', label: 'Root' },
        { id: 'b', label: 'Branch', parentId: 'r' },
        { id: 'l', label: 'Leaf', parentId: 'b' },
      ],
      undefined,
      { maxNodes: 2 },
    )

    expect(nodes.map((n) => n.id)).toEqual(['r', 'b'])
    const ids = new Set(nodes.map((n) => n.id))
    expect(links.every((l) => ids.has(l.source) && ids.has(l.target))).toBe(true)
  })
})
