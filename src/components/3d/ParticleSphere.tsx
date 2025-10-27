import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { generateSphereLayout } from '../../utils/particleLayouts'

interface ParticleSphereProps {
  count?: number
  radius?: number
}

export default function ParticleSphere({ count = 1000, radius = 15 }: ParticleSphereProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  // Generate Fibonacci sphere positions
  const positions = useMemo(() => generateSphereLayout(count, radius), [count, radius])

  // Set up instanced mesh with positions
  useEffect(() => {
    if (!meshRef.current) return

    const dummy = new THREE.Object3D()

    for (let i = 0; i < count; i++) {
      dummy.position.set(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      )
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  }, [count, positions])

  // Subtle rotation animation
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001
    }
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshBasicMaterial color="#FE5102" />
    </instancedMesh>
  )
}
