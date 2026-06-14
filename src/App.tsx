import { useState } from 'react'
import { motion } from 'framer-motion'
import './App.css'

type Tab = 'network' | 'path'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('network')

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
            <div className="placeholder-pane">
              <span className="placeholder-label">_ Network View</span>
            </div>
          ) : (
            <div className="placeholder-pane">
              <span className="placeholder-label">_ Path View</span>
            </div>
          )}
        </motion.main>
      </div>
    </>
  )
}

export default App
