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
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildFlowData(rawNodes, rawEdges),
    [rawNodes, rawEdges]
  )

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  return (
    <div style={{ height }} className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50/30">
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
        proOptions={{ hideAttribution: true }}
      >
        <Controls position="top-right" />
        <MiniMap
          style={{ height: 80, width: 120 }}
          nodeColor={(node) => (node.style?.background as string) ?? '#e5e7eb'}
          maskColor="rgba(255,255,255,0.7)"
        />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
      </ReactFlow>
    </div>
  )
}
