import { motion } from 'framer-motion'
import type { AnalyticsData } from './useWordGraph'

interface Props {
  analytics: AnalyticsData | null
  isLoading: boolean
  onWordHover?: (word: string | null) => void
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const section = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
}

export function AnalyzeTab({ analytics, isLoading, onWordHover }: Props) {
  if (isLoading || !analytics) {
    return (
      <div className="analyze-loading">
        <span className="graph-loading-cursor">_</span>
        <span className="analyze-loading-label">COMPUTING ANALYTICS</span>
      </div>
    )
  }

  const { socialites, hermits, poopHorizon, articulationPoints } = analytics
  const visibleAPs = articulationPoints.slice(0, 24)
  const apOverflow = articulationPoints.length - visibleAPs.length

  const hoverProps = (word: string) => ({
    onMouseEnter: () => onWordHover?.(word),
    onMouseLeave: () => onWordHover?.(null),
    style: { cursor: 'default' as const },
  })

  return (
    <motion.div
      className="analyze-tab"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {/* 01 — SOCIALITES */}
      <motion.section className="analyze-section" variants={section}>
        <div className="analyze-section-tag">01 / SOCIALITES</div>
        <h2 className="analyze-section-heading">Most Connected</h2>
        <p className="analyze-section-sub">
          Words with the highest number of valid 1-letter mutations.
        </p>
        <div className="socialite-list">
          {socialites.map((s, i) => (
            <div key={s.word} className="socialite-row" {...hoverProps(s.word)}>
              <span className="socialite-rank">0{i + 1}</span>
              <span className="socialite-word">{s.word}</span>
              <span className="socialite-degree">{s.degree}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* 02 — HERMITS */}
      <motion.section className="analyze-section" variants={section}>
        <div className="analyze-section-tag">02 / HERMITS</div>
        <h2 className="analyze-section-heading">Isolated Nodes</h2>
        <p className="analyze-section-sub">
          {hermits.length} words with zero or one valid connection.
        </p>
        <div className="hermit-list">
          {hermits.slice(0, 40).map(h => (
            <span
              key={h.word}
              className={`hermit-word hermit-word--${h.degree}`}
              {...hoverProps(h.word)}
            >
              {h.word}
            </span>
          ))}
          {hermits.length > 40 && (
            <span className="hermit-more">+{hermits.length - 40} more</span>
          )}
        </div>
      </motion.section>

      {/* 03 — POOP HORIZON */}
      <motion.section className="analyze-section analyze-section--wide" variants={section}>
        <div className="analyze-section-tag">03 / POOP HORIZON</div>
        <h2 className="analyze-section-heading">Distance to POOP</h2>
        <p className="analyze-section-sub">
          BFS from POOP across the entire graph, measuring how far each word sits from the
          destination.
        </p>
        <div className="horizon-stats">
          <div className="horizon-stat">
            <span className="horizon-stat-num">{poopHorizon.avgDistance.toFixed(1)}</span>
            <span className="horizon-stat-label">AVG STEPS</span>
          </div>
          <div className="horizon-stat">
            <span className="horizon-stat-num">{poopHorizon.maxDistance}</span>
            <span className="horizon-stat-label">MAX STEPS</span>
          </div>
          <div className="horizon-stat">
            <span className="horizon-stat-num">{poopHorizon.unreachableCount}</span>
            <span className="horizon-stat-label">UNREACHABLE</span>
          </div>
        </div>
        {poopHorizon.farthestWords.length > 0 && (
          <div className="horizon-farthest">
            <span className="horizon-farthest-label">
              FARTHEST WORD{poopHorizon.farthestWords.length > 1 ? 'S' : ''}
            </span>
            <span className="horizon-farthest-words">
              {poopHorizon.farthestWords.map((w, i) => (
                <span key={w} {...hoverProps(w)}>
                  {w}{i < poopHorizon.farthestWords.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </span>
          </div>
        )}
      </motion.section>

      {/* 04 — ARTICULATION POINTS */}
      <motion.section className="analyze-section analyze-section--wide" variants={section}>
        <div className="analyze-section-tag">04 / CRITICAL VULNERABILITIES</div>
        <h2 className="analyze-section-heading analyze-section-heading--magenta">
          Lexical Bottlenecks
        </h2>
        <p className="analyze-section-sub">
          {articulationPoints.length} articulation points — words whose removal would shatter
          the graph into disconnected islands, severing certain words from POOP forever.
        </p>
        <div className="ap-list">
          {visibleAPs.map(ap => (
            <span key={ap.word} className="ap-word" {...hoverProps(ap.word)}>
              {ap.word}
              <span className="ap-degree">[{ap.degree}]</span>
            </span>
          ))}
          {apOverflow > 0 && (
            <span className="ap-more">+{apOverflow} more</span>
          )}
        </div>
      </motion.section>
    </motion.div>
  )
}
