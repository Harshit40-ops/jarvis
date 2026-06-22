import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Search, Trash2, Database, User, Settings } from 'lucide-react'
import { useJarvisStore } from '../store/jarvisStore'

const CATEGORY_ICONS = { profile: User, preference: Settings, general: Database }
const CATEGORY_COLORS = { profile: '#00d4ff', preference: '#ff6600', general: '#0066ff' }

export default function Memory() {
  const { memories } = useJarvisStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = memories.filter((m) => {
    const matchSearch = !search || m.key.includes(search) || m.value.includes(search)
    const matchFilter = filter === 'all' || m.category === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="flex flex-col h-full p-4 gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain size={18} color="#00d4ff" />
          <span className="hud-title text-sm">MEMORY CORE</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}
          >
            <Search size={12} color="rgba(0,212,255,0.5)" />
            <input
              className="bg-transparent text-xs font-mono outline-none"
              style={{ color: '#00d4ff', caretColor: '#00d4ff', width: 150 }}
              placeholder="Search memory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'profile', 'preference', 'general'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="px-3 py-1 rounded text-xxs font-hud transition-all"
            style={{
              background: filter === cat ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.04)',
              border: `1px solid ${filter === cat ? 'rgba(0,212,255,0.4)' : 'rgba(0,212,255,0.1)'}`,
              color: filter === cat ? '#00d4ff' : 'rgba(0,212,255,0.5)',
              letterSpacing: '0.1em',
            }}
          >
            {cat.toUpperCase()}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-xxs font-mono self-center" style={{ color: 'rgba(0,212,255,0.4)' }}>
          {filtered.length} nodes
        </span>
      </div>

      {/* Memory grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-3">
          <AnimatePresence>
            {filtered.map((m, i) => {
              const Icon = CATEGORY_ICONS[m.category] || Database
              const color = CATEGORY_COLORS[m.category] || '#00d4ff'
              return (
                <motion.div
                  key={`${m.key}-${i}`}
                  className="glass-panel hud-border rounded-lg p-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02, borderColor: 'rgba(0,212,255,0.3)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="p-1.5 rounded"
                      style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                    >
                      <Icon size={12} color={color} />
                    </div>
                    <span
                      className="text-xxs px-1.5 py-0.5 rounded"
                      style={{ background: `${color}15`, color, fontSize: '0.55rem', letterSpacing: '0.1em' }}
                    >
                      {m.category?.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs font-hud mb-1" style={{ color: '#00d4ff' }}>{m.key}</div>
                  <div className="text-xs font-mono" style={{ color: 'rgba(0,212,255,0.7)' }}>{m.value}</div>
                  <div className="text-xxs mt-2" style={{ color: 'rgba(0,212,255,0.3)' }}>{m.time}</div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Brain size={32} color="rgba(0,212,255,0.2)" />
            <span className="text-xs font-hud" style={{ color: 'rgba(0,212,255,0.3)' }}>NO MEMORY NODES FOUND</span>
          </div>
        )}
      </div>
    </div>
  )
}
