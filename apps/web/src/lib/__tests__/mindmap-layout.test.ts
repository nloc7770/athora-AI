import { describe, it, expect } from 'vitest'
import { buildFlowData } from '../mindmap-layout'

describe('buildFlowData — LLM output is untrusted', () => {
  it('survives a parentId cycle without hanging and loses no nodes', () => {
    const nodes = [
      { id: 'root', label: 'Root' },
      { id: 'a', label: 'A', parentId: 'root' },
      { id: 'b', label: 'B', parentId: 'a' },
      // cycle: a's child points back to a
      { id: 'c', label: 'C', parentId: 'b' },
    ]
    // a -> b -> a would hang an unguarded walk; here c loops back via edges
    const rawEdges = [
      { source: 'root', target: 'a' },
      { source: 'a', target: 'b' },
      { source: 'b', target: 'a' }, // cycle back to a
      { source: 'b', target: 'c' },
    ]
    const { nodes: flowNodes } = buildFlowData(nodes, rawEdges)
    const ids = new Set(flowNodes.map((n) => n.id))
    expect(ids).toEqual(new Set(['root', 'a', 'b', 'c']))
  })

  it('attaches disconnected components to the root instead of dropping them', () => {
    const nodes = [
      { id: 'root', label: 'Root' },
      { id: 'a', label: 'A', parentId: 'root' },
      // island: no path from root
      { id: 'x', label: 'X', parentId: 'y' },
      { id: 'y', label: 'Y' },
    ]
    const { nodes: flowNodes } = buildFlowData(nodes)
    expect(flowNodes.map((n) => n.id).sort()).toEqual(['a', 'root', 'x', 'y'])
  })

  it('keeps the old behavior for a clean tree', () => {
    const nodes = [
      { id: 'root', label: 'Root' },
      { id: 'a', label: 'A', parentId: 'root' },
      { id: 'b', label: 'B', parentId: 'root' },
      { id: 'a1', label: 'A1', parentId: 'a' },
    ]
    const { nodes: flowNodes, edges: flowEdges } = buildFlowData(nodes)
    expect(flowNodes).toHaveLength(4)
    const root = flowNodes.find((n) => n.id === 'root')!
    // root is centered at origin
    expect(root.position.x).toBeLessThanOrEqual(0)
    expect(flowEdges.filter((e) => e.source === 'root')).toHaveLength(2)
  })
})
