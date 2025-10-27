# Design Directory

An interactive 3D design resource repository created by [Open Session](https://opensession.co) to help enable and inspire designers worldwide.

## Purpose

This project serves as a living, interactive catalog of design resources curated by Open Session. Rather than a traditional static list, we've built an immersive 3D particle visualization that makes discovering design tools, inspiration, and resources an engaging experience.

**Key Features:**
- **Interactive 3D Visualization** - Each particle represents a design resource, creating a dynamic constellation of tools and inspiration
- **Multiple View Modes** - Switch between Sphere, Galaxy, and Grid layouts to explore resources in different spatial arrangements
- **Intuitive Navigation** - Use your mouse to orbit, zoom, and explore the particle system from any angle
- **Designed for Designers** - Built with the same attention to detail and craft that we bring to all our design work

**Coming Soon:**
- Category filtering (UX, Brand, Art, Code)
- Resource detail views with descriptions and links
- List view for traditional browsing
- Search and tag-based filtering
- Community contributions

This repository is actively evolving. We're building new features and interaction methods to make design resource discovery more intuitive and inspiring.

## Architecture

### Tech Stack

**Core Framework:**
- **React 18** - Modern React with hooks for component logic
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server

**3D Rendering:**
- **Three.js** - WebGL-based 3D graphics library
- **React Three Fiber (R3F)** - React renderer for Three.js, enabling declarative 3D scenes
- **@react-three/drei** - Helper components for common R3F patterns (OrbitControls)

**State Management:**
- **Zustand** - Lightweight state management for view modes and transitions

**Styling:**
- **Tailwind CSS v4** - Utility-first CSS with custom brand colors

### Project Structure

```
src/
├── components/
│   ├── 3d/
│   │   └── ParticleSystem.tsx          # Core 3D particle renderer
│   └── ui/
│       └── ViewToggle.tsx              # View mode switcher (Sphere/Galaxy/Grid)
├── utils/
│   └── particleLayouts.ts              # Algorithms for particle positioning
├── store/
│   └── useAppStore.ts                  # Global state management
└── App.tsx                             # Main application component
```

### How It Works

**Particle System:**
The heart of the application is `ParticleSystem.tsx`, which uses Three.js InstancedMesh to efficiently render 1000 particles in a single draw call. Each particle is a small orange sphere positioned using mathematical distribution algorithms.

**Layout Algorithms:**
- **Fibonacci Sphere** - Evenly distributes particles across a sphere surface using the golden ratio
- **Galaxy** - Creates a spiral galaxy formation with arms extending from the center
- **Grid** - Arranges particles in a clean 3D grid pattern

**Morphing Transitions:**
When switching between view modes, particles smoothly animate from their current positions to new target positions using cubic easing over 1.5 seconds. The system prevents new transitions from starting while one is in progress, ensuring smooth visual flow.

**State Management:**
Zustand provides a minimal global store tracking:
- Current view mode (`sphere` | `galaxy` | `grid`)
- Transition state (prevents overlapping animations)

**Performance:**
- InstancedMesh rendering keeps frame rate at 60fps even with 1000 particles
- Fibonacci sphere algorithm provides optimal particle distribution
- Transition animations use requestAnimationFrame for smooth, efficient updates

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

The dev server runs at `http://localhost:5173/` with hot module replacement for instant feedback during development.

### Design Philosophy

Every aspect of this project reflects Open Session's commitment to craft:
- **Brand-First Design** - Custom Aperol orange (#FE5102) and charcoal background (#0A0E27)
- **Smooth Interactions** - Carefully tuned easing curves and transition timing
- **Performance Matters** - Optimized rendering techniques for fluid 60fps experience
- **Iterative Development** - Building features incrementally while maintaining stability

---

**Built with care by [Open Session](https://opensession.co)**
