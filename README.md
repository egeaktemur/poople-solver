# POODLE

**The Lexical Path to POOP.**

Navigate from any valid 4-letter word to **POOP** by changing exactly one letter at a time. Every intermediate word must also be a valid dictionary word.

Navigate from any 4-letter word to POOP. Displaying the network of 4 letter words, finds the shortest path.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + Native CSS (variables, keyframes) |
| Graph rendering | `react-force-graph-2d` (Canvas-based) |
| Animation | Framer Motion |
| Graph computation | Web Worker (BFS, adjacency list) |
| Fonts | Syne (display) + DM Mono (data/nodes) |
| Deployment | GitHub Pages |

---

## How it works

1. ~2,000 four-letter words are loaded from `public/4-letter-words.txt`.
2. A Web Worker builds an adjacency graph in O(N) time: for each word, every single-character substitution is tested against a Set for O(1) lookup.
3. Breadth-First Search finds the shortest path from any word to **POOP**.
4. The path is visualised on a force-directed graph, with Chartreuse (`#D6FF00`) highlighting the route and a Magenta (`#FF007F`) explosion marking the target.

---

## Local development

```bash
npm install
npm run dev
```

## Build & deploy

```bash
npm run build      # outputs to dist/
npm run preview    # local preview of the production build
```

The GitHub Pages deployment uses the base path `/poople-solver/` (configured in `vite.config.ts`).

---

## Design tokens

```
Background      #141213   Deep Espresso
Text            #EFECE6   Off-White/Bone
Accent (path)   #D6FF00   Neon Chartreuse
Accent (POOP)   #FF007F   Electric Magenta
Node default    #4A4446   Dim Taupe
```

Typography: **Syne ExtraBold** for headings, **DM Mono** for all word/data display.
