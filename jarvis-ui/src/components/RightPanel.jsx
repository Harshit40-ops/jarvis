import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, Terminal } from 'lucide-react'
import { useJarvisStore } from '../store/jarvisStore'

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 p-3">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  )
}

function TypedText({ text }) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    let i = 0
    const id = setInterval(() => {
      setDisplayed(text.slice(0, ++i))
      if (i >= text.length) clearInterval(id)
    }, 18)
    return () => clearInterval(id)
  }, [text])
  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span className="animate-typing-cursor" style={{ color: '#00d4ff' }}>▌</span>
      )}
    </span>
  )
}

function Message({ msg, isLatest }) {
  const isJarvis = msg.role === 'jarvis'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-2 ${isJarvis ? 'mr-4' : 'ml-4'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xxs font-hud" style={{ color: isJarvis ? '#00d4ff' : '#ff6600', letterSpacing: '0.12em' }}>
          {isJarvis ? 'JARVIS' : 'YOU'}
        </span>
        <span className="text-xxs" style={{ color: 'rgba(0,212,255,0.3)' }}>{msg.time}</span>
      </div>
      <div className={isJarvis ? 'message-jarvis' : 'message-user'} style={{ padding: '8px 12px' }}>
        <p className="text-xs font-mono leading-relaxed" style={{ color: isJarvis ? 'rgba(0,212,255,0.9)' : 'rgba(255,102,0,0.9)' }}>
          {isJarvis && isLatest ? <TypedText text={msg.text} /> : msg.text}
        </p>
      </div>
    </motion.div>
  )
}

export default function RightPanel() {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef(null)
  const { messages, addMessage, addCommand, setAiState, aiState } = useJarvisStore()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    addMessage('user', text)
    addCommand(text)
    setIsTyping(true)
    setAiState('thinking')

    await new Promise((r) => setTimeout(r, 1200))

    const response = await sendToJarvis(text)
    setIsTyping(false)
    setAiState('speaking')
    addMessage('jarvis', response)
    setTimeout(() => setAiState('idle'), 3000)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <motion.div
      className="h-full flex flex-col"
      style={{ width: 300 }}
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}
      >
        <Terminal size={12} color="#00d4ff" />
        <span className="text-xxs font-hud" style={{ color: 'rgba(0,212,255,0.6)', letterSpacing: '0.18em' }}>
          COMMAND INTERFACE
        </span>
        <div className="flex-1" />
        <div className="text-xxs font-mono" style={{ color: 'rgba(0,212,255,0.3)' }}>
          {messages.length} msgs
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3">
        {messages.map((msg, i) => (
          <Message key={msg.id} msg={msg} isLatest={i === messages.length - 1} />
        ))}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="message-jarvis mr-4 mb-2"
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="p-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(0,212,255,0.1)' }}
      >
        <div
          className="flex items-center gap-2 p-2 rounded-lg"
          style={{
            background: 'rgba(0,212,255,0.04)',
            border: '1px solid rgba(0,212,255,0.2)',
          }}
        >
          <span className="text-xxs" style={{ color: 'rgba(0,212,255,0.4)' }}>›</span>
          <input
            className="flex-1 bg-transparent text-xs font-mono outline-none"
            style={{ color: '#00d4ff', caretColor: '#00d4ff' }}
            placeholder="Enter command..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSend}
            className="p-1 rounded transition-all hover:scale-110"
            style={{ color: input ? '#00d4ff' : 'rgba(0,212,255,0.3)' }}
          >
            <Send size={12} />
          </button>
        </div>
        <div className="text-xxs text-center mt-1" style={{ color: 'rgba(0,212,255,0.25)' }}>
          ENTER to send • Click core to speak
        </div>
      </div>
    </motion.div>
  )
}

async function sendToJarvis(text) {
  try {
    const res = await fetch('http://localhost:8000/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: text }),
    })
    if (res.ok) {
      const data = await res.json()
      return data.response || 'Command received.'
    }
  } catch {
    // fallback responses
  }
  const fallbacks = [
    `Processing: "${text}". Command acknowledged.`,
    `Executing command. Stand by...`,
    `Understood. Initiating "${text}" protocol.`,
    `Command logged. JARVIS AI is operational.`,
  ]
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}
