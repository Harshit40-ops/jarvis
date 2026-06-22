import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wifi, WifiOff, Minus, Square, X, Maximize2 } from 'lucide-react'
import { useJarvisStore } from '../store/jarvisStore'

export default function TopBar() {
  const [time, setTime] = useState(new Date())
  const [online, setOnline] = useState(navigator.onLine)
  const aiState = useJarvisStore((s) => s.aiState)
  const phoneConnected = useJarvisStore((s) => s.phoneConnected)
  const backendOnline = useJarvisStore((s) => s.backendOnline)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { clearInterval(t); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])

  const hh = time.getHours().toString().padStart(2, '0')
  const mm = time.getMinutes().toString().padStart(2, '0')
  const ss = time.getSeconds().toString().padStart(2, '0')
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })

  const stateColor = { idle: '#00d4ff', listening: '#00ff88', speaking: '#ff6600', thinking: '#ffaa00' }[aiState]
  const stateLabel = { idle: 'STANDBY', listening: 'LISTENING', speaking: 'SPEAKING', thinking: 'PROCESSING' }[aiState]

  return (
    <div
      className="flex items-center justify-between px-4 h-12 flex-shrink-0 select-none"
      style={{
        background: 'rgba(0,0,0,0.8)',
        borderBottom: '1px solid rgba(0,212,255,0.15)',
        backdropFilter: 'blur(20px)',
        WebkitAppRegion: 'drag',
      }}
    >
      {/* Left — title */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-1 h-4 rounded-full" style={{ background: `rgba(0,212,255,${0.3 + i * 0.3})` }} />
          ))}
        </div>
        <span className="hud-title text-xs tracking-widest" style={{ letterSpacing: '0.3em' }}>
          JARVIS AI OPERATING SYSTEM
        </span>
        <span className="text-xxs" style={{ color: 'rgba(0,212,255,0.4)' }}>v2.0.0</span>
      </div>

      {/* Center — time */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
        <div className="text-center">
          <div className="font-hud text-lg font-bold tracking-widest neon-cyan">
            {hh}<span style={{ opacity: 0.5, animation: 'typing-cursor 1s step-end infinite' }}>:</span>{mm}<span style={{ opacity: 0.5 }}>:</span>
            <span style={{ color: 'rgba(0,212,255,0.6)', fontSize: '0.85em' }}>{ss}</span>
          </div>
          <div className="text-xxs" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.1em' }}>{dateStr.toUpperCase()}</div>
        </div>
      </div>

      {/* Right — status + controls */}
      <div
        className="flex items-center gap-4"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {/* AI state */}
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: stateColor, boxShadow: `0 0 8px ${stateColor}` }}
            animate={{ scale: aiState === 'listening' ? [1, 1.4, 1] : 1 }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <span className="text-xxs font-hud" style={{ color: stateColor, letterSpacing: '0.15em' }}>{stateLabel}</span>
        </div>

        {/* Separators */}
        <div className="w-px h-4" style={{ background: 'rgba(0,212,255,0.2)' }} />

        {/* Internet */}
        <div className="flex items-center gap-1">
          {online ? <Wifi size={12} color="#00d4ff" /> : <WifiOff size={12} color="#ff3344" />}
          <span className="text-xxs" style={{ color: online ? '#00d4ff' : '#ff3344' }}>
            {online ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        {/* Backend status */}
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{
            background: backendOnline ? '#00ff88' : '#ff3344',
            boxShadow: `0 0 6px ${backendOnline ? '#00ff88' : '#ff3344'}`,
          }} />
          <span className="text-xxs" style={{ color: backendOnline ? '#00ff88' : '#ff3344' }}>
            {backendOnline ? 'AI ONLINE' : 'AI OFFLINE'}
          </span>
        </div>

        {/* Phone status */}
        <div className="flex items-center gap-1">
          <div className={`status-dot ${phoneConnected ? 'status-online' : 'status-offline'}`} style={{ width: 6, height: 6 }} />
          <span className="text-xxs" style={{ color: 'rgba(0,212,255,0.5)' }}>PHONE</span>
        </div>

        <div className="w-px h-4" style={{ background: 'rgba(0,212,255,0.2)' }} />

        {/* Window controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => window.electron?.minimize()}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title="Minimize"
          >
            <Minus size={12} color="rgba(0,212,255,0.6)" />
          </button>
          <button
            onClick={() => window.electron?.maximize()}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title="Maximize"
          >
            <Maximize2 size={11} color="rgba(0,212,255,0.6)" />
          </button>
          <button
            onClick={() => window.electron?.close()}
            className="p-1 rounded hover:bg-red-500/30 transition-colors"
            title="Close"
          >
            <X size={12} color="rgba(255,100,100,0.8)" />
          </button>
        </div>
      </div>
    </div>
  )
}
