import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import type { GraphNode, GraphLink } from './useWordGraph'

const NEON = '#D6FF00'
const MAGENTA = '#FF007F'
const DIM = '#4A4446'
const BONE = '#EFECE6'

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
  onNodeHover?: (word: string | null) => void
  hoveredWord?: string | null
  hoverNeighborSet?: Set<string>
  hoverEdgeSet?: Set<string>
}

export function WordGraph({
  nodes,
  links,
  activePath,
  isLoading,
  onNodeHover,
  hoveredWord,
  hoverNeighborSet,
  hoverEdgeSet,
}: Props) {
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
  const hasHover = hoveredWord != null

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const id = node.id as string
      const isPoop = id === 'POOP'
      const isPath = pathSet.has(id)
      const isHovered = id === hoveredWord
      const isNeighbor = hoverNeighborSet?.has(id) ?? false

      let size: number
      let color: string
      let glow = 0

      if (isPoop) {
        size = 8
        color = MAGENTA
        glow = 16
      } else if (isHovered) {
        size = 6
        color = BONE
        glow = 14
      } else if (isNeighbor) {
        size = 3.5
        color = 'rgba(214,255,0,0.65)'
        glow = 6
      } else if (isPath) {
        size = 5
        color = NEON
        glow = 10
      } else {
        size = 2
        // Dim further when hover or path is active so highlights pop
        color = hasPath || hasHover ? 'rgba(74,68,70,0.14)' : DIM
      }

      ctx.beginPath()
      ctx.arc(node.x, node.y, size / globalScale, 0, 2 * Math.PI)
      ctx.fillStyle = color
      if (glow > 0) {
        ctx.shadowColor = color
        ctx.shadowBlur = glow / globalScale
      } else {
        ctx.shadowBlur = 0
      }
      ctx.fill()
      ctx.shadowBlur = 0
    },
    [pathSet, hasPath, hoveredWord, hoverNeighborSet, hasHover],
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

  // Renders path edges (bright neon) and hover edges (faint neon) in "replace" mode
  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const src = link.source as GraphNode
      const tgt = link.target as GraphNode
      if (src.x == null || src.y == null || tgt.x == null || tgt.y == null) return

      const key = edgeKey(link)
      const isPathEdge = pathEdgeSet.has(key)

      ctx.beginPath()
      ctx.moveTo(src.x, src.y)
      ctx.lineTo(tgt.x, tgt.y)

      if (isPathEdge) {
        ctx.strokeStyle = NEON
        ctx.lineWidth = 2 / globalScale
        ctx.shadowColor = NEON
        ctx.shadowBlur = 8 / globalScale
      } else {
        // Hover edge — dimmer glow
        ctx.strokeStyle = 'rgba(214,255,0,0.3)'
        ctx.lineWidth = 1 / globalScale
        ctx.shadowColor = 'rgba(214,255,0,0.5)'
        ctx.shadowBlur = 4 / globalScale
      }

      ctx.stroke()
      ctx.shadowBlur = 0
    },
    [pathEdgeSet],
  )

  const linkCanvasObjectMode = useCallback(
    (link: any) => {
      const key = edgeKey(link)
      if (pathEdgeSet.has(key) || (hoverEdgeSet?.has(key) ?? false)) return 'replace' as const
      return undefined
    },
    [pathEdgeSet, hoverEdgeSet],
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
            nodeLabel={() => ''}
            onNodeHover={(node: any) => onNodeHover?.(node ? (node.id as string) : null)}
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
