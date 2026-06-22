/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyan: {
          DEFAULT: '#00d4ff',
          dim: '#0099bb',
          dark: '#003344',
          glow: 'rgba(0,212,255,0.15)',
        },
        orange: {
          jarvis: '#ff6600',
          dim: '#aa4400',
          glow: 'rgba(255,102,0,0.15)',
        },
        blue: {
          jarvis: '#0066ff',
          dim: '#0033aa',
        },
        dark: {
          DEFAULT: '#050505',
          secondary: '#0a0a12',
          panel: '#080810',
        },
      },
      fontFamily: {
        hud: ['Orbitron', 'monospace'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 10s linear infinite',
        'spin-reverse': 'spin-reverse 15s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
        'scanline': 'scanline 6s linear infinite',
        'flicker': 'flicker 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'typing-cursor': 'typing-cursor 1s step-end infinite',
      },
      keyframes: {
        'spin-reverse': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(-360deg)' } },
        'glow-pulse': {
          '0%': { boxShadow: '0 0 5px #00d4ff44, 0 0 10px #00d4ff22' },
          '100%': { boxShadow: '0 0 20px #00d4ff, 0 0 40px #00d4ff88, 0 0 60px #00d4ff44' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'flicker': {
          '0%, 96%, 100%': { opacity: '1' },
          '97%': { opacity: '0.85' },
          '98%': { opacity: '1' },
          '99%': { opacity: '0.9' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'typing-cursor': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
