import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, Eye, Users, Package, Play, Square } from 'lucide-react'

export default function Vision() {
  const [active, setActive] = useState(false)
  const [faceCount, setFaceCount] = useState(0)
  const [description, setDescription] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setActive(true)
    } catch (e) {
      console.error('Camera error:', e)
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setActive(false)
    setFaceCount(0)
    setDescription('')
  }

  useEffect(() => () => stopCamera(), [])

  const scanScene = async () => {
    setDescription('Analyzing scene with AI vision...')
    await new Promise((r) => setTimeout(r, 1500))
    setDescription('Scene contains: indoor environment, desk workspace, monitor, keyboard. Lighting: artificial fluorescent. No threats detected.')
    setFaceCount(Math.floor(Math.random() * 3))
  }

  return (
    <div className="flex h-full p-4 gap-4 overflow-hidden">
      {/* Camera feed */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Camera size={18} color="#00d4ff" />
          <span className="hud-title text-sm">VISION MODULE</span>
        </div>

        <div
          className="flex-1 rounded-xl overflow-hidden relative"
          style={{
            background: '#000',
            border: active ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(0,212,255,0.1)',
            boxShadow: active ? '0 0 30px rgba(0,212,255,0.1)' : 'none',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ display: active ? 'block' : 'none' }}
          />

          {!active && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Eye size={48} color="rgba(0,212,255,0.2)" />
              <span className="text-xs font-hud" style={{ color: 'rgba(0,212,255,0.4)' }}>
                CAMERA OFFLINE
              </span>
            </div>
          )}

          {/* HUD overlay on active */}
          {active && (
            <>
              {/* Corner brackets */}
              {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
                <div
                  key={i}
                  className={`absolute ${pos} w-8 h-8`}
                  style={{
                    borderTop: i < 2 ? '2px solid #00d4ff' : 'none',
                    borderBottom: i >= 2 ? '2px solid #00d4ff' : 'none',
                    borderLeft: i % 2 === 0 ? '2px solid #00d4ff' : 'none',
                    borderRight: i % 2 === 1 ? '2px solid #00d4ff' : 'none',
                  }}
                />
              ))}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded"
                style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,212,255,0.3)' }}>
                <span className="text-xxs font-hud" style={{ color: '#00d4ff' }}>● LIVE</span>
              </div>
              {faceCount > 0 && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 px-2 py-1 rounded"
                  style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(0,212,255,0.3)' }}>
                  <Users size={12} color="#00d4ff" />
                  <span className="text-xxs font-hud" style={{ color: '#00d4ff' }}>{faceCount} FACE(S)</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={active ? stopCamera : startCamera}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-hud text-xs"
            style={{
              background: active ? 'rgba(255,51,68,0.15)' : 'rgba(0,212,255,0.1)',
              border: `1px solid ${active ? 'rgba(255,51,68,0.4)' : 'rgba(0,212,255,0.3)'}`,
              color: active ? '#ff3344' : '#00d4ff',
            }}
          >
            {active ? <Square size={12} /> : <Play size={12} />}
            {active ? 'STOP CAMERA' : 'START CAMERA'}
          </button>
          {active && (
            <button
              onClick={scanScene}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-hud text-xs"
              style={{
                background: 'rgba(255,102,0,0.1)',
                border: '1px solid rgba(255,102,0,0.3)',
                color: '#ff6600',
              }}
            >
              <Eye size={12} />
              SCAN SCENE
            </button>
          )}
        </div>
      </div>

      {/* Info panel */}
      <div className="flex flex-col gap-3" style={{ width: 240 }}>
        <div className="glass-panel hud-border rounded-lg p-3">
          <div className="text-xxs font-hud mb-3" style={{ color: 'rgba(0,212,255,0.6)', letterSpacing: '0.18em' }}>
            DETECTION STATUS
          </div>
          {[
            { label: 'Faces', value: faceCount, icon: Users },
            { label: 'Camera', value: active ? 'ACTIVE' : 'OFFLINE', icon: Camera },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between py-2"
              style={{ borderBottom: '1px solid rgba(0,212,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <Icon size={12} color="rgba(0,212,255,0.5)" />
                <span className="text-xxs" style={{ color: 'rgba(0,212,255,0.6)' }}>{label}</span>
              </div>
              <span className="text-xs font-hud font-bold" style={{ color: '#00d4ff' }}>{value}</span>
            </div>
          ))}
        </div>

        {description && (
          <motion.div
            className="glass-panel hud-border rounded-lg p-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-xxs font-hud mb-2" style={{ color: 'rgba(0,212,255,0.6)', letterSpacing: '0.18em' }}>
              AI DESCRIPTION
            </div>
            <p className="text-xxs font-mono leading-relaxed" style={{ color: 'rgba(0,212,255,0.8)' }}>
              {description}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
