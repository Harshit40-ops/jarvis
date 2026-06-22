import { motion } from 'framer-motion'
import { User, Shield, Database, Terminal, Smartphone } from 'lucide-react'
import { useJarvisStore } from '../store/jarvisStore'

function PanelSection({ title, icon: Icon, children }) {
  return (
    <div className="hud-border glass-panel rounded-lg p-3 mb-2">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={12} color="#00d4ff" />
        <span className="text-xxs font-hud" style={{ color: 'rgba(0,212,255,0.6)', letterSpacing: '0.18em' }}>
          {title}
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.12)' }} />
      </div>
      {children}
    </div>
  )
}

export default function LeftPanel() {
  const { stats, memories, recentCommands, phoneConnected, settings } = useJarvisStore()

  const systemChecks = [
    { label: 'Core Systems', ok: true },
    { label: 'Voice Engine', ok: true },
    { label: 'AI Module', ok: true },
    { label: 'Phone Bridge', ok: phoneConnected },
    { label: 'Vision Module', ok: false },
  ]

  return (
    <motion.div
      className="h-full overflow-y-auto p-2 flex flex-col"
      style={{ width: 240 }}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* User Profile */}
      <PanelSection title="USER PROFILE" icon={User}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.3)',
              boxShadow: '0 0 15px rgba(0,212,255,0.1)',
            }}
          >
            <span className="font-hud text-sm font-bold" style={{ color: '#00d4ff' }}>
              {settings.userName[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <div className="text-xs font-bold" style={{ color: '#00d4ff' }}>{settings.userName}</div>
            <div className="text-xxs" style={{ color: 'rgba(0,212,255,0.5)' }}>ADMIN • LEVEL 5</div>
          </div>
        </div>
        <div className="text-xxs space-y-1" style={{ color: 'rgba(0,212,255,0.5)' }}>
          <div className="flex justify-between">
            <span>Session</span>
            <span style={{ color: '#00d4ff' }}>Active</span>
          </div>
          <div className="flex justify-between">
            <span>Clearance</span>
            <span style={{ color: '#00d4ff' }}>ALPHA</span>
          </div>
          <div className="flex justify-between">
            <span>Commands</span>
            <span style={{ color: '#ff6600' }}>{recentCommands.length}</span>
          </div>
        </div>
      </PanelSection>

      {/* System Status */}
      <PanelSection title="SYSTEM STATUS" icon={Shield}>
        <div className="space-y-2">
          {systemChecks.map(({ label, ok }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xxs" style={{ color: 'rgba(0,212,255,0.6)' }}>{label}</span>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: ok ? '#00ff88' : '#ff3344',
                    boxShadow: `0 0 6px ${ok ? '#00ff88' : '#ff3344'}`,
                  }}
                />
                <span className="text-xxs font-mono" style={{ color: ok ? '#00ff88' : '#ff3344' }}>
                  {ok ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </PanelSection>

      {/* Memory Overview */}
      <PanelSection title="MEMORY NODES" icon={Database}>
        <div className="space-y-1.5">
          {memories.slice(0, 4).map((m, i) => (
            <motion.div
              key={i}
              className="flex items-center justify-between p-1.5 rounded"
              style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.08)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div>
                <div className="text-xxs font-mono" style={{ color: '#00d4ff' }}>{m.key}</div>
                <div className="text-xxs" style={{ color: 'rgba(255,102,0,0.8)' }}>{m.value}</div>
              </div>
              <span
                className="text-xxs px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(0,102,255,0.15)', color: '#0066ff', fontSize: '0.55rem' }}
              >
                {m.category?.toUpperCase()}
              </span>
            </motion.div>
          ))}
          <div className="text-xxs text-center mt-1" style={{ color: 'rgba(0,212,255,0.3)' }}>
            {memories.length} total nodes
          </div>
        </div>
      </PanelSection>

      {/* Recent Commands */}
      <PanelSection title="RECENT COMMANDS" icon={Terminal}>
        <div className="space-y-1">
          {recentCommands.slice(0, 5).map((cmd, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-1.5 rounded"
              style={{ background: 'rgba(0,212,255,0.03)', border: '1px solid rgba(0,212,255,0.06)' }}
            >
              <span style={{ color: '#ff6600', fontSize: '0.6rem' }}>›</span>
              <span className="text-xxs font-mono truncate" style={{ color: 'rgba(0,212,255,0.7)' }}>
                {cmd}
              </span>
            </div>
          ))}
        </div>
      </PanelSection>
    </motion.div>
  )
}
