import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

function Ring({ radius, tube, rotation, speed, color, emissiveIntensity = 2 }) {
  const ref = useRef()
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * speed[0]
      ref.current.rotation.y += delta * speed[1]
      ref.current.rotation.z += delta * speed[2]
    }
  })
  return (
    <mesh ref={ref} rotation={rotation}>
      <torusGeometry args={[radius, tube, 16, 120]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        transparent
        opacity={0.9}
      />
    </mesh>
  )
}

export default function RotatingRings({ aiState }) {
  const speed = aiState === 'listening' ? 3 : aiState === 'speaking' ? 2 : 1

  return (
    <group>
      {/* Ring 1 — horizontal, cyan, fast */}
      <Ring
        radius={1.4} tube={0.008}
        rotation={[Math.PI / 2, 0, 0]}
        speed={[0, speed * 0.5, 0]}
        color="#00d4ff"
        emissiveIntensity={2.5}
      />
      {/* Ring 2 — vertical, blue */}
      <Ring
        radius={1.5} tube={0.006}
        rotation={[0, 0, 0]}
        speed={[0, -speed * 0.3, speed * 0.1]}
        color="#0066ff"
        emissiveIntensity={2}
      />
      {/* Ring 3 — diagonal, orange accent */}
      <Ring
        radius={1.65} tube={0.005}
        rotation={[Math.PI / 4, Math.PI / 6, 0]}
        speed={[speed * 0.2, 0, speed * 0.15]}
        color="#ff6600"
        emissiveIntensity={1.5}
      />
      {/* Ring 4 — outer orbit, cyan, counter-rotating */}
      <Ring
        radius={1.9} tube={0.004}
        rotation={[Math.PI / 3, Math.PI / 4, 0]}
        speed={[-speed * 0.15, speed * 0.1, -speed * 0.2]}
        color="#00d4ff"
        emissiveIntensity={1}
      />
      {/* Ring 5 — equatorial glow ring */}
      <Ring
        radius={1.35} tube={0.012}
        rotation={[Math.PI / 2, 0, 0]}
        speed={[0, -speed * 0.25, 0]}
        color="#0044aa"
        emissiveIntensity={1.5}
      />
    </group>
  )
}
