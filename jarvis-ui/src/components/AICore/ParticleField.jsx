import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function ParticleField({ aiState, count = 800 }) {
  const pointsRef = useRef()
  const innerRef = useRef()

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 2.2 + Math.random() * 1.8
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [count])

  const innerPositions = useMemo(() => {
    const arr = new Float32Array(200 * 3)
    for (let i = 0; i < 200; i++) {
      const r = 1.1 + Math.random() * 0.8
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [])

  useFrame((_, delta) => {
    const speed = aiState === 'listening' ? 1.5 : aiState === 'speaking' ? 1 : 0.25
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * speed * 0.1
      pointsRef.current.rotation.x += delta * speed * 0.05
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * speed * 0.15
      innerRef.current.rotation.z += delta * speed * 0.08
    }
  })

  const isListening = aiState === 'listening'

  return (
    <group>
      {/* Outer particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={isListening ? '#00ff88' : '#00d4ff'}
          size={0.018}
          transparent
          opacity={isListening ? 0.7 : 0.45}
          sizeAttenuation
        />
      </points>

      {/* Inner particles */}
      <points ref={innerRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={200}
            array={innerPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#0066ff"
          size={0.022}
          transparent
          opacity={0.3}
          sizeAttenuation
        />
      </points>
    </group>
  )
}
