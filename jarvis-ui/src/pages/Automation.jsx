import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Play, Clock, Check, X, Plus, Smartphone, Monitor } from 'lucide-react'

const DEFAULT_TASKS = [
  { id: 1, name: 'Morning Brief', trigger: 'Daily 8:00 AM', action: 'Weather + News summary', status: 'active' },
  { id: 2, name: 'Open Chrome', trigger: 'Voice command', action: 'Launch browser', status: 'active' },
  { id: 3, name: 'Phone Sync', trigger: 'On connect', action: 'Read notifications', status: 'idle' },
  { id: 4, name: 'Screen Lock', trigger: 'Idle 10min', action: 'Lock workstation', status: 'disabled' },
]

function TaskCard({ task, onToggle, onRun }) {
  const statusColor = { active: '#00ff88', idle: '#00d4ff', disabled: '#ff3344' }[task.status]
  return (
    <motion.div
      className="glass-panel hud-border rounded-lg p-4"
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs font-hud font-bold mb-1" style={{ color: '#00d4ff' }}>{task.name}</div>
          <div className="text-xxs" style={{ color: 'rgba(0,212,255,0.5)' }}>
            <Clock size={9} style={{ display: 'inline', marginRight: 4 }} />
            {task.trigger}
          </div>
        </div>
        <div
          className="text-xxs px-2 py-0.5 rounded"
          style={{
            background: `${statusColor}18`,
            border: `1px solid ${statusColor}44`,
            color: statusColor,
            letterSpacing: '0.1em',
          }}
        >
          {task.status.toUpperCase()}
        </div>
      </div>
      <div className="text-xxs font-mono mb-3" style={{ color: 'rgba(0,212,255,0.7)' }}>
        → {task.action}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onRun(task)}
          className="flex items-center gap-1 px-2 py-1 rounded text-xxs font-hud transition-all"
          style={{
            background: 'rgba(0,212,255,0.08)',
            border: '1px solid rgba(0,212,255,0.2)',
            color: '#00d4ff',
          }}
        >
          <Play size={9} /> RUN
        </button>
        <button
          onClick={() => onToggle(task)}
          className="flex items-center gap-1 px-2 py-1 rounded text-xxs font-hud transition-all"
          style={{
            background: task.status === 'disabled' ? 'rgba(0,255,136,0.08)' : 'rgba(255,51,68,0.08)',
            border: `1px solid ${task.status === 'disabled' ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,68,0.2)'}`,
            color: task.status === 'disabled' ? '#00ff88' : '#ff3344',
          }}
        >
          {task.status === 'disabled' ? <><Check size={9} /> ENABLE</> : <><X size={9} /> DISABLE</>}
        </button>
      </div>
    </motion.div>
  )
}

export default function Automation() {
  const [tasks, setTasks] = useState(DEFAULT_TASKS)
  const [log, setLog] = useState([])

  const handleRun = (task) => {
    setLog((prev) => [{
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      msg: `Executed: ${task.name}`,
    }, ...prev.slice(0, 9)])
  }

  const handleToggle = (task) => {
    setTasks((prev) => prev.map((t) =>
      t.id === task.id
        ? { ...t, status: t.status === 'disabled' ? 'active' : 'disabled' }
        : t
    ))
  }

  return (
    <div className="flex h-full p-4 gap-4 overflow-hidden">
      {/* Task grid */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap size={18} color="#00d4ff" />
            <span className="hud-title text-sm">AUTOMATION</span>
          </div>
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xxs font-hud transition-all"
            style={{
              background: 'rgba(255,102,0,0.1)',
              border: '1px solid rgba(255,102,0,0.3)',
              color: '#ff6600',
            }}
          >
            <Plus size={11} /> NEW TASK
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={handleToggle} onRun={handleRun} />
            ))}
          </div>
        </div>
      </div>

      {/* Log panel */}
      <div className="flex flex-col gap-3" style={{ width: 240 }}>
        <div className="glass-panel hud-border rounded-lg p-3 flex-1">
          <div className="text-xxs font-hud mb-3" style={{ color: 'rgba(0,212,255,0.6)', letterSpacing: '0.18em' }}>
            EXECUTION LOG
          </div>
          {log.length === 0 ? (
            <div className="text-xxs text-center mt-4" style={{ color: 'rgba(0,212,255,0.3)' }}>
              No executions yet
            </div>
          ) : (
            <div className="space-y-2">
              {log.map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xxs font-mono p-1.5 rounded"
                  style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)' }}
                >
                  <div style={{ color: 'rgba(0,212,255,0.4)' }}>{entry.time}</div>
                  <div style={{ color: '#00ff88' }}>{entry.msg}</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="glass-panel hud-border rounded-lg p-3">
          <div className="text-xxs font-hud mb-3" style={{ color: 'rgba(0,212,255,0.6)', letterSpacing: '0.18em' }}>
            QUICK ACTIONS
          </div>
          {[
            { icon: Monitor, label: 'Lock Screen', color: '#00d4ff' },
            { icon: Smartphone, label: 'Phone Status', color: '#ff6600' },
          ].map(({ icon: Icon, label, color }) => (
            <button
              key={label}
              className="flex items-center gap-2 w-full py-2 px-2 rounded mb-1 text-xxs font-hud transition-all"
              style={{
                background: `${color}08`,
                border: `1px solid ${color}20`,
                color,
              }}
            >
              <Icon size={11} /> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
