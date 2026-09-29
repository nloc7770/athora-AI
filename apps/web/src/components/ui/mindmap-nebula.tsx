'use client'

import { Component, useMemo, type ReactNode } from 'react'
import dynamic from 'next/dynamic'

import {
  buildMindMapGraph,
  type MindMapRawNode,
  type MindMapRawEdge,
} from '@/lib/mindmap-graph'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { MindMapFlow } from './mindmap-flow'

// WebGL/three never load on the server or in jsdom — same contract brain-hero
// uses, and what lets the session tests keep rendering this component.
const BrainGraph3D = dynamic(() => import('@/components/brain/brain-graph-3d'), {
  ssr: false,
  loading: () => null,
})

interface MindMapNebulaProps {
  rawNodes: MindMapRawNode[]
  edges?: MindMapRawEdge[]
  height?: string
}

/**
 * The generated mind map, rendered as the dashboard's nebula rather than as
 * boxes on a radial grid. Same graph engine, same palette, same physics — only
 * the adapter differs (lib/mindmap-graph.ts), so a session's map and the
 * dashboard brain read as one product.
 *
 * MindMapFlow is kept as the fallback, not deleted: it is the only renderer
 * that works without WebGL, and it is still what DocumentInsight embeds.
 */
class NebulaErrorBoundary extends Component<
  { fallback: ReactNode; children?: ReactNode },
  { crashed: boolean }
> {
  state = { crashed: false }
  static getDerivedStateFromError() {
    return { crashed: true }
  }
  render() {
    return this.state.crashed ? this.props.fallback : this.props.children
  }
}

export function MindMapNebula({ rawNodes, edges, height = '600px' }: MindMapNebulaProps) {
  const reducedMotion = useReducedMotion()

  const graph = useMemo(() => buildMindMapGraph(rawNodes, edges), [rawNodes, edges])

  return (
    <div
      style={{ height }}
      className="relative overflow-hidden rounded-xl border border-stone-800 bg-[#0e0e16]"
    >
      <NebulaErrorBoundary
        fallback={
          // No WebGL: fall back to the 2D map rather than to an error. The
          // wrapper already draws the frame, so the flow fills it.
          <div className="absolute inset-0">
            <MindMapFlow rawNodes={rawNodes} edges={edges} height="100%" />
          </div>
        }
      >
        {/* No onNodeOpen: a mind-map node is not a destination, and the card
            already shows its full text, so a click has nothing to reveal.
            Drag, orbit and zoom all still work. */}
        <BrainGraph3D
          nodes={graph.nodes}
          links={graph.links}
          reducedMotion={reducedMotion}
          coreSprite="glow"
          labelMode="card"
        />
      </NebulaErrorBoundary>
    </div>
  )
}
