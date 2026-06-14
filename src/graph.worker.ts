// Minimal interface for the worker global scope (avoids DedicatedWorkerGlobalScope lib dep)
interface WorkerCtx {
  onmessage: ((e: MessageEvent) => unknown) | null
  postMessage(data: unknown): void
}
const ctx = self as unknown as WorkerCtx

type WorkerInMsg =
  | { type: 'INIT'; words: string[] }
  | { type: 'FIND_PATH'; from: string }
  | { type: 'COMPUTE_ANALYTICS' }

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

function computeSocialites(): AnalyticsData['socialites'] {
  return [...adjacency.entries()]
    .map(([word, neighbors]) => ({ word, degree: neighbors.length }))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 5)
}

function computeHermits(): AnalyticsData['hermits'] {
  return [...adjacency.entries()]
    .filter(([, neighbors]) => neighbors.length <= 1)
    .map(([word, neighbors]) => ({ word, degree: neighbors.length }))
    .sort((a, b) => a.degree - b.degree)
}

function computePoopHorizon(): AnalyticsData['poopHorizon'] {
  if (!wordSet.has('POOP')) {
    return { avgDistance: 0, maxDistance: 0, farthestWords: [], unreachableCount: wordSet.size }
  }

  // Single BFS from POOP outward reaches all connected words in O(V+E)
  const distances = new Map<string, number>([['POOP', 0]])
  const queue: string[] = ['POOP']

  while (queue.length > 0) {
    const word = queue.shift()!
    const dist = distances.get(word)!
    for (const neighbor of adjacency.get(word) ?? []) {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, dist + 1)
        queue.push(neighbor)
      }
    }
  }

  let total = 0
  let maxDist = 0
  const farthestWords: string[] = []
  let unreachableCount = 0

  for (const word of wordSet) {
    if (word === 'POOP') continue
    if (!distances.has(word)) {
      unreachableCount++
      continue
    }
    const d = distances.get(word)!
    total += d
    if (d > maxDist) {
      maxDist = d
      farthestWords.length = 0
      farthestWords.push(word)
    } else if (d === maxDist) {
      farthestWords.push(word)
    }
  }

  const reachableCount = distances.size - 1 // exclude POOP itself
  const avgDistance = reachableCount > 0 ? total / reachableCount : 0

  return { avgDistance, maxDistance: maxDist, farthestWords, unreachableCount }
}

// Standard iterative Tarjan's bridge/AP algorithm — avoids call-stack overflow on large components
function computeArticulationPoints(): AnalyticsData['articulationPoints'] {
  const disc = new Map<string, number>()
  const low = new Map<string, number>()
  const parent = new Map<string, string | null>()
  const childCount = new Map<string, number>()
  const ap = new Set<string>()
  let timer = 0

  // Iterative DFS using an explicit stack of [vertex, neighborIndex] pairs
  for (const root of wordSet) {
    if (disc.has(root)) continue

    parent.set(root, null)
    childCount.set(root, 0)
    const stack: [string, number][] = [[root, 0]]
    disc.set(root, timer)
    low.set(root, timer)
    timer++

    while (stack.length > 0) {
      const frame = stack[stack.length - 1]
      const u = frame[0]
      const neighbors = adjacency.get(u) ?? []

      if (frame[1] < neighbors.length) {
        const v = neighbors[frame[1]++]

        if (!disc.has(v)) {
          parent.set(v, u)
          childCount.set(v, 0)
          disc.set(v, timer)
          low.set(v, timer)
          timer++
          // Increment parent's child count when we first discover v from u
          if (parent.get(u) === null) {
            childCount.set(u, (childCount.get(u) ?? 0) + 1)
          }
          stack.push([v, 0])
        } else if (v !== parent.get(u)) {
          // Back edge: update low[u]
          low.set(u, Math.min(low.get(u)!, disc.get(v)!))
        }
      } else {
        // Done with u — pop and propagate low values upward
        stack.pop()
        if (stack.length > 0) {
          const p = stack[stack.length - 1][0]
          low.set(p, Math.min(low.get(p)!, low.get(u)!))

          const par = parent.get(p) ?? null
          // AP condition for non-root: low[u] >= disc[p]
          if (par !== null && low.get(u)! >= disc.get(p)!) {
            ap.add(p)
          }
        }
      }
    }

    // Root is an AP if it has more than one DFS child
    if ((childCount.get(root) ?? 0) > 1) {
      ap.add(root)
    }
  }

  return [...ap]
    .map(word => ({ word, degree: adjacency.get(word)?.length ?? 0 }))
    .sort((a, b) => b.degree - a.degree)
}

function computeAnalytics(): AnalyticsData {
  return {
    socialites: computeSocialites(),
    hermits: computeHermits(),
    poopHorizon: computePoopHorizon(),
    articulationPoints: computeArticulationPoints(),
  }
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
  } else if (msg.type === 'COMPUTE_ANALYTICS') {
    const data = computeAnalytics()
    const response: WorkerOutMsg = { type: 'ANALYTICS_RESULT', data }
    ctx.postMessage(response)
  }
}
