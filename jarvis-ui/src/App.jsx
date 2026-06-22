import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useJarvisStore } from './store/jarvisStore'
import TopBar from './components/TopBar'
import BottomBar from './components/BottomBar'
import NavSidebar from './components/NavSidebar'
import Dashboard from './pages/Dashboard'
import Chat from './pages/Chat'
import Memory from './pages/Memory'
import Vision from './pages/Vision'
import Automation from './pages/Automation'
import Settings from './pages/Settings'

export default function App() {
  const updateStats = useJarvisStore((s) => s.updateStats)
  const loadFromBackend = useJarvisStore((s) => s.loadFromBackend)
  const setBackendOnline = useJarvisStore((s) => s.setBackendOnline)

  useEffect(() => {
    const interval = setInterval(updateStats, 1500)
    return () => clearInterval(interval)
  }, [updateStats])

  useEffect(() => {
    loadFromBackend()
    // Poll backend health every 10s
    const healthCheck = setInterval(async () => {
      try {
        const r = await fetch('http://localhost:8000/health', { signal: AbortSignal.timeout(2000) })
        setBackendOnline(r.ok)
      } catch {
        setBackendOnline(false)
      }
    }, 10000)
    return () => clearInterval(healthCheck)
  }, [loadFromBackend, setBackendOnline])

  return (
    <HashRouter>
      <div className="flex flex-col w-screen h-screen overflow-hidden" style={{ background: '#050505' }}>
        {/* Scanline overlay */}
        <div className="scanline-overlay" />
        <div className="scanline-bar" />

        {/* Top bar */}
        <TopBar />

        {/* Main layout */}
        <div className="flex flex-1 overflow-hidden">
          <NavSidebar />
          <main className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/memory" element={<Memory />} />
              <Route path="/vision" element={<Vision />} />
              <Route path="/automation" element={<Automation />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>

        {/* Bottom bar */}
        <BottomBar />
      </div>
    </HashRouter>
  )
}
