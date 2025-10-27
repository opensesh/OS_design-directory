import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { generateSphereLayout, generateGalaxyLayout, generateGridLayout } from '../../utils/particleLayouts'
import { useAppStore } from '../../store/useAppStore'

interface ParticleSystemProps {
  count?: number
  radius?: number
}

export default function ParticleSystem({ count = 1000, radius = 15 }: ParticleSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const viewMode = useAppStore((state) => state.viewMode)
  const setTransitioning = useAppStore((state) => state.setTransitioning)

  // Generate all three layouts once
  const spherePositions = useMemo(() => generateSphereLayout(count, radius), [count, radius])
  const galaxyPositions = useMemo(() => generateGalaxyLayout(count, radius), [count, radius])
  const gridPositions = useMemo(() => generateGridLayout(count, 2), [count])

  // Track current and target positions for transitions
  const [currentPositions, setCurrentPositions] = useState(spherePositions)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const prevViewModeRef = useRef(viewMode)

  // Get target positions based on viewMode
  const getTargetPositions = (mode: string) => {
    switch (mode) {
      case 'galaxy':
        return galaxyPositions
      case 'grid':
        return gridPositions
      default:
        return spherePositions
    }
  }

  // Handle viewMode changes with smooth transition
  useEffect(() => {
    if (prevViewModeRef.current === viewMode) return

    const fromPositions = currentPositions
    const toPositions = getTargetPositions(viewMode)

    setIsTransitioning(true)
    setTransitioning(true)

    const duration = 1500
    const startTime = Date.now()
    const tempPositions = new Float32Array(fromPositions.length)

    const animate = () => {
      const elapsed = Date.now() - startTime
      const t = Math.min(elapsed / duration, 1)

      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2

      for (let i = 0; i < fromPositions.length; i++) {
        tempPositions[i] = fromPositions[i] + (toPositions[i] - fromPositions[i]) * eased
      }

      setCurrentPositions(new Float32Array(tempPositions))

      if (t < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsTransitioning(false)
        setTransitioning(false)
        prevViewModeRef.current = viewMode
      }
    }

    requestAnimationFrame(animate)
  }, [viewMode, currentPositions, spherePositions, galaxyPositions, gridPositions, setTransitioning])

  // Update InstancedMesh positions every frame
  useEffect(() => {
    if (!meshRef.current) return

    const dummy = new THREE.Object3D()

    for (let i = 0; i < count; i++) {
      dummy.position.set(
        currentPositions[i * 3],
        currentPositions[i * 3 + 1],
        currentPositions[i * 3 + 2]
      )
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  }, [currentPositions, count])

  // Subtle rotation animation (disabled during transitions)
  useFrame(() => {
    if (meshRef.current && !isTransitioning && viewMode === 'sphere') {
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
