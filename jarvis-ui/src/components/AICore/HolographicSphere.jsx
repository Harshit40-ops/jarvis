import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function HolographicSphere({ aiState, onClick }) {
  const outerRef = useRef()
  const innerRef = useRef()
  const wireRef = useRef()
  const coreRef = useRef()

  const isListening = aiState === 'listening'
  const isSpeaking = aiState === 'speaking'
  const isThinking = aiState === 'thinking'

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const speed = isListening ? 2.5 : isSpeaking ? 1.5 : 0.4

    if (outerRef.current) {
      outerRef.current.rotation.y += 0.005 * speed
      outerRef.current.rotation.x += 0.002 * speed
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= 0.008 * speed
      innerRef.current.rotation.z += 0.003 * speed
    }
    if (wireRef.current) {
      wireRef.current.rotation.x += 0.003 * speed
      wireRef.current.rotation.y -= 0.002 * speed
    }

    // Pulse animation
    const pulseFreq = isListening ? 3 : isSpeaking ? 2 : 0.8
    const pulseAmp = isListening ? 0.08 : isSpeaking ? 0.05 : 0.03
    const scale = 1 + Math.sin(t * pulseFreq) * pulseAmp

    if (outerRef.current) outerRef.current.scale.setScalar(scale)
    if (coreRef.current) {
      coreRef.current.material.emissiveIntensity = (isListening ? 3 : isSpeaking ? 2 : 1) + Math.sin(t * 2) * 0.5
    }
  })

  return (
    <group onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Inner glowing core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color={isListening ? '#00ff88' : isSpeaking ? '#ff6600' : '#00d4ff'}
          emissive={isListening ? '#00ff88' : isSpeaking ? '#ff6600' : '#00d4ff'}
          emissiveIntensity={1.5}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Mid sphere */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.75, 64, 64]} />
        <meshPhysicalMaterial
          color={isListening ? '#003322' : '#001122'}
          emissive={isListening ? '#00ff88' : '#00d4ff'}
          emissiveIntensity={0.3}
          transparent
          opacity={0.25}
          roughness={0}
          metalness={0.8}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Outer shell */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial
          color="#000820"
          emissive="#00d4ff"
          emissiveIntensity={0.1}
          transparent
          opacity={0.12}
          roughness={0}
          metalness={1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe overlay */}
      <mesh ref={wireRef}>
        <sphereGeometry args={[1.02, 16, 12]} />
        <meshBasicMaterial
          color={isListening ? '#00ff88' : '#00d4ff'}
          wireframe
          transparent
          opacity={isListening ? 0.25 : 0.1}
        />
      </mesh>

      {/* Click target (invisible, larger) */}
      <mesh onClick={onClick}>
        <sphereGeometry args={[1.2, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}
