import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface NeighborInfo {
  word: string
  degree: number
}

interface Props {
  word: string | null
  neighbors: NeighborInfo[]
  x: number
  y: number
}

const MAX_VISIBLE = 8

export function HoverCard({ word, neighbors, x, y }: Props) {
  const sorted = useMemo(
    () => [...neighbors].sort((a, b) => b.degree - a.degree),
    [neighbors],
  )
  const visible = sorted.slice(0, MAX_VISIBLE)
  const overflow = sorted.length - MAX_VISIBLE

  // Flip card left if it would overflow the right edge
  const cardWidth = 220
  const flipLeft = x + cardWidth + 20 > window.innerWidth
  const left = flipLeft ? x - cardWidth - 12 : x + 16
  const top = y - 8

  return (
    <AnimatePresence>
      {word && (
        <motion.div
          key={word}
          className="hover-card"
          style={{ left, top }}
          initial={{ opacity: 0, y: 4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.1 }}
        >
          <div className="hover-card-header">{word}</div>
          <div className="hover-card-divider">LEXICAL ORBIT</div>
          <div className="hover-card-list">
            {visible.map((n, i) => (
              <div key={n.word} className="hover-card-item">
                <span className="hover-card-rank">{String(i + 1).padStart(2, '0')}.</span>
                <span className="hover-card-neighbor">{n.word}</span>
                <span className="hover-card-degree">[{n.degree}]</span>
              </div>
            ))}
            {overflow > 0 && (
              <div className="hover-card-more">+ {overflow} more</div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
