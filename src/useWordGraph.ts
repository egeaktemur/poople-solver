import { useState, useEffect, useRef, useCallback } from 'react'
import GraphWorker from './graph.worker?worker'

export interface GraphNode {
  id: string
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number
  fy?: number
}

export interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
}

export type AnalyticsData = {
  socialites: { word: string; degree: number }[]
  hermits: { word: string; degree: number }[]
  poopHorizon: {
    avgDistance: number
    maxDistance: number
    farthestWords: string[]
    unreachableCount: number
  }
  articulationPoints: { word: string; degree: number }[]
}

type WorkerOutMsg =
  | { type: 'GRAPH_READY'; nodes: { id: string }[]; links: { source: string; target: string }[] }
  | { type: 'PATH_RESULT'; path: string[] | null }
  | { type: 'ANALYTICS_RESULT'; data: AnalyticsData }

export interface WordGraphResult {
  nodes: GraphNode[]
  links: GraphLink[]
  activePath: string[] | null
  isLoading: boolean
  findPath: (word: string) => void
  clearPath: () => void
  pathResultKey: number
  analytics: AnalyticsData | null
  isAnalyticsLoading: boolean
  computeAnalytics: () => void
}

export function useWordGraph(): WordGraphResult {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [activePath, setActivePath] = useState<string[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pathResultKey, setPathResultKey] = useState(0)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false)
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    const worker = new GraphWorker()
    workerRef.current = worker

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data as WorkerOutMsg
      if (msg.type === 'GRAPH_READY') {
        setNodes(msg.nodes)
        setLinks(msg.links as GraphLink[])
        setIsLoading(false)
      } else if (msg.type === 'PATH_RESULT') {
        setActivePath(msg.path)
        setPathResultKey(k => k + 1)
      } else if (msg.type === 'ANALYTICS_RESULT') {
        setAnalytics(msg.data)
        setIsAnalyticsLoading(false)
      }
    }

    fetch(`${import.meta.env.BASE_URL}4-letter-words.txt`)
      .then(r => r.text())
      .then(text => {
        const words = text
          .split('\n')
          .map(w => w.trim().toUpperCase())
          .filter(w => w.length === 4)
        worker.postMessage({ type: 'INIT', words })
      })
      .catch(console.error)

    return () => {
      worker.terminate()
    }
  }, [])

  const findPath = useCallback((word: string) => {
    workerRef.current?.postMessage({ type: 'FIND_PATH', from: word.toUpperCase() })
  }, [])

  const clearPath = useCallback(() => {
    setActivePath(null)
  }, [])

  const computeAnalytics = useCallback(() => {
    setIsAnalyticsLoading(true)
    workerRef.current?.postMessage({ type: 'COMPUTE_ANALYTICS' })
  }, [])

  return {
    nodes,
    links,
    activePath,
    isLoading,
    findPath,
    clearPath,
    pathResultKey,
    analytics,
    isAnalyticsLoading,
    computeAnalytics,
  }
}
