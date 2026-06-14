import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import './App.css'
import { useWordGraph } from './useWordGraph'
import { WordGraph } from './WordGraph'

type Tab = 'network' | 'path'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

function MagneticButton({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 250, damping: 15 })
  const springY = useSpring(y, { stiffness: 250, damping: 15 })

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    x.set((e.clientX - cx) * 0.35)
    y.set((e.clientY - cy) * 0.35)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      className="random-btn"
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      disabled={disabled}
    >
      {children}
    </motion.button>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('network')
  const { nodes, links, activePath, isLoading, findPath, clearPath, pathResultKey } =
    useWordGraph()
  const [pathWord, setPathWord] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const wordSet = useMemo(() => new Set(nodes.map(n => n.id)), [nodes])

  // Keep a ref to activePath so the pathResultKey effect reads the current value
  // without needing activePath in its dependency array
  const activePathRef = useRef<string[] | null>(null)
  activePathRef.current = activePath

  useEffect(() => {
    if (pathResultKey === 0) return
    setIsSearching(false)
    if (activePathRef.current === null) {
      setError('No path to POOP found.')
    }
  }, [pathResultKey])

  const startSearch = (word: string) => {
    const upper = word.trim().toUpperCase()
    if (upper.length !== 4) {
      setError('Enter a 4-letter word.')
      return
    }
    if (!wordSet.has(upper)) {
      setError(`"${upper}" is not in the word list.`)
      return
    }
    if (upper === 'POOP') {
      setError('Already at POOP!')
      return
    }
    setError(null)
    setIsSearching(true)
    clearPath()
    findPath(upper)
  }

  const handleRandom = () => {
    if (nodes.length === 0) return
    const candidates = nodes.filter(n => n.id !== 'POOP')
    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    setPathWord(pick.id)
    setError(null)
    setIsSearching(true)
    clearPath()
    findPath(pick.id)
  }

  return (
    <>
      <div className="ambient-bg" />
      <div className="noise-overlay" />

      <div className="app-layout">
        <motion.header
          className="site-header"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h1 className="site-title">POODLE</h1>
          <p className="site-subtitle">
            The Lexical Path to <span className="poop">POOP</span>.
          </p>
        </motion.header>

        <motion.nav
          className="tab-nav"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
        >
          <button
            className={`tab-btn${activeTab === 'network' ? ' active' : ''}`}
            onClick={() => setActiveTab('network')}
          >
            Word Network
          </button>
          <button
            className={`tab-btn${activeTab === 'path' ? ' active' : ''}`}
            onClick={() => setActiveTab('path')}
          >
            The Path
          </button>
        </motion.nav>

        <motion.main
          className="tab-content"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
        >
          {activeTab === 'network' ? (
            <WordGraph nodes={nodes} links={links} activePath={null} isLoading={isLoading} />
          ) : (
            <div className="path-tab">
              <div className="path-controls">
                <div className="path-input-row">
                  <input
                    className="word-input"
                    type="text"
                    maxLength={4}
                    value={pathWord}
                    onChange={e => {
                      setPathWord(e.target.value.toUpperCase())
                      setError(null)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') startSearch(pathWord)
                    }}
                    placeholder="WORD"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <button
                    className="find-btn"
                    onClick={() => startSearch(pathWord)}
                    disabled={isLoading || isSearching}
                  >
                    {isSearching ? '···' : 'FIND PATH'}
                  </button>
                  <MagneticButton onClick={handleRandom} disabled={isLoading || isSearching}>
                    RANDOM
                  </MagneticButton>
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.p
                      className="error-msg"
                      key={error}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="graph-wrapper">
                <WordGraph
                  nodes={nodes}
                  links={links}
                  activePath={activePath}
                  isLoading={isLoading}
                />

                <AnimatePresence>
                  {activePath && activePath.length > 0 && (
                    <motion.div
                      className="path-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="path-sequence">
                        {activePath.map((word, i) => (
                          <span key={`${word}-${i}`} className="path-token">
                            <motion.span
                              className={`path-word${word === 'POOP' ? ' path-word--poop' : ''}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1, duration: 0.25, ease: 'easeOut' }}
                            >
                              {word}
                            </motion.span>
                            {i < activePath.length - 1 && (
                              <motion.span
                                className="path-arrow"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.1 + 0.15, duration: 0.15 }}
                              >
                                →
                              </motion.span>
                            )}
                          </span>
                        ))}
                      </div>
                      <motion.p
                        className="path-meta"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: activePath.length * 0.1 + 0.15 }}
                      >
                        {activePath.length - 1} step{activePath.length - 1 !== 1 ? 's' : ''} to POOP
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.main>
      </div>
    </>
  )
}

export default App
