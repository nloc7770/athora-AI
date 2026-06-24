'use client'

import { useState, useMemo } from 'react'
import {
  Network,
  Loader2,
  Sparkles,
  RotateCcw,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MindMapTabProps {
  hasReadyDocs: boolean
  generations: any[]
  isLoading: boolean
  onGenerate: () => void
}

interface RawNode {
  id: string
  label?: string
  title?: string
  parentId?: string | null
}

const BRANCH_COLORS = [
  { bg: '#dcfce7', border: '#4ade80', text: '#166534' },
  { bg: '#dbeafe', border: '#60a5fa', text: '#1e3a5a' },
  { bg: '#fef9c3', border: '#facc15', text: '#713f12' },
  { bg: '#f3e8ff', border: '#c084fc', text: '#581c87' },
  { bg: '#ffe4e6', border: '#fb7185', text: '#881337' },
  { bg: '#ccfbf1', border: '#2dd4bf', text: '#134e4a' },
  { bg: '#fef3c7', border: '#f59e0b', text: '#78350f' },
  { bg: '#e0e7ff', border: '#818cf8', text: '#312e81' },
]

interface LayoutNode {
  id: string
  label: string
  x: number
  y: number
  color: typeof BRANCH_COLORS[0]
  level: number
  fontSize: number
}

interface LayoutEdge {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
}

function layoutMindMap(rawNodes: RawNode[], edges?: any[]): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  if (!rawNodes || rawNodes.length === 0) return { nodes: [], edges: [] }

  // Build parent-child map
  const childrenMap = new Map<string, RawNode[]>()
  let rootNode: RawNode | undefined

  if (edges && edges.length > 0) {
    // Build from edges
    const childSet = new Set<string>()
    edges.forEach((e: any) => {
      const parentId = e.source ?? e.from
      const childId = e.target ?? e.to
      childSet.add(childId)
      const children = childrenMap.get(parentId) || []
      const child = rawNodes.find(n => n.id === childId)
      if (child) children.push(child)
      childrenMap.set(parentId, children)
    })
    rootNode = rawNodes.find(n => !childSet.has(n.id))
  } else {
    // Build from parentId
    rawNodes.forEach(n => {
      if (n.parentId) {
        const children = childrenMap.get(n.parentId) || []
        children.push(n)
        childrenMap.set(n.parentId, children)
      }
    })
    rootNode = rawNodes.find(n => !n.parentId)
  }

  if (!rootNode) rootNode = rawNodes[0]

  const layoutNodes: LayoutNode[] = []
  const layoutEdges: LayoutEdge[] = []

  const cx = 500
  const cy = 400

  // Root
  layoutNodes.push({
    id: rootNode.id,
    label: rootNode.label ?? rootNode.title ?? rootNode.id,
    x: cx,
    y: cy,
    color: { bg: '#ffffff', border: '#374151', text: '#111827' },
    level: 0,
    fontSize: 18,
  })

  // Level 1
  const level1 = childrenMap.get(rootNode.id) || []
  const angleStep1 = (2 * Math.PI) / Math.max(level1.length, 1)
  const radius1 = 200

  level1.forEach((child, i) => {
    const angle = angleStep1 * i - Math.PI / 2
    const x = cx + Math.cos(angle) * radius1
    const y = cy + Math.sin(angle) * radius1
    const color = BRANCH_COLORS[i % BRANCH_COLORS.length]

    layoutNodes.push({
      id: child.id,
      label: child.label ?? child.title ?? child.id,
      x, y, color, level: 1, fontSize: 14,
    })
    layoutEdges.push({ x1: cx, y1: cy, x2: x, y2: y, color: color.border })

    // Level 2
    const level2 = childrenMap.get(child.id) || []
    const spread2 = Math.min(Math.PI * 0.6, angleStep1 * 0.8)
    const startAngle2 = angle - spread2 / 2
    const step2 = level2.length > 1 ? spread2 / (level2.length - 1) : 0
    const radius2 = 140

    level2.forEach((grandchild, j) => {
      const a2 = level2.length === 1 ? angle : startAngle2 + step2 * j
      const gx = x + Math.cos(a2) * radius2
      const gy = y + Math.sin(a2) * radius2

      layoutNodes.push({
        id: grandchild.id,
        label: grandchild.label ?? grandchild.title ?? grandchild.id,
        x: gx, y: gy, color, level: 2, fontSize: 12,
      })
      layoutEdges.push({ x1: x, y1: y, x2: gx, y2: gy, color: color.border })

      // Level 3
      const level3 = childrenMap.get(grandchild.id) || []
      const spread3 = Math.min(Math.PI * 0.4, spread2 * 0.6)
      const startAngle3 = a2 - spread3 / 2
      const step3 = level3.length > 1 ? spread3 / (level3.length - 1) : 0
      const radius3 = 100

      level3.forEach((leaf, k) => {
        const a3 = level3.length === 1 ? a2 : startAngle3 + step3 * k
        const lx = gx + Math.cos(a3) * radius3
        const ly = gy + Math.sin(a3) * radius3

        layoutNodes.push({
          id: leaf.id,
          label: leaf.label ?? leaf.title ?? leaf.id,
          x: lx, y: ly, color, level: 3, fontSize: 11,
        })
        layoutEdges.push({ x1: gx, y1: gy, x2: lx, y2: ly, color: color.border })
      })
    })
  })

  return { nodes: layoutNodes, edges: layoutEdges }
}

export function MindMapTab({ hasReadyDocs, generations, isLoading, onGenerate }: MindMapTabProps) {
  const [zoom, setZoom] = useState(0.9)
  const filtered = generations.filter((g) => g.type === 'mindmap')
  const latest = filtered.find((g) => g.status === 'completed')
  const pending = filtered.find((g) => g.status === 'pending' || g.status === 'processing')
  const failed = filtered.find((g) => g.status === 'failed')

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(() => {
    if (!latest?.result?.nodes) return { nodes: [], edges: [] }
    return layoutMindMap(latest.result.nodes, latest.result.edges)
  }, [latest])

  if (!hasReadyDocs) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center pt-20">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <Network className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500">Upload documents first to generate a mind map</p>
      </div>
    )
  }

  if ((isLoading || pending) && !latest) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center pt-20">
        <div className="rounded-full bg-indigo-50 p-4 mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
        <p className="text-sm font-medium text-gray-700">Generating mind map...</p>
        <p className="text-xs text-gray-400 mt-1">Mapping concepts from your documents</p>
      </div>
    )
  }

  if (failed && !latest) {
    return (
      <div className="mx-auto max-w-3xl flex flex-col items-center pt-16">
        <div className="rounded-full bg-red-50 p-4 mb-4">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <p className="text-sm font-medium text-gray-700">Generation failed</p>
        <Button onClick={onGenerate} disabled={isLoading} variant="outline" className="mt-4 gap-2">
          <RotateCcw className="h-4 w-4" /> Retry
        </Button>
      </div>
    )
  }

  if (!latest || layoutNodes.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex justify-center pt-4">
          <Button onClick={onGenerate} disabled={isLoading} size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" /> Generate Mind Map
          </Button>
        </div>
        <div className="flex flex-col items-center pt-12">
          <Network className="h-12 w-12 text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">Visualize document concepts as a mind map</p>
        </div>
      </div>
    )
  }

  // Compute viewBox
  const padding = 80
  const allX = layoutNodes.map(n => n.x)
  const allY = layoutNodes.map(n => n.y)
  const minX = Math.min(...allX) - padding
  const minY = Math.min(...allY) - padding
  const maxX = Math.max(...allX) + padding
  const maxY = Math.max(...allY) + padding
  const width = maxX - minX
  const height = maxY - minY

  return (
    <div className="mx-auto max-w-full space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between px-2">
        <Button onClick={onGenerate} disabled={isLoading} variant="outline" size="sm" className="gap-2">
          <RotateCcw className="h-3 w-3" /> Regenerate
        </Button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(2, z + 0.15))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setZoom(0.9)}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* SVG Mind Map */}
      <div className="rounded-xl border bg-gradient-to-br from-gray-50 to-white overflow-auto" style={{ height: '550px' }}>
        <svg
          width={width * zoom}
          height={height * zoom}
          viewBox={`${minX} ${minY} ${width} ${height}`}
          className="mx-auto"
        >
          {/* Edges - dotted curved lines */}
          {layoutEdges.map((edge, i) => {
            const mx = (edge.x1 + edge.x2) / 2
            const my = (edge.y1 + edge.y2) / 2
            // Slight curve
            const dx = edge.x2 - edge.x1
            const dy = edge.y2 - edge.y1
            const cx1 = mx + dy * 0.1
            const cy1 = my - dx * 0.1

            return (
              <path
                key={`edge-${i}`}
                d={`M ${edge.x1} ${edge.y1} Q ${cx1} ${cy1} ${edge.x2} ${edge.y2}`}
                fill="none"
                stroke={edge.color}
                strokeWidth="2"
                strokeDasharray="5 4"
                opacity={0.7}
              />
            )
          })}

          {/* Nodes */}
          {layoutNodes.map((node) => {
            const textLen = node.label.length * node.fontSize * 0.55
            const padX = 16
            const padY = 8
            const rectW = textLen + padX * 2
            const rectH = node.fontSize + padY * 2
            const rx = node.level === 0 ? 6 : 14

            return (
              <g key={node.id}>
                {/* Shadow */}
                <rect
                  x={node.x - rectW / 2 + 2}
                  y={node.y - rectH / 2 + 2}
                  width={rectW}
                  height={rectH}
                  rx={rx}
                  fill="rgba(0,0,0,0.05)"
                />
                {/* Background */}
                <rect
                  x={node.x - rectW / 2}
                  y={node.y - rectH / 2}
                  width={rectW}
                  height={rectH}
                  rx={rx}
                  fill={node.color.bg}
                  stroke={node.color.border}
                  strokeWidth={node.level === 0 ? 3 : 2}
                />
                {/* Text */}
                <text
                  x={node.x}
                  y={node.y + node.fontSize * 0.35}
                  textAnchor="middle"
                  fontSize={node.fontSize}
                  fontWeight={node.level <= 1 ? 'bold' : 'normal'}
                  fill={node.color.text}
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {node.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
