// Minimal interface for the worker global scope (avoids DedicatedWorkerGlobalScope lib dep)
interface WorkerCtx {
  onmessage: ((e: MessageEvent) => unknown) | null
  postMessage(data: unknown): void
}
const ctx = self as unknown as WorkerCtx

type WorkerInMsg =
  | { type: 'INIT'; words: string[] }
  | { type: 'FIND_PATH'; from: string }

type WorkerOutMsg =
  | { type: 'GRAPH_READY'; nodes: { id: string }[]; links: { source: string; target: string }[] }
  | { type: 'PATH_RESULT'; path: string[] | null }

let adjacency = new Map<string, string[]>()
let wordSet = new Set<string>()

function buildGraph(words: string[]): void {
  wordSet = new Set(words)
  adjacency = new Map()

  for (const word of words) {
    adjacency.set(word, [])
  }

  for (const word of words) {
    const neighbors = adjacency.get(word)!
    for (let i = 0; i < word.length; i++) {
      for (let c = 65; c <= 90; c++) {
        const candidate = word.slice(0, i) + String.fromCharCode(c) + word.slice(i + 1)
        if (candidate !== word && wordSet.has(candidate)) {
          neighbors.push(candidate)
        }
      }
    }
  }
}

function bfs(start: string): string[] | null {
  if (!wordSet.has(start)) return null
  if (start === 'POOP') return ['POOP']

  const visited = new Set<string>([start])
  const queue: string[][] = [[start]]

  while (queue.length > 0) {
    const path = queue.shift()!
    const node = path[path.length - 1]

    for (const neighbor of adjacency.get(node) ?? []) {
      if (neighbor === 'POOP') return [...path, 'POOP']
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push([...path, neighbor])
      }
    }
  }

  return null
}

ctx.onmessage = (e: MessageEvent) => {
  const msg = e.data as WorkerInMsg

  if (msg.type === 'INIT') {
    buildGraph(msg.words)

    const nodes = msg.words.map(id => ({ id }))

    // Deduplicate undirected edges before sending to force-graph
    const links: { source: string; target: string }[] = []
    const seen = new Set<string>()
    for (const [word, neighbors] of adjacency) {
      for (const neighbor of neighbors) {
        const key = word < neighbor ? `${word}|${neighbor}` : `${neighbor}|${word}`
        if (!seen.has(key)) {
          seen.add(key)
          links.push({ source: word, target: neighbor })
        }
      }
    }

    const response: WorkerOutMsg = { type: 'GRAPH_READY', nodes, links }
    ctx.postMessage(response)
  } else if (msg.type === 'FIND_PATH') {
    const path = bfs(msg.from)
    const response: WorkerOutMsg = { type: 'PATH_RESULT', path }
    ctx.postMessage(response)
  }
}
