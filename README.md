# POODLE

**The Lexical Path to POOP.**

POODLE is a word-ladder visualiser with a fixed destination: **POOP**. Starting from any valid 4-letter word, the app finds the shortest chain of single-letter substitutions that leads to POOP, with every step also being a valid English word.

For example:

```
BELT → MELT → MALT → MALT → MALL → BALL → BOLL → BOWL → FOWL → FOOL → POOL → POOP
```

The full network of ~2,250 four-letter words is rendered as a live force-directed graph, so you can see the structure of the entire lexical space—which words are densely connected, which are isolated, and exactly where POOP sits in the graph.

---

## Features

### Word Network tab

Live force-directed graph of all ~2,250 four-letter words. Hovering over any node triggers the **Lexical Orbit** panel:

- The hovered word is highlighted in bone white with a glow.
- All immediate neighbours are highlighted in dim chartreuse, connected to the hovered node via glowing edges.
- A floating editorial card lists the neighbours ranked by their own connectivity (degree).

### The Path tab

Enter any 4-letter word and find the shortest path to POOP via BFS. The path is animated on the graph and displayed as a word chain below it.

### Analyze tab

A deep statistical dashboard computed in the Web Worker on first visit:

| Section | What it shows |
|---|---|
| **Socialites** | Top 5 words by number of valid 1-letter mutations (highest degree) |
| **Hermits** | Words with zero or one connection — the lexical loners |
| **POOP Horizon** | Average / maximum / unreachable counts from BFS out of POOP |
| **Critical Vulnerabilities** | Articulation points — words whose removal would shatter the graph into disconnected islands |

---

## How the graph is built

### Word list

All words are loaded from `public/4-letter-words.txt` — a curated list of ~2,250 valid English four-letter words. Every word is normalised to uppercase.

### Adjacency construction (O(N) per word)

A naïve approach would compare every word against every other word to find one-letter neighbours — O(N²) with N ≈ 2,250, which produces ~5 million comparisons. Instead, the graph is built in O(N × 4 × 26) ≈ O(N) time:

1. All words are loaded into a `Set` for O(1) membership testing.
2. For each word, every position (0–3) is iterated, and each of the 26 letters A–Z is substituted at that position.
3. If the resulting candidate exists in the `Set` and differs from the original word, an edge is recorded between them.

This produces an undirected graph of roughly 2,250 nodes and ~20,000 edges.

### Shortest path (BFS)

Finding the shortest path to POOP is a classic unweighted shortest-path problem, solved with **Breadth-First Search**:

- BFS explores the graph level by level, so the first time it reaches POOP it is guaranteed to have taken the fewest steps possible.
- Each state in the queue carries the full path taken so far, so the result is returned directly without backtracking.
- If no path exists (some words are in isolated components of the graph), `null` is returned.

### Analytics (computed lazily in the Worker)

When the Analyze tab is first opened, the worker receives `COMPUTE_ANALYTICS` and runs four calculations:

- **Socialites** — sort all words by `adjacency.get(word).length` descending, take top 5.
- **Hermits** — filter for degree ≤ 1.
- **POOP Horizon** — single BFS *from* POOP to all reachable words; computes average/max distance and lists unreachable words.
- **Articulation Points** — iterative Tarjan's algorithm (DFS-based, O(V+E)) finds all words whose removal disconnects the graph. Returned sorted by degree descending.

### Web Worker

All heavy computation (graph build, BFS, analytics) runs inside a **Web Worker**, keeping the main thread free. The worker handles three message types:

| Message (in) | Response (out) | When |
|---|---|---|
| `INIT` | `GRAPH_READY` | On app load — sends nodes + deduplicated edges |
| `FIND_PATH` | `PATH_RESULT` | On path search — sends path array or `null` |
| `COMPUTE_ANALYTICS` | `ANALYTICS_RESULT` | On first Analyze tab open |

---

## Graph rendering

The graph is rendered with [`react-force-graph-2d`](https://github.com/vasturiano/react-force-graph), a React wrapper around [`force-graph`](https://github.com/vasturiano/force-graph), which in turn uses **d3-force** for physics simulation and draws everything onto an HTML **Canvas** element.

Canvas rendering is mandatory here. DOM-based graph libraries (e.g. those that create one element per node) become unusable at 2,000+ nodes due to layout/paint cost. Canvas draws all nodes and edges in a single rasterisation pass, keeping frame rate acceptable even at this scale.

### Custom canvas drawing

The library exposes `nodeCanvasObject` and `linkCanvasObject` callbacks that receive the raw `CanvasRenderingContext2D`. POODLE uses these to draw five distinct node states:

| Node state | Radius | Colour |
|---|---|---|
| Default | 2 / zoom | `#4A4446` (dimmed when hover or path active) |
| On shortest path | 5 / zoom | `#D6FF00` |
| Hover neighbour | 3.5 / zoom | `rgba(214,255,0,0.65)` |
| Hovered | 6 / zoom | `#EFECE6` (bone white) |
| POOP | 8 / zoom | `#FF007F` |

Dividing by `globalScale` (the current zoom level) keeps nodes and edge widths visually consistent regardless of how far the user has zoomed in or out.

`linkCanvasObjectMode` returns `"replace"` for both path edges and hover edges, so the library's default renderer handles the other ~20,000 edges efficiently. The single `linkCanvasObject` callback then distinguishes path edges (bright chartreuse, width 2) from hover edges (dim chartreuse, width 1) via `pathEdgeSet`.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + native CSS (variables, keyframes) |
| Graph rendering | `react-force-graph-2d` (Canvas) |
| Physics simulation | `d3-force` (via force-graph) |
| Animation | Framer Motion |
| Graph computation | Web Worker |
| Shortest path | Breadth-First Search |
| Analytics | BFS (POOP Horizon) + iterative Tarjan's AP algorithm |
| Deployment | GitHub Pages |

---

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # local preview of the production build
```

The GitHub Pages deployment uses the base path `/poople-solver/` (set in `vite.config.ts`).
