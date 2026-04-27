import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Mesh } from 'three'

export default function WireframeGlobe() {
  const meshRef = useRef<Mesh>(null)
  const { mouse } = useThree()

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y = clock.elapsedTime * 0.12
    meshRef.current.rotation.x = mouse.y * 0.3
    meshRef.current.rotation.z = mouse.x * 0.1
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -1]}>
      <sphereGeometry args={[2.8, 24, 24]} />
      <meshBasicMaterial
        color="#00ff87"
        wireframe
        transparent
        opacity={0.18}
      />
    </mesh>
  )
}
