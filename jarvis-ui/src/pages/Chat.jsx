import { motion } from 'framer-motion'
import RightPanel from '../components/RightPanel'
import { useJarvisStore } from '../store/jarvisStore'
import { MessageSquare } from 'lucide-react'

export default function Chat() {
  const messages = useJarvisStore((s) => s.messages)

  return (
    <div className="flex h-full">
      {/* Stats sidebar */}
      <div
        className="flex flex-col p-4 gap-3 flex-shrink-0"
        style={{ width: 200, borderRight: '1px solid rgba(0,212,255,0.08)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare size={14} color="#00d4ff" />
          <span className="text-xxs font-hud" style={{ color: 'rgba(0,212,255,0.6)', letterSpacing: '0.18em' }}>
            CHAT STATS
          </span>
        </div>
        {[
          ['Total Messages', messages.length],
          ['JARVIS Replies', messages.filter(m => m.role === 'jarvis').length],
          ['User Messages', messages.filter(m => m.role === 'user').length],
          ['Session Active', ''],
        ].map(([label, val]) => (
          <div key={label} className="glass-panel rounded-lg p-3">
            <div className="text-xxs" style={{ color: 'rgba(0,212,255,0.5)' }}>{label}</div>
            <div className="text-lg font-hud font-bold mt-1" style={{ color: '#00d4ff' }}>
              {val || <span className="text-xxs text-green-400">●  ONLINE</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Full chat panel */}
      <div className="flex-1 h-full" style={{ maxWidth: 700, margin: '0 auto' }}>
        <RightPanel />
      </div>
    </div>
  )
}
