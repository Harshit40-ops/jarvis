import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, MessageSquare, Brain, Camera, Zap, Settings } from 'lucide-react'

const PAGES = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/memory', icon: Brain, label: 'Memory' },
  { path: '/vision', icon: Camera, label: 'Vision' },
  { path: '/automation', icon: Zap, label: 'Automation' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function NavSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div
      className="flex flex-col items-center py-4 gap-2 flex-shrink-0"
      style={{
        width: 56,
        background: 'rgba(0,0,0,0.6)',
        borderRight: '1px solid rgba(0,212,255,0.1)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo mark */}
      <div className="mb-4">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            border: '1px solid rgba(0,212,255,0.5)',
            boxShadow: '0 0 15px rgba(0,212,255,0.3)',
            background: 'rgba(0,212,255,0.08)',
          }}
        >
          <span className="font-hud text-xs font-bold" style={{ color: '#00d4ff' }}>J</span>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-1 w-full px-2">
        {PAGES.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path
          return (
            <div key={path} className="relative group">
              <motion.button
                className={`nav-icon w-full ${isActive ? 'active' : ''}`}
                onClick={() => navigate(path)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={label}
              >
                <Icon size={16} />
              </motion.button>
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-l"
                  style={{ background: '#00d4ff', boxShadow: '0 0 8px #00d4ff' }}
                  layoutId="nav-indicator"
                />
              )}
              {/* Tooltip */}
              <div
                className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xxs font-hud whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                style={{
                  background: 'rgba(0,10,20,0.95)',
                  border: '1px solid rgba(0,212,255,0.3)',
                  color: '#00d4ff',
                  letterSpacing: '0.1em',
                }}
              >
                {label.toUpperCase()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
