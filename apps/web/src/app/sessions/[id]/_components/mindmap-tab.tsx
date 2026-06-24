'use client'

import { useState } from 'react'
import {
  Network,
  Loader2,
  Sparkles,
  RotateCcw,
  AlertCircle,
  ChevronRight,
  Minus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MindMapTabProps {
  hasReadyDocs: boolean
  generations: any[]
  isLoading: boolean
  onGenerate: () => void
}

interface TreeNode {
  id: string
  label?: string
  title?: string
  children?: TreeNode[]
  parentId?: string | null
}

const levelColors = [
  { bg: 'bg-indigo-100', text: 'text-indigo-700', line: 'border-indigo-300' },
  { bg: 'bg-violet-100', text: 'text-violet-700', line: 'border-violet-300' },
  { bg: 'bg-sky-100', text: 'text-sky-700', line: 'border-sky-300' },
  { bg: 'bg-teal-100', text: 'text-teal-700', line: 'border-teal-300' },
  { bg: 'bg-amber-100', text: 'text-amber-700', line: 'border-amber-300' },
  { bg: 'bg-rose-100', text: 'text-rose-700', line: 'border-rose-300' },
]

function buildTree(nodes: any[], edges?: any[]): TreeNode[] {
  if (!nodes || nodes.length === 0) return []

  // If nodes already have children arrays, use them directly
  if (nodes[0]?.children) {
    return nodes
  }

  // Build from flat nodes + edges
  const nodeMap = new Map<string, TreeNode>()
  nodes.forEach((n) => {
    nodeMap.set(n.id, { ...n, children: [] })
  })

  const roots: TreeNode[] = []

  if (edges && edges.length > 0) {
    edges.forEach((edge: any) => {
      const parent = nodeMap.get(edge.source ?? edge.from)
      const child = nodeMap.get(edge.target ?? edge.to)
      if (parent && child) {
        parent.children = parent.children ?? []
        parent.children.push(child)
        child.parentId = parent.id
      }
    })
    nodeMap.forEach((node) => {
      if (!node.parentId) roots.push(node)
    })
  } else {
    // No edges: treat as flat list with parentId references
    nodes.forEach((n) => {
      const node = nodeMap.get(n.id)
      if (!node) return
      if (n.parentId && nodeMap.has(n.parentId)) {
        const parent = nodeMap.get(n.parentId)!
        parent.children = parent.children ?? []
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    })
  }

  return roots.length > 0 ? roots : nodes.map((n) => ({ ...n, children: [] }))
}

function TreeNodeComponent({
  node,
  level,
  collapsedNodes,
  toggleCollapse,
}: {
  node: TreeNode
  level: number
  collapsedNodes: Set<string>
  toggleCollapse: (id: string) => void
}) {
  const colorSet = levelColors[level % levelColors.length]
  const hasChildren = node.children && node.children.length > 0
  const isCollapsed = collapsedNodes.has(node.id)
  const label = node.label ?? node.title ?? node.id

  return (
    <div className="relative">
      {/* Node */}
      <div className="flex items-center gap-2">
        {/* Connector line */}
        {level > 0 && (
          <div className={`absolute left-0 top-1/2 w-4 border-t ${colorSet.line}`} style={{ marginLeft: `-${level > 1 ? 4 : 0}px` }} />
        )}

        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={() => toggleCollapse(node.id)}
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition ${colorSet.bg} ${colorSet.text} hover:opacity-80`}
          >
            <ChevronRight className={`h-3 w-3 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
          </button>
        ) : (
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${colorSet.bg}`}>
            <Minus className={`h-2.5 w-2.5 ${colorSet.text}`} />
          </span>
        )}

        {/* Label */}
        <span className={`rounded-md px-2.5 py-1 text-sm font-medium ${colorSet.bg} ${colorSet.text}`}>
          {label}
        </span>
      </div>

      {/* Children */}
      {hasChildren && !isCollapsed && (
        <div className={`ml-6 mt-1 space-y-1 border-l-2 pl-4 ${colorSet.line}`}>
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              collapsedNodes={collapsedNodes}
              toggleCollapse={toggleCollapse}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function MindMapTab({ hasReadyDocs, generations, isLoading, onGenerate }: MindMapTabProps) {
  const filtered = generations.filter((g) => g.type === 'mindmap')
  const latest = filtered.find((g) => g.status === 'completed')
  const pending = filtered.find((g) => g.status === 'pending' || g.status === 'processing')
  const failed = filtered.find((g) => g.status === 'failed')

  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set())

  const toggleCollapse = (id: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => setCollapsedNodes(new Set())

  const collapseAll = () => {
    const tree = buildTree(latest?.result?.nodes ?? [], latest?.result?.edges)
    const allIds = new Set<string>()
    const collectIds = (nodes: TreeNode[]) => {
      nodes.forEach((n) => {
        if (n.children && n.children.length > 0) {
          allIds.add(n.id)
          collectIds(n.children)
        }
      })
    }
    collectIds(tree)
    setCollapsedNodes(allIds)
  }

  if (!hasReadyDocs) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center pt-20">
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <Network className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-center">Upload documents first to generate a mind map</p>
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
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col items-center justify-center pt-12">
          <div className="rounded-full bg-red-50 p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">Mind map generation failed</p>
          <p className="text-xs text-gray-400 mt-1">Something went wrong. Please try again.</p>
          <Button onClick={onGenerate} disabled={isLoading} variant="outline" className="mt-4 gap-2">
            <RotateCcw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!latest || !latest.result?.nodes || latest.result.nodes.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex justify-center pt-4">
          <Button onClick={onGenerate} disabled={isLoading} size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Mind Map
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center pt-12">
          <div className="rounded-full bg-gray-100 p-4 mb-4">
            <Network className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-sm text-gray-400">No mind map generated yet</p>
        </div>
      </div>
    )
  }

  const tree = buildTree(latest.result.nodes, latest.result.edges)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={expandAll} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition">
            Expand all
          </button>
          <span className="text-gray-300">|</span>
          <button onClick={collapseAll} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition">
            Collapse all
          </button>
        </div>
        <Button onClick={onGenerate} disabled={isLoading} variant="outline" size="sm" className="gap-2">
          <RotateCcw className="h-3 w-3" />
          Regenerate
        </Button>
      </div>

      {/* Tree */}
      <div className="rounded-xl border bg-white p-6 space-y-2 overflow-x-auto">
        {tree.map((node) => (
          <TreeNodeComponent
            key={node.id}
            node={node}
            level={0}
            collapsedNodes={collapsedNodes}
            toggleCollapse={toggleCollapse}
          />
        ))}
      </div>
    </div>
  )
}
