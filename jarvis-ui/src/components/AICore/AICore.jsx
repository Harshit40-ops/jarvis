import { Suspense, useCallback, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { KernelSize } from 'postprocessing'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Loader, Send, AlertCircle } from 'lucide-react'
import { useJarvisStore } from '../../store/jarvisStore'
import HolographicSphere from './HolographicSphere'
import RotatingRings from './RotatingRings'
import ParticleField from './ParticleField'

function Scene({ aiState }) {
  return (
    <>
      <color attach="background" args={['#050505']} />
      <ambientLight intensity={0.05} />
      <pointLight position={[5, 5, 5]} color="#00d4ff" intensity={3} />
      <pointLight position={[-5, -3, -5]} color="#0066ff" intensity={2} />
      <pointLight position={[0, 0, 4]} color="#ffffff" intensity={0.5} />
      {aiState === 'speaking' && (
        <pointLight position={[0, 0, 2]} color="#ff6600" intensity={2} />
      )}
      <Stars radius={100} depth={50} count={3000} factor={2} fade speed={0.5} />
      <HolographicSphere aiState={aiState} onClick={() => {}} />
      <RotatingRings aiState={aiState} />
      <ParticleField aiState={aiState} />
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.05}
          luminanceSmoothing={0.9}
          intensity={aiState === 'listening' ? 4 : aiState === 'speaking' ? 3 : 2}
          kernelSize={KernelSize.LARGE}
        />
      </EffectComposer>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate
        autoRotateSpeed={aiState === 'listening' ? 1.5 : 0.4}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={(3 * Math.PI) / 4}
      />
    </>
  )
}

const STATE_COLORS = {
  idle: '#00d4ff',
  listening: '#00ff88',
  speaking: '#ff6600',
  thinking: '#ffaa00',
}

const STATE_LABELS = {
  idle: 'TAP TO SPEAK',
  listening: 'SPEAK NOW...',
  speaking: 'SPEAKING',
  thinking: 'PROCESSING...',
}

async function sendCommand(command, addMessage, setAiState) {
  try {
    const res = await fetch('http://localhost:8000/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    })
    const data = await res.json()
    const reply = data.response || 'Command received.'
    addMessage('jarvis', reply)
    setAiState('speaking')
    const words = reply.split(' ').length
    setTimeout(() => setAiState('idle'), Math.max(2500, words * 380))
  } catch {
    addMessage('jarvis', 'Backend offline. Start JARVIS server first.')
    setAiState('idle')
  }
}

export default function AICore() {
  const { aiState, setAiState, addMessage, addCommand } = useJarvisStore()
  const listeningRef = useRef(false)
  const stateColor = STATE_COLORS[aiState] || STATE_COLORS.idle
  const [textInput, setTextInput] = useState('')
  const [voiceError, setVoiceError] = useState('')

  const startListening = useCallback(async () => {
    if (listeningRef.current) return
    listeningRef.current = true
    setVoiceError('')
    setAiState('listening')

    try {
      // Use Python backend mic — avoids Electron Web Speech API network error
      const res = await fetch('http://localhost:8000/listen', {
        method: 'POST',
      })
      const data = await res.json()

      if (data.status === 'ok' && data.transcript) {
        const transcript = data.transcript
        addMessage('user', transcript)
        addCommand(transcript)
        setAiState('thinking')
        await sendCommand(transcript, addMessage, setAiState)
      } else {
        setVoiceError('No speech detected — speak clearly and try again')
        setAiState('idle')
      }
    } catch {
      setVoiceError('Cannot reach JARVIS server — is it running?')
      setAiState('idle')
    } finally {
      listeningRef.current = false
    }
  }, [setAiState, addMessage, addCommand])

  const handleActivate = useCallback(() => {
    if (aiState === 'idle') startListening()
  }, [aiState, startListening])

  const handleTextSend = useCallback(async () => {
    const cmd = textInput.trim()
    if (!cmd || aiState !== 'idle') return
    setTextInput('')
    setVoiceError('')
    addMessage('user', cmd)
    addCommand(cmd)
    setAiState('thinking')
    await sendCommand(cmd, addMessage, setAiState)
  }, [textInput, aiState, addMessage, addCommand, setAiState])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleTextSend()
  }, [handleTextSend])

  return (
    <div className="relative w-full h-full">
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 55 }}
          gl={{ antialias: true, alpha: false }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <Scene aiState={aiState} />
          </Suspense>
        </Canvas>
      </div>

      {/* Transparent click overlay — covers center sphere */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ pointerEvents: 'none' }}
      >
        <button
          onClick={handleActivate}
          className="rounded-full"
          style={{
            width: 200,
            height: 200,
            pointerEvents: 'auto',
            background: 'transparent',
            border: 'none',
            cursor: aiState === 'idle' ? 'pointer' : 'default',
            outline: 'none',
          }}
          title="Click to activate voice"
        />
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3" style={{ minWidth: 360 }}>

        {/* Error message */}
        <AnimatePresence>
          {voiceError && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs"
              style={{ background: 'rgba(255,50,50,0.15)', border: '1px solid #ff333344', color: '#ff6666' }}
            >
              <AlertCircle size={12} />
              {voiceError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording hint */}
        <AnimatePresence>
          {aiState === 'listening' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs font-hud"
              style={{ color: STATE_COLORS.listening, letterSpacing: '0.15em' }}
            >
              SPEAK NOW — STOPS WHEN YOU PAUSE
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text input fallback */}
        <div className="flex items-center gap-2 w-full px-2">
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or question..."
            disabled={aiState !== 'idle'}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-hud outline-none"
            style={{
              background: 'rgba(0,0,0,0.7)',
              border: `1px solid ${stateColor}44`,
              color: stateColor,
              letterSpacing: '0.05em',
              backdropFilter: 'blur(12px)',
            }}
          />
          <motion.button
            onClick={handleTextSend}
            disabled={!textInput.trim() || aiState !== 'idle'}
            className="p-2 rounded-lg"
            style={{
              background: 'rgba(0,0,0,0.7)',
              border: `1px solid ${stateColor}44`,
              color: stateColor,
              cursor: textInput.trim() && aiState === 'idle' ? 'pointer' : 'not-allowed',
              opacity: textInput.trim() && aiState === 'idle' ? 1 : 0.4,
            }}
            whileTap={{ scale: 0.92 }}
          >
            <Send size={14} />
          </motion.button>
        </div>

        {/* Main voice button */}
        <motion.button
          onClick={handleActivate}
          className="flex items-center gap-3 px-6 py-3 rounded-full font-hud text-xs"
          style={{
            background: 'rgba(0,0,0,0.8)',
            border: `1px solid ${stateColor}`,
            color: stateColor,
            boxShadow: `0 0 20px ${stateColor}44`,
            backdropFilter: 'blur(12px)',
            letterSpacing: '0.2em',
            cursor: aiState === 'idle' ? 'pointer' : 'default',
            outline: 'none',
          }}
          whileHover={aiState === 'idle' ? { scale: 1.06, boxShadow: `0 0 35px ${stateColor}88` } : {}}
          whileTap={aiState === 'idle' ? { scale: 0.94 } : {}}
        >
          {aiState === 'thinking' ? (
            <Loader size={14} className="animate-spin" />
          ) : aiState === 'listening' ? (
            <MicOff size={14} />
          ) : (
            <Mic size={14} />
          )}

          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ background: stateColor, boxShadow: `0 0 8px ${stateColor}` }}
            animate={{ scale: aiState !== 'idle' ? [1, 1.5, 1] : 1 }}
            transition={{ duration: 0.7, repeat: Infinity }}
          />

          {STATE_LABELS[aiState] || 'TAP TO SPEAK'}
        </motion.button>

        {/* Waveform */}
        <AnimatePresence>
          {(aiState === 'listening' || aiState === 'speaking') && (
            <motion.div
              className="flex items-center gap-0.5 h-7"
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
            >
              {[...Array(24)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-0.5 rounded-full"
                  style={{ background: stateColor }}
                  animate={{ height: [3, Math.random() * 24 + 4, 3] }}
                  transition={{
                    duration: 0.3 + Math.random() * 0.4,
                    repeat: Infinity,
                    delay: i * 0.035,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Corner HUD brackets */}
      {[
        { cls: 'top-3 left-3', bt: true, bl: true },
        { cls: 'top-3 right-3', bt: true, br: true },
        { cls: 'bottom-20 left-3', bb: true, bl: true },
        { cls: 'bottom-20 right-3', bb: true, br: true },
      ].map(({ cls, bt, bl, bb, br }, i) => (
        <div
          key={i}
          className={`absolute ${cls} w-5 h-5 pointer-events-none`}
          style={{
            borderTop: bt ? `1px solid ${stateColor}44` : 'none',
            borderBottom: bb ? `1px solid ${stateColor}44` : 'none',
            borderLeft: bl ? `1px solid ${stateColor}44` : 'none',
            borderRight: br ? `1px solid ${stateColor}44` : 'none',
          }}
        />
      ))}
    </div>
  )
}
