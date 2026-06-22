import AICore from '../components/AICore/AICore'
import LeftPanel from '../components/LeftPanel'
import RightPanel from '../components/RightPanel'

export default function Dashboard() {
  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel */}
      <div
        className="h-full overflow-y-auto flex-shrink-0"
        style={{ borderRight: '1px solid rgba(0,212,255,0.08)' }}
      >
        <LeftPanel />
      </div>

      {/* Center — 3D AI Core */}
      <div className="flex-1 h-full overflow-hidden">
        <AICore />
      </div>

      {/* Right panel */}
      <div
        className="h-full flex-shrink-0"
        style={{ borderLeft: '1px solid rgba(0,212,255,0.08)' }}
      >
        <RightPanel />
      </div>
    </div>
  )
}
