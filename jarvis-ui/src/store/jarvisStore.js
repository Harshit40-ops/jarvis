import { create } from 'zustand'

const DEMO_MESSAGES = [
  { id: 1, role: 'jarvis', text: 'JARVIS AI System online. All systems nominal. How can I assist you today?', time: '09:41:00' },
  { id: 2, role: 'user', text: 'Open Chrome', time: '09:41:15' },
  { id: 3, role: 'jarvis', text: 'Opening Google Chrome. Browser launched successfully.', time: '09:41:16' },
]

const DEMO_MEMORIES = [
  { key: 'name', value: 'User', category: 'profile', time: '2 days ago' },
  { key: 'language', value: 'English', category: 'preference', time: '2 days ago' },
  { key: 'theme', value: 'Dark', category: 'preference', time: '1 day ago' },
]

const DEMO_COMMANDS = [
  'Open Chrome',
  'Search weather today',
  'What time is it?',
  'Set reminder at 5PM',
  'Open VS Code',
]

const API = 'http://localhost:8000'

export const useJarvisStore = create((set, get) => ({
  // AI state
  aiState: 'idle', // idle | listening | speaking | thinking
  setAiState: (state) => set({ aiState: state }),

  // Navigation
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),

  // Chat
  messages: DEMO_MESSAGES,
  addMessage: (role, text) => set((s) => ({
    messages: [...s.messages, {
      id: Date.now(),
      role,
      text,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    }]
  })),

  // System stats
  stats: { cpu: 42, ram: 62, gpu: 28, netUp: 1.2, netDown: 4.8 },
  updateStats: () => set((s) => ({
    stats: {
      cpu: Math.max(5, Math.min(95, s.stats.cpu + (Math.random() - 0.5) * 6)),
      ram: Math.max(20, Math.min(90, s.stats.ram + (Math.random() - 0.5) * 2)),
      gpu: Math.max(5, Math.min(80, s.stats.gpu + (Math.random() - 0.5) * 8)),
      netUp: Math.max(0.1, Math.random() * 3),
      netDown: Math.max(0.5, Math.random() * 10),
    }
  })),

  // Memory
  memories: DEMO_MEMORIES,
  addMemory: (memory) => set((s) => ({ memories: [memory, ...s.memories] })),

  // Recent commands
  recentCommands: DEMO_COMMANDS,
  addCommand: (cmd) => set((s) => ({
    recentCommands: [cmd, ...s.recentCommands].slice(0, 10)
  })),

  // Phone connection
  phoneConnected: false,
  setPhoneConnected: (v) => set({ phoneConnected: v }),

  // Settings
  settings: {
    voiceEnabled: true,
    jarvisName: 'JARVIS',
    userName: 'User',
    bridgeUrl: 'http://192.168.29.53:8765',
    theme: 'cyan',
  },
  updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

  // Backend connected flag
  backendOnline: false,
  setBackendOnline: (v) => set({ backendOnline: v }),

  // Load real data from Python API
  loadFromBackend: async () => {
    try {
      const [memRes, histRes] = await Promise.all([
        fetch(`${API}/memory`),
        fetch(`${API}/history`),
      ])
      if (memRes.ok) {
        const mems = await memRes.json()
        if (mems.length > 0) set({ memories: mems })
        const nameEntry = mems.find(m => m.key === 'name')
        if (nameEntry) set((s) => ({ settings: { ...s.settings, userName: nameEntry.value } }))
      }
      if (histRes.ok) {
        const hist = await histRes.json()
        if (hist.length > 0) {
          const msgs = hist.flatMap((h, i) => [
            { id: i * 2, role: 'user', text: h.user, time: '' },
            { id: i * 2 + 1, role: 'jarvis', text: h.assistant, time: '' },
          ])
          set({ messages: msgs })
        }
      }
      set({ backendOnline: true })
    } catch {
      set({ backendOnline: false })
    }
  },
}))
