import type { Node, Edge } from '@xyflow/react'
import { Position } from '@xyflow/react'

const BRANCH_COLORS = [
  '#10b981', '#f59e0b', '#6366f1', '#ef4444',
  '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6',
]

interface LayoutOptions {
  theme?: 'light' | 'dark'
  scale?: number
}

export function buildFlowData(
  rawNodes: any[],
  rawEdges?: any[],
  options: LayoutOptions = {}
) {
  const { theme = 'light', scale = 1 } = options

  if (!rawNodes || rawNodes.length === 0) return { nodes: [] as Node[], edges: [] as Edge[] }

  const childrenMap = new Map<string, any[]>()
  let rootNode: any

  if (rawEdges && rawEdges.length > 0) {
    const childSet = new Set<string>()
    rawEdges.forEach((e: any) => {
      const parent = e.source ?? e.from
      const child = e.target ?? e.to
      if (parent && child) {
        childSet.add(child)
        const list = childrenMap.get(parent) || []
        list.push(rawNodes.find((n) => n.id === child) || { id: child })
        childrenMap.set(parent, list)
      }
    })
    rootNode = rawNodes.find((n) => !childSet.has(n.id))
  } else {
    rawNodes.forEach((n) => {
      if (!n.parentId) { rootNode = n }
      else {
        const list = childrenMap.get(n.parentId) || []
        list.push(n)
        childrenMap.set(n.parentId, list)
      }
    })
  }

  if (!rootNode) rootNode = rawNodes[0]

  // Walk tree to assign depth + color
  const nodeDepth = new Map<string, number>()
  const nodeColor = new Map<string, string>()

  function walk(nodeId: string, depth: number, color: string) {
    nodeDepth.set(nodeId, depth)
    nodeColor.set(nodeId, color)
    const kids = childrenMap.get(nodeId) || []
    kids.forEach((kid, i) => {
      const c = depth === 0 ? BRANCH_COLORS[i % BRANCH_COLORS.length] : color
      walk(kid.id, depth + 1, c)
    })
  }
  walk(rootNode.id, 0, '#6366f1')

  // Build nodes + edges (up to depth 3)
  const flowNodes: Node[] = []
  const flowEdges: Edge[] = []
  const isDark = theme === 'dark'

  function addNodes(nodeId: string, label: string) {
    const depth = nodeDepth.get(nodeId) ?? 0
    const color = nodeColor.get(nodeId) ?? '#6366f1'
    if (depth > 3) return

    const isRoot = depth === 0
    const isBranch = depth === 1
    const baseFont = scale > 1 ? 2 : 0
    const minW = isRoot ? 200 + baseFont * 10 : isBranch ? 160 + baseFont * 8 : 130 + baseFont * 6
    const nodeW = Math.max(minW, Math.min(label.length * (8 + baseFont) + 40, 320))

    const nodeStyle = isDark
      ? {
          background: isRoot ? '#6366f1' : isBranch ? color : `${color}20`,
          color: depth <= 1 ? '#ffffff' : '#e2e8f0',
          border: depth <= 1 ? 'none' : `2px solid ${color}80`,
          borderRadius: isRoot ? '16px' : '12px',
          fontSize: isRoot ? `${14 + baseFont}px` : isBranch ? `${12 + baseFont}px` : `${11 + baseFont}px`,
          fontWeight: depth <= 1 ? '700' : '500',
          padding: isRoot ? '16px 24px' : '12px 16px',
          width: `${nodeW}px`,
          textAlign: 'center' as const,
          boxShadow: isRoot
            ? '0 0 24px rgba(99,102,241,0.5), 0 4px 14px rgba(99,102,241,0.3)'
            : isBranch
              ? `0 0 16px ${color}40, 0 3px 10px ${color}30`
              : `0 2px 8px rgba(0,0,0,0.3)`,
        }
      : {
          background: isRoot ? '#6366f1' : isBranch ? color : depth === 2 ? `${color}15` : '#ffffff',
          color: depth <= 1 ? '#ffffff' : '#1f2937',
          border: depth <= 1 ? 'none' : `2px solid ${color}`,
          borderRadius: isRoot ? '16px' : '10px',
          fontSize: isRoot ? `${14 + baseFont}px` : isBranch ? `${12 + baseFont}px` : `${11 + baseFont}px`,
          fontWeight: depth <= 1 ? '700' : '500',
          padding: isRoot ? '14px 20px' : '10px 14px',
          width: `${nodeW}px`,
          textAlign: 'center' as const,
          boxShadow: isRoot
            ? '0 4px 14px rgba(99,102,241,0.3)'
            : isBranch
              ? `0 3px 10px ${color}30`
              : `0 1px 4px rgba(0,0,0,0.06)`,
        }

    flowNodes.push({
      id: nodeId,
      position: { x: 0, y: 0 },
      data: { label },
      style: nodeStyle,
    })

    const kids = childrenMap.get(nodeId) || []
    kids.forEach((kid) => {
      if ((nodeDepth.get(kid.id) ?? 0) > 3) return
      const kidLabel = kid.label ?? kid.title ?? kid.id
      const kidColor = nodeColor.get(kid.id) ?? '#d1d5db'

      flowEdges.push({
        id: `e-${nodeId}-${kid.id}`,
        source: nodeId,
        target: kid.id,
        type: 'smoothstep',
        style: {
          stroke: depth === 0 ? kidColor : `${color}${isDark ? 'aa' : '80'}`,
          strokeWidth: depth === 0 ? 2.5 : 1.5,
        },
        animated: isDark && depth === 0,
      })

      addNodes(kid.id, kidLabel)
    })
  }

  addNodes(rootNode.id, rootNode.label ?? rootNode.title ?? rootNode.id)

  // ─── RADIAL MIND MAP LAYOUT ───
  function subtreeSize(nid: string, maxDepth: number): number {
    if (maxDepth <= 0) return 1
    const kids = childrenMap.get(nid) || []
    if (kids.length === 0) return 1
    return kids.reduce((sum, k) => sum + subtreeSize(k.id, maxDepth - 1), 0)
  }

  const level1Kids = childrenMap.get(rootNode.id) || []
  const totalWeight = level1Kids.reduce((sum, k) => sum + subtreeSize(k.id, 3), 0)

  const totalNodes = flowNodes.length
  const scaleFactor = Math.max(1, Math.sqrt(totalNodes / 30)) * scale
  const LEVEL_RADIUS = [
    0,
    Math.round(250 * scaleFactor),
    Math.round(500 * scaleFactor),
    Math.round(720 * scaleFactor),
    Math.round(920 * scaleFactor),
  ]
  const cx = 0
  const cy = 0

  // Place root
  const rootIdx = flowNodes.findIndex((n) => n.id === rootNode.id)
  if (rootIdx >= 0) {
    const w = parseInt(flowNodes[rootIdx].style?.width as string) || 180
    flowNodes[rootIdx].position = { x: cx - w / 2, y: cy - 22 }
  }

  // Place each branch in its angular sector
  let currentAngle = -Math.PI / 2

  level1Kids.forEach((kid) => {
    const weight = subtreeSize(kid.id, 3)
    const sectorAngle = (weight / totalWeight) * 2 * Math.PI
    const branchAngle = currentAngle + sectorAngle / 2

    const r1 = LEVEL_RADIUS[1]
    const bx = cx + Math.cos(branchAngle) * r1
    const by = cy + Math.sin(branchAngle) * r1

    const branchIdx = flowNodes.findIndex((n) => n.id === kid.id)
    if (branchIdx >= 0) {
      const w = parseInt(flowNodes[branchIdx].style?.width as string) || 150
      flowNodes[branchIdx].position = { x: bx - w / 2, y: by - 22 }
      const isRight = Math.cos(branchAngle) >= 0
      flowNodes[branchIdx].sourcePosition = isRight ? Position.Right : Position.Left
      flowNodes[branchIdx].targetPosition = isRight ? Position.Left : Position.Right
    }

    // Place level-2 children
    const level2Kids = childrenMap.get(kid.id) || []
    const l2Count = level2Kids.length
    const l2Spread = sectorAngle * 0.7
    const l2Start = branchAngle - l2Spread / 2
    const l2Step = l2Count > 1 ? l2Spread / (l2Count - 1) : 0

    level2Kids.forEach((gc, j) => {
      const gcAngle = l2Count === 1 ? branchAngle : l2Start + l2Step * j
      const r2 = LEVEL_RADIUS[2]
      const gx = cx + Math.cos(gcAngle) * r2
      const gy = cy + Math.sin(gcAngle) * r2

      const gcIdx = flowNodes.findIndex((n) => n.id === gc.id)
      if (gcIdx >= 0) {
        const w = parseInt(flowNodes[gcIdx].style?.width as string) || 130
        flowNodes[gcIdx].position = { x: gx - w / 2, y: gy - 22 }
        const isRight = Math.cos(gcAngle) >= 0
        flowNodes[gcIdx].sourcePosition = isRight ? Position.Right : Position.Left
        flowNodes[gcIdx].targetPosition = isRight ? Position.Left : Position.Right
      }

      // Place level-3 children
      const level3Kids = childrenMap.get(gc.id) || []
      const l3Count = level3Kids.length
      const l3Spread = (l2Count > 1 ? l2Step : sectorAngle * 0.3) * 0.6
      const l3Start = gcAngle - l3Spread / 2
      const l3Step = l3Count > 1 ? l3Spread / (l3Count - 1) : 0

      level3Kids.forEach((leaf, k) => {
        const leafAngle = l3Count === 1 ? gcAngle : l3Start + l3Step * k
        const r3 = LEVEL_RADIUS[3]
        const lx = cx + Math.cos(leafAngle) * r3
        const ly = cy + Math.sin(leafAngle) * r3

        const leafIdx = flowNodes.findIndex((n) => n.id === leaf.id)
        if (leafIdx >= 0) {
          const w = parseInt(flowNodes[leafIdx].style?.width as string) || 120
          flowNodes[leafIdx].position = { x: lx - w / 2, y: ly - 22 }
          const isRight = Math.cos(leafAngle) >= 0
          flowNodes[leafIdx].sourcePosition = isRight ? Position.Right : Position.Left
          flowNodes[leafIdx].targetPosition = isRight ? Position.Left : Position.Right
        }
      })
    })

    currentAngle += sectorAngle
  })

  return { nodes: flowNodes, edges: flowEdges }
}
