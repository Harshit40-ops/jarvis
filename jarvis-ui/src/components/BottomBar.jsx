import { motion } from 'framer-motion'
import { Cpu, MemoryStick, Monitor, Activity } from 'lucide-react'
import { useJarvisStore } from '../store/jarvisStore'

function StatBar({ label, value, color, unit = '%', icon: Icon }) {
  const isWarning = value > 80
  const barColor = isWarning ? '#ff6600' : color

  return (
    <div className="flex items-center gap-3 flex-1">
      <Icon size={13} color={barColor} style={{ flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xxs font-hud" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.12em' }}>
            {label}
          </span>
          <motion.span
            key={Math.round(value)}
            className="text-xxs font-mono font-bold"
            style={{ color: barColor }}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
          >
            {typeof value === 'number' ? `${Math.round(value)}${unit}` : value}
          </motion.span>
        </div>
        <div className="stat-bar">
          <motion.div
            className="stat-bar-fill"
            style={{ background: `linear-gradient(90deg, ${barColor}88, ${barColor})` }}
            animate={{ width: `${Math.min(100, value)}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}

export default function BottomBar() {
  const stats = useJarvisStore((s) => s.stats)

  return (
    <div
      className="flex items-center px-4 h-10 gap-6 flex-shrink-0"
      style={{
        background: 'rgba(0,0,0,0.85)',
        borderTop: '1px solid rgba(0,212,255,0.12)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <StatBar label="CPU" value={stats.cpu} color="#00d4ff" icon={Cpu} />
      <div className="w-px h-4" style={{ background: 'rgba(0,212,255,0.15)' }} />

      <StatBar label="RAM" value={stats.ram} color="#0066ff" icon={MemoryStick} />
      <div className="w-px h-4" style={{ background: 'rgba(0,212,255,0.15)' }} />

      <StatBar label="GPU" value={stats.gpu} color="#aa44ff" icon={Monitor} />
      <div className="w-px h-4" style={{ background: 'rgba(0,212,255,0.15)' }} />

      {/* Network */}
      <div className="flex items-center gap-3 flex-1">
        <Activity size={13} color="#ff6600" style={{ flexShrink: 0 }} />
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className="text-xxs font-hud" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.12em' }}>NET</span>
            <span className="text-xxs font-mono" style={{ color: '#ff6600' }}>
              ↑{stats.netUp.toFixed(1)} ↓{stats.netDown.toFixed(1)} MB/s
            </span>
          </div>
          <div className="stat-bar">
            <motion.div
              className="stat-bar-fill"
              style={{ background: 'linear-gradient(90deg, #ff660088, #ff6600)' }}
              animate={{ width: `${Math.min(100, (stats.netDown / 10) * 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <div className="w-px h-4" style={{ background: 'rgba(0,212,255,0.15)' }} />

      {/* System info */}
      <div className="text-xxs font-mono" style={{ color: 'rgba(0,212,255,0.3)', whiteSpace: 'nowrap' }}>
        JARVIS OS • BUILD 2026.06
      </div>
    </div>
  )
}
