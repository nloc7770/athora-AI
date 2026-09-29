'use client'

import { useMemo } from 'react'
import {
  ReactFlow,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { buildFlowData } from '@/lib/mindmap-layout'

interface MindMapFlowProps {
  rawNodes: any[]
  edges?: any[]
  height?: string
}

export function MindMapFlow({ rawNodes, edges: rawEdges, height = '500px' }: MindMapFlowProps) {
  // Both call sites (the session detail Mind Map tab and DocumentInsight) render
  // inside BrainShell, which forces .dark, so the canvas is dark outright.
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildFlowData(rawNodes, rawEdges, { theme: 'dark' }),
    [rawNodes, rawEdges]
  )

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div style={{ height }} className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50/30 dark:border-stone-800 dark:bg-stone-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={3}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Controls position="top-right" />
        <MiniMap
          style={{ height: 80, width: 120 }}
          nodeColor={(node) => (node.style?.background as string) ?? '#e5e7eb'}
          maskColor="rgba(0,0,0,0.6)"
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#44403c" />
      </ReactFlow>
    </div>
  )
}
