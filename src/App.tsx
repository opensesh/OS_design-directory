import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import ParticleSystem from './components/3d/ParticleSystem'
import ViewToggle from './components/ui/ViewToggle'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* View Toggle Buttons */}
      <ViewToggle />

      <Canvas
        camera={{ position: [0, 0, 30], fov: 75 }}
        gl={{ alpha: false }}
        style={{ background: '#0A0E27' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />

        {/* Particle System - Morphs between layouts */}
        <ParticleSystem count={1000} radius={15} />

        {/* Camera Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  )
}

export default App
