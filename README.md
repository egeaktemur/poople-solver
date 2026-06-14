# POODLE

**The Lexical Path to POOP.**

POODLE is a word-ladder visualiser with a fixed destination: **POOP**. Starting from any valid 4-letter word, the app finds the shortest chain of single-letter substitutions that leads to POOP, with every step also being a valid English word.

For example:

```
BELT → MELT → MALT → MALT → MALL → BALL → BOLL → BOWL → FOWL → FOOL → POOL → POOP
```

The full network of ~2,250 four-letter words is rendered as a live force-directed graph, so you can see the structure of the entire lexical space—which words are densely connected, which are isolated, and exactly where POOP sits in the graph.

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

### Web Worker

Both the adjacency list construction and BFS run entirely inside a **Web Worker**, keeping the main thread free. The UI never blocks while the graph is being built or while a path search is in progress. The worker communicates with the main thread via two message types:

- `GRAPH_READY` — sent once after `INIT`, carries all nodes and deduplicated edges.
- `PATH_RESULT` — sent in response to `FIND_PATH`, carries the path array or `null`.

---

## Graph rendering

The graph is rendered with [`react-force-graph-2d`](https://github.com/vasturiano/react-force-graph), a React wrapper around [`force-graph`](https://github.com/vasturiano/force-graph), which in turn uses **d3-force** for physics simulation and draws everything onto an HTML **Canvas** element.

Canvas rendering is mandatory here. DOM-based graph libraries (e.g. those that create one element per node) become unusable at 2,000+ nodes due to layout/paint cost. Canvas draws all nodes and edges in a single rasterisation pass, keeping frame rate acceptable even at this scale.

### Custom canvas drawing

The library exposes `nodeCanvasObject` and `linkCanvasObject` callbacks that receive the raw `CanvasRenderingContext2D`. POODLE uses these to draw three distinct node states:

| Node state | Radius | Colour |
|---|---|---|
| Default | 2 / zoom | `#4A4446` |
| On shortest path | 5 / zoom | `#D6FF00` |
| POOP | 8 / zoom | `#FF007F` |

Dividing by `globalScale` (the current zoom level) keeps nodes and edge widths visually consistent regardless of how far the user has zoomed in or out.

Path edges are drawn with a custom `linkCanvasObject` that adds a coloured stroke with `shadowBlur` for the glow effect. `linkCanvasObjectMode` returns `"replace"` only for path edges so the library's default renderer handles the other ~20,000 edges efficiently.

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
