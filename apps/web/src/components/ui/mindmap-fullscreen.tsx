'use client'

import { useMemo, useState, useCallback, useRef } from 'react'
import {
  ReactFlow,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Panel,
} from '@xyflow/react'
import { toPng } from 'html-to-image'
import {
  ArrowLeft,
  Download,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildFlowData } from '@/lib/mindmap-layout'
import '@xyflow/react/dist/style.css'

interface MindMapFullscreenProps {
  rawNodes: any[]
  edges?: any[]
  title?: string
  onBack: () => void
}

function MindMapCanvas({ rawNodes, edges: rawEdges, title, onBack }: MindMapFullscreenProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { fitView, zoomIn, zoomOut } = useReactFlow()

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildFlowData(rawNodes, rawEdges, { theme, scale: 1.2 }),
    [rawNodes, rawEdges, theme]
  )

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const handleDownload = useCallback(() => {
    const viewport = reactFlowWrapper.current?.querySelector('.react-flow__viewport') as HTMLElement
    if (!viewport) return

    toPng(viewport, {
      backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc',
      width: viewport.scrollWidth,
      height: viewport.scrollHeight,
      style: {
        transform: 'none',
      },
    }).then((dataUrl) => {
      const link = document.createElement('a')
      link.download = `${title ?? 'mindmap'}.png`
      link.href = dataUrl
      link.click()
    })
  }, [theme, title])

  const isDark = theme === 'dark'

  return (
    <div
      ref={reactFlowWrapper}
      className={`h-screen w-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        minZoom={0.05}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
      >
        {/* Header */}
        <Panel position="top-left">
          <Button
            variant="ghost"
            onClick={onBack}
            className={`gap-2 ${isDark ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-slate-200'}`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Panel>

        <Panel position="top-right">
          <Button
            variant="ghost"
            onClick={handleDownload}
            className={`gap-2 ${isDark ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-slate-200'}`}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </Panel>

        {/* Title */}
        {title && (
          <Panel position="top-center">
            <p className={`text-sm font-medium px-4 py-1.5 rounded-full ${isDark ? 'text-slate-300 bg-slate-800/80' : 'text-slate-600 bg-white/80'} backdrop-blur-sm`}>
              {title}
            </p>
          </Panel>
        )}

        {/* Bottom Toolbar */}
        <Panel position="bottom-center">
          <div className={`flex items-center gap-1 rounded-xl px-2 py-1.5 backdrop-blur-md shadow-lg ${isDark ? 'bg-slate-800/90 border border-slate-700' : 'bg-white/90 border border-slate-200'}`}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fitView({ padding: 0.4, duration: 300 })}
              className={`h-8 w-8 ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
              title="Fit view"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => zoomIn({ duration: 200 })}
              className={`h-8 w-8 ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => zoomOut({ duration: 200 })}
              className={`h-8 w-8 ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className={`mx-1 h-5 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`h-8 w-8 ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </Panel>

        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color={isDark ? '#334155' : '#e2e8f0'}
        />
      </ReactFlow>
    </div>
  )
}

export function MindMapFullscreen(props: MindMapFullscreenProps) {
  return (
    <ReactFlowProvider>
      <MindMapCanvas {...props} />
    </ReactFlowProvider>
  )
}
