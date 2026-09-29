import { describe, it, expect } from 'vitest'
import { buildGraphData, type BrainApiResponse } from '../brain-graph'

const OPTS = { maxNodes: 400, isDark: false }

function res(partial: BrainApiResponse): BrainApiResponse {
  return partial
}

const CORE = { id: 'core', kind: 'core', label: 'My Brain', val: 40 }
const SESSION = { id: 's-1', kind: 'session', label: 'Biology', val: 8 }

function docs(n: number, status = 'ready') {
  return Array.from({ length: n }, (_, i) => ({
    id: `d-${i}`,
    kind: 'document',
    label: `Doc ${i}`,
    docType: 'pdf',
    status,
    sessionId: 's-1',
    val: 3,
  }))
}

function concepts(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `s-1:c-${i}`,
    kind: 'concept',
    label: `Concept ${i}`,
    sessionId: 's-1',
    val: 1,
  }))
}

describe('buildGraphData — shape and pinning', () => {
  it('returns an empty graph for a null or malformed response', () => {
    expect(buildGraphData(null, OPTS)).toEqual({ nodes: [], links: [] })
    expect(buildGraphData({} as BrainApiResponse, OPTS)).toEqual({ nodes: [], links: [] })
    expect(buildGraphData({ nodes: 'nope' } as never, OPTS)).toEqual({ nodes: [], links: [] })
  })

  it('pins the core to the origin and leaves every other node free', () => {
    const { nodes } = buildGraphData(res({ nodes: [CORE, SESSION, ...docs(1)] }), OPTS)
    const core = nodes.find((n) => n.kind === 'core')!
    expect([core.fx, core.fy, core.fz]).toEqual([0, 0, 0])
    for (const n of nodes.filter((x) => x.kind !== 'core')) {
      expect(n.fx).toBeUndefined()
    }
  })

  it('drops nodes with a missing or empty id', () => {
    const { nodes } = buildGraphData(
      res({ nodes: [CORE, { kind: 'document', label: 'no id' }, { id: '', kind: 'document', label: 'blank' }] }),
      OPTS,
    )
    expect(nodes).toHaveLength(1)
  })

  it('truncates labels and falls back when a label is blank', () => {
    const { nodes } = buildGraphData(
      res({
        nodes: [
          { id: 'core', kind: 'core', label: 'x'.repeat(200) },
          { id: 'd-1', kind: 'document', label: '   ' },
        ],
      }),
      OPTS,
    )
    expect(nodes[0].label).toHaveLength(80)
    expect(nodes[1].label).toBe('Document')
  })
})

describe('buildGraphData — colors (veronica cluster hues)', () => {
  it('uses veronica accent for the core, not athora purple', () => {
    const { nodes } = buildGraphData(res({ nodes: [CORE] }), OPTS)
    expect(nodes[0].color).toBe('#ff7a3c')
  })

  it('gives each session its own hue and cycles the palette', () => {
    const sessions = Array.from({ length: 3 }, (_, i) => ({
      id: `s-${i}`,
      kind: 'session',
      label: `S${i}`,
      val: 8,
    }))
    const { nodes } = buildGraphData(res({ nodes: [CORE, ...sessions] }), OPTS)
    const hues = nodes.filter((n) => n.kind === 'session').map((n) => n.color)
    expect(hues).toEqual(['#8b93ff', '#3fdc9a', '#f0a24a'])
  })

  it('documents inherit their own session hue, so clusters read as groups', () => {
    const { nodes } = buildGraphData(
      res({
        nodes: [
          CORE,
          { id: 's-a', kind: 'session', label: 'A', val: 8 },
          { id: 's-b', kind: 'session', label: 'B', val: 8 },
          { id: 'd-a', kind: 'document', label: 'da', status: 'ready', sessionId: 's-a' },
          { id: 'd-b', kind: 'document', label: 'db', status: 'ready', sessionId: 's-b' },
        ],
      }),
      OPTS,
    )
    expect(nodes.find((n) => n.id === 'd-a')!.color).toBe('#8b93ff') // same as s-a
    expect(nodes.find((n) => n.id === 'd-b')!.color).toBe('#3fdc9a') // same as s-b
  })

  it('falls back to a neutral hue for a session-less document', () => {
    const { nodes } = buildGraphData(
      res({ nodes: [CORE, { id: 'orphan', kind: 'document', label: 'o', status: 'ready' }] }),
      OPTS,
    )
    expect(nodes.find((n) => n.id === 'orphan')!.color).toBe('#9fb0cf')
  })

  it('status still overrides the cluster hue', () => {
    const { nodes } = buildGraphData(
      res({
        nodes: [
          { id: 's-1', kind: 'session', label: 'S', val: 8 },
          { id: 'f', kind: 'document', label: 'f', status: 'failed', sessionId: 's-1' },
          { id: 'p', kind: 'document', label: 'p', status: 'parsing', sessionId: 's-1' },
          { id: 'r', kind: 'document', label: 'r', status: 'ready', sessionId: 's-1' },
        ],
      }),
      OPTS,
    )
    expect(nodes.find((n) => n.id === 'f')!.color).toBe('#a8a29e')
    expect(nodes.find((n) => n.id === 'p')!.color).toBe('#8b93ff80') // faded cluster hue
    expect(nodes.find((n) => n.id === 'r')!.color).toBe('#8b93ff')
  })

  it('picks concept colors per theme', () => {
    const payload = res({ nodes: [...concepts(1)] })
    expect(buildGraphData(payload, { maxNodes: 400, isDark: true }).nodes[0].color).toBe('#a8a29e')
    expect(buildGraphData(payload, { maxNodes: 400, isDark: false }).nodes[0].color).toBe('#57534e')
  })
})

describe('buildGraphData — pruning', () => {
  it('drops concepts before documents when over budget', () => {
    const { nodes } = buildGraphData(
      res({ nodes: [CORE, SESSION, ...docs(10), ...concepts(20)] }),
      { maxNodes: 5, isDark: false },
    )
    expect(nodes.filter((n) => n.kind === 'concept')).toHaveLength(0)
    expect(nodes.filter((n) => n.kind === 'document')).toHaveLength(3) // 5 - core - session
    expect(nodes).toHaveLength(5)
  })

  it('keeps everything when the budget is generous', () => {
    const { nodes } = buildGraphData(
      res({ nodes: [CORE, SESSION, ...docs(10), ...concepts(20)] }),
      { maxNodes: 400, isDark: false },
    )
    expect(nodes).toHaveLength(32)
  })

  it('never drops the core or sessions, even past the cap', () => {
    const manySessions = Array.from({ length: 30 }, (_, i) => ({
      id: `s-${i}`,
      kind: 'session',
      label: `S${i}`,
      val: 8,
    }))
    const { nodes } = buildGraphData(
      res({ nodes: [CORE, ...manySessions, ...docs(10)] }),
      { maxNodes: 5, isDark: false },
    )
    expect(nodes.filter((n) => n.kind === 'core')).toHaveLength(1)
    expect(nodes.filter((n) => n.kind === 'session')).toHaveLength(30)
    // Documents get nothing left to spend.
    expect(nodes.filter((n) => n.kind === 'document')).toHaveLength(0)
  })

  it('mobile cap keeps the graph small', () => {
    const { nodes } = buildGraphData(
      res({ nodes: [CORE, SESSION, ...docs(40), ...concepts(200)] }),
      { maxNodes: 60, isDark: false },
    )
    expect(nodes.length).toBeLessThanOrEqual(60)
  })
})

describe('buildGraphData — spotlight (veronica highlight semantics)', () => {
  const payload = res({ nodes: [CORE, SESSION, ...docs(2)] })

  it('leaves every node at full brightness when highlightIds is null', () => {
    const { nodes } = buildGraphData(payload, { ...OPTS, highlightIds: null })
    expect(nodes.every((n) => !n.color.endsWith('26'))).toBe(true)
  })

  it('treats an EMPTY Set as "searched, no hits" and dims everything but the core', () => {
    const { nodes } = buildGraphData(payload, { ...OPTS, highlightIds: new Set<string>() })
    const core = nodes.find((n) => n.kind === 'core')!
    expect(core.color).toBe('#ff7a3c') // anchor stays lit
    for (const n of nodes.filter((x) => x.kind !== 'core')) {
      expect(n.color.endsWith('26')).toBe(true)
    }
  })

  it('lights only the hits and dims the rest', () => {
    const { nodes } = buildGraphData(payload, { ...OPTS, highlightIds: new Set(['d-0']) })
    expect(nodes.find((n) => n.id === 'd-0')!.color).toBe('#8b93ff') // s-1's hue, undimmed
    expect(nodes.find((n) => n.id === 'd-1')!.color.endsWith('26')).toBe(true)
    expect(nodes.find((n) => n.id === 's-1')!.color.endsWith('26')).toBe(true)
  })

  it('does not stack alpha when dimming an already-faded processing doc', () => {
    const faded = res({ nodes: [CORE, SESSION, ...docs(1, 'parsing')] })
    const { nodes } = buildGraphData(faded, { ...OPTS, highlightIds: new Set<string>() })
    // Cluster hue + '80' faded, then dimmed → must be 7 + 2 chars, not 11.
    expect(nodes.find((n) => n.id === 'd-0')!.color).toBe('#8b93ff26')
  })
})

describe('buildGraphData — links', () => {
  it('keeps only links whose endpoints both survived', () => {
    const { links } = buildGraphData(
      res({
        nodes: [CORE, SESSION, ...docs(1)],
        links: [
          { source: 'core', target: 's-1' },
          { source: 's-1', target: 'd-0' },
          { source: 's-1', target: 'pruned-node' }, // dangling
          { source: 'missing', target: 'core' }, // dangling
        ],
      }),
      OPTS,
    )
    expect(links).toEqual([
      { source: 'core', target: 's-1' },
      { source: 's-1', target: 'd-0' },
    ])
  })

  it('drops self-links and links with missing endpoints', () => {
    const { links } = buildGraphData(
      res({
        nodes: [CORE],
        links: [{ source: 'core', target: 'core' }, { source: 'core' }, { target: 'core' }, {}],
      }),
      OPTS,
    )
    expect(links).toEqual([])
  })

  it('drops links to concepts that were pruned away', () => {
    const { links, nodes } = buildGraphData(
      res({
        nodes: [CORE, SESSION, ...docs(3), ...concepts(10)],
        links: concepts(10).map((c) => ({ source: 's-1', target: c.id })),
      }),
      { maxNodes: 5, isDark: false },
    )
    expect(nodes.filter((n) => n.kind === 'concept')).toHaveLength(0)
    expect(links).toEqual([])
  })
})
