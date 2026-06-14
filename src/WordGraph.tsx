import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import type { GraphNode, GraphLink } from './useWordGraph'

const NEON = '#D6FF00'
const MAGENTA = '#FF007F'
const DIM = '#4A4446'

function edgeKey(link: any): string {
  const s = typeof link.source === 'object' ? (link.source as GraphNode).id! : (link.source as string)
  const t = typeof link.target === 'object' ? (link.target as GraphNode).id! : (link.target as string)
  return s < t ? `${s}|${t}` : `${t}|${s}`
}

interface Props {
  nodes: GraphNode[]
  links: GraphLink[]
  activePath: string[] | null
  isLoading: boolean
}

export function WordGraph({ nodes, links, activePath, isLoading }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setDims({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pathSet = useMemo(() => new Set(activePath ?? []), [activePath])

  const pathEdgeSet = useMemo(() => {
    if (!activePath || activePath.length < 2) return new Set<string>()
    const s = new Set<string>()
    for (let i = 0; i < activePath.length - 1; i++) {
      const a = activePath[i], b = activePath[i + 1]
      s.add(a < b ? `${a}|${b}` : `${b}|${a}`)
    }
    return s
  }, [activePath])

  const hasPath = activePath !== null

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const id = node.id as string
      const isPoop = id === 'POOP'
      const isPath = pathSet.has(id)

      let size: number
      let color: string

      if (isPoop) {
        size = 8
        color = MAGENTA
      } else if (isPath) {
        size = 5
        color = NEON
      } else {
        size = 2
        color = hasPath ? 'rgba(74,68,70,0.2)' : DIM
      }

      ctx.beginPath()
      ctx.arc(node.x, node.y, size / globalScale, 0, 2 * Math.PI)
      ctx.fillStyle = color

      if (isPoop || isPath) {
        ctx.shadowColor = color
        ctx.shadowBlur = (isPoop ? 16 : 10) / globalScale
      } else {
        ctx.shadowBlur = 0
      }

      ctx.fill()
      ctx.shadowBlur = 0
    },
    [pathSet, hasPath],
  )

  const nodePointerAreaPaint = useCallback(
    (node: any, paintColor: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
      ctx.fillStyle = paintColor
      ctx.beginPath()
      ctx.arc(node.x, node.y, 8 / globalScale, 0, 2 * Math.PI)
      ctx.fill()
    },
    [],
  )

  // Only called for path edges (mode "replace"); draws chartreuse glow line
  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const src = link.source as GraphNode
      const tgt = link.target as GraphNode
      if (src.x == null || src.y == null || tgt.x == null || tgt.y == null) return

      ctx.beginPath()
      ctx.moveTo(src.x, src.y)
      ctx.lineTo(tgt.x, tgt.y)
      ctx.strokeStyle = NEON
      ctx.lineWidth = 2 / globalScale
      ctx.shadowColor = NEON
      ctx.shadowBlur = 8 / globalScale
      ctx.stroke()
      ctx.shadowBlur = 0
    },
    [],
  )

  const linkCanvasObjectMode = useCallback(
    (link: any) => (pathEdgeSet.has(edgeKey(link)) ? ('replace' as const) : undefined),
    [pathEdgeSet],
  )

  const graphData = useMemo(() => ({ nodes, links }), [nodes, links])

  return (
    <div ref={containerRef} className="graph-container">
      {isLoading ? (
        <div className="graph-loading">
          <span className="graph-loading-cursor">_</span>
        </div>
      ) : (
        dims.width > 0 && (
          <ForceGraph2D
            graphData={graphData}
            width={dims.width}
            height={dims.height}
            backgroundColor="#141213"
            nodeCanvasObject={nodeCanvasObject}
            nodeCanvasObjectMode={() => 'replace'}
            nodePointerAreaPaint={nodePointerAreaPaint}
            nodeLabel={(node: any) => node.id as string}
            linkColor={() => 'rgba(239,236,230,0.05)'}
            linkWidth={0.5}
            linkCanvasObject={linkCanvasObject}
            linkCanvasObjectMode={linkCanvasObjectMode}
            enableNodeDrag={false}
            cooldownTicks={150}
          />
        )
      )}
    </div>
  )
}
