import { useState, useEffect, useRef, useCallback } from 'react'
import GraphWorker from './graph.worker?worker'

export interface GraphNode {
  id: string
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

export interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
}

type WorkerOutMsg =
  | { type: 'GRAPH_READY'; nodes: { id: string }[]; links: { source: string; target: string }[] }
  | { type: 'PATH_RESULT'; path: string[] | null }

export interface WordGraphResult {
  nodes: GraphNode[]
  links: GraphLink[]
  activePath: string[] | null
  isLoading: boolean
  findPath: (word: string) => void
  clearPath: () => void
}

export function useWordGraph(): WordGraphResult {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [activePath, setActivePath] = useState<string[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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

  return { nodes, links, activePath, isLoading, findPath, clearPath }
}
