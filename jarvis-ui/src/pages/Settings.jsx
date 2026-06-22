import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, User, Mic, Smartphone, Palette, Save } from 'lucide-react'
import { useJarvisStore } from '../store/jarvisStore'

function Section({ title, icon: Icon, children }) {
  return (
    <div className="glass-panel hud-border rounded-xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={14} color="#00d4ff" />
        <span className="text-xs font-hud" style={{ color: 'rgba(0,212,255,0.7)', letterSpacing: '0.15em' }}>
          {title}
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.1)' }} />
      </div>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div className="mb-3">
      <label className="block text-xxs font-hud mb-1" style={{ color: 'rgba(0,212,255,0.5)', letterSpacing: '0.12em' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg text-xs font-mono outline-none transition-all"
        style={{
          background: 'rgba(0,212,255,0.04)',
          border: '1px solid rgba(0,212,255,0.15)',
          color: '#00d4ff',
          caretColor: '#00d4ff',
        }}
        onFocus={(e) => e.target.style.borderColor = 'rgba(0,212,255,0.4)'}
        onBlur={(e) => e.target.style.borderColor = 'rgba(0,212,255,0.15)'}
      />
    </div>
  )
}

function Toggle({ label, value, onChange, description }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(0,212,255,0.06)' }}>
      <div>
        <div className="text-xs font-mono" style={{ color: 'rgba(0,212,255,0.8)' }}>{label}</div>
        {description && <div className="text-xxs mt-0.5" style={{ color: 'rgba(0,212,255,0.4)' }}>{description}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative w-10 h-5 rounded-full transition-all"
        style={{
          background: value ? 'rgba(0,212,255,0.3)' : 'rgba(0,212,255,0.08)',
          border: `1px solid ${value ? 'rgba(0,212,255,0.5)' : 'rgba(0,212,255,0.2)'}`,
        }}
      >
        <motion.div
          className="absolute top-0.5 w-4 h-4 rounded-full"
          style={{ background: value ? '#00d4ff' : 'rgba(0,212,255,0.3)' }}
          animate={{ x: value ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const { settings, updateSettings } = useJarvisStore()
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings size={20} color="#00d4ff" />
            <span className="hud-title">SYSTEM SETTINGS</span>
          </div>
          <motion.button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-hud transition-all"
            style={{
              background: saved ? 'rgba(0,255,136,0.15)' : 'rgba(0,212,255,0.1)',
              border: `1px solid ${saved ? 'rgba(0,255,136,0.4)' : 'rgba(0,212,255,0.3)'}`,
              color: saved ? '#00ff88' : '#00d4ff',
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Save size={12} />
            {saved ? 'SAVED!' : 'SAVE SETTINGS'}
          </motion.button>
        </div>

        <Section title="IDENTITY" icon={User}>
          <Field label="JARVIS NAME" value={settings.jarvisName}
            onChange={(v) => updateSettings({ jarvisName: v })} placeholder="JARVIS" />
          <Field label="USER NAME" value={settings.userName}
            onChange={(v) => updateSettings({ userName: v })} placeholder="Your name" />
        </Section>

        <Section title="VOICE & AI" icon={Mic}>
          <Toggle
            label="Voice Input"
            description="Enable microphone for voice commands"
            value={settings.voiceEnabled}
            onChange={(v) => updateSettings({ voiceEnabled: v })}
          />
          <Toggle
            label="Auto-listen after response"
            description="JARVIS listens again after speaking"
            value={false}
            onChange={() => {}}
          />
          <Toggle
            label="Sound effects"
            description="UI interaction sounds"
            value={true}
            onChange={() => {}}
          />
        </Section>

        <Section title="PHONE BRIDGE" icon={Smartphone}>
          <Field
            label="BRIDGE URL"
            value={settings.bridgeUrl}
            onChange={(v) => updateSettings({ bridgeUrl: v })}
            placeholder="http://192.168.1.x:8765"
          />
          <div className="text-xxs mt-2" style={{ color: 'rgba(0,212,255,0.4)' }}>
            Start the bridge: <span className="font-mono" style={{ color: '#ff6600' }}>python -m android_bridge.main</span>
          </div>
        </Section>

        <Section title="APPEARANCE" icon={Palette}>
          <div className="text-xxs mb-3" style={{ color: 'rgba(0,212,255,0.5)' }}>ACCENT COLOR</div>
          <div className="flex gap-3">
            {[
              { name: 'cyan', color: '#00d4ff' },
              { name: 'blue', color: '#0066ff' },
              { name: 'orange', color: '#ff6600' },
              { name: 'green', color: '#00ff88' },
            ].map(({ name, color }) => (
              <button
                key={name}
                onClick={() => updateSettings({ theme: name })}
                className="w-8 h-8 rounded-full transition-all"
                style={{
                  background: color,
                  boxShadow: settings.theme === name ? `0 0 15px ${color}` : 'none',
                  transform: settings.theme === name ? 'scale(1.2)' : 'scale(1)',
                  border: settings.theme === name ? `2px solid white` : '2px solid transparent',
                }}
                title={name}
              />
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
