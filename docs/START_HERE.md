# 🌌 3D Design Directory - Complete Build Guide

## 📋 Project Summary

Building a 3D particle-based design resource directory with morphing transitions:
- **Home View**: Rotating particle sphere (1000 particles)
- **Explore View**: Flattened galaxy with spiral arms
- **List View**: Traditional grid layout
- **Resource Pages**: Detailed view with AI summaries

**Key Feature**: Smooth morphing animations between all three layouts

---

## 🎯 Tech Stack

- Vite + React 18 + TypeScript
- React Three Fiber + Drei (3D)
- Three.js (WebGL)
- Framer Motion (UI animations)
- Tailwind CSS (styling)
- Zustand (state management)

---

## ⚡ AI Code Editor Starter Prompt

**Copy this into your AI code editor (Claude Code, Cursor, etc.) to begin:**

```
I want to build a 3D Design Directory with particle visualizations that morph between sphere, galaxy, and grid layouts.

Tech stack:
- Vite + React 18
- React Three Fiber (@react-three/fiber) + Drei
- Framer Motion
- Tailwind CSS
- Zustand

Please:
1. Initialize: npm create vite@latest . -- --template react
2. Install dependencies:
   npm install @react-three/fiber @react-three/drei three framer-motion zustand
   npm install -D tailwindcss autoprefixer postcss
3. Set up Tailwind: npx tailwindcss init -p
4. Create folder structure:

src/
├── components/
│   ├── canvas/
│   │   ├── InspoCanvas.tsx
│   │   ├── ResourceNodes.tsx
│   │   └── GalaxyBackground.tsx
│   ├── ui/
│   │   ├── CategoryButtons.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── InspoTable.tsx
│   ├── card-view/
│   │   ├── CardView.tsx
│   │   ├── CategoryGrid.tsx
│   │   └── ResourceCard.tsx
│   └── search/
│       └── SearchModal.tsx
├── pages/
│   ├── Home.tsx
│   └── ResourceDetail.tsx
├── hooks/
│   ├── useParticleTransition.ts
│   └── useKeyboardShortcuts.ts
├── store/
│   └── useAppStore.ts
├── utils/
│   ├── particleLayouts.ts
│   └── orbital-layout.ts
└── data/
    └── resources.json

5. Create basic Three.js scene in App.tsx with:
   - Canvas from R3F
   - OrbitControls from drei
   - Ambient light
   - Temporary grid helper

6. Start dev server and verify it works!

After this, I'll implement the Fibonacci sphere particle distribution.
```

---

## 📅 5-Day Build Plan

### Day 1: Foundation + Particle Sphere
- ✅ Project setup
- ✅ Basic Three.js scene
- ✅ Fibonacci sphere distribution (1000 particles)
- ✅ InstancedMesh optimization
- ✅ Category color coding (Tools/Inspiration/AI/Learning/Templates/Community)
- ✅ Auto-rotation

### Day 2: Morph System Architecture
- ✅ Layout generator functions (sphere/galaxy/grid)
- ✅ Zustand state management
- ✅ Design transition system
- ✅ Test basic interpolation

### Day 3: Morph Implementation ⭐
- ✅ Lerp-based position interpolation
- ✅ Camera animation during transition
- ✅ Smooth easing functions
- ✅ Loading overlay
- ✅ All three layouts working

### Day 4: Interactions + UI
- ✅ Raycasting for particle clicks
- ✅ Floating resource cards
- ✅ Category filter buttons
- ✅ View toggle (3D ↔ List)
- ✅ List view implementation
- ✅ Resource detail pages

### Day 5: Polish + Deploy
- ✅ Mobile responsiveness
- ✅ Performance optimization (maintain 60fps)
- ✅ Accessibility features
- ✅ SEO meta tags
- ✅ Deploy to Vercel/Netlify

---

## 🔑 Critical Code Snippets

### Fibonacci Sphere Distribution
```javascript
function generateSpherePositions(count, radius) {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  
  return positions;
}
```

### Galaxy Spiral Distribution
```javascript
function generateGalaxyPositions(count, maxRadius) {
  const positions = new Float32Array(count * 3);
  const arms = 3;
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 * arms;
    const distance = (i / count) * maxRadius;
    
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const z = (Math.random() - 0.5) * 50; // Thin disc
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  
  return positions;
}
```

### Morph Transition Hook
```javascript
function useMorphTransition(fromLayout, toLayout, duration = 1500) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      // Ease-in-out-cubic
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      setProgress(eased);
      
      if (t < 1) requestAnimationFrame(animate);
    };
    
    animate();
  }, [fromLayout, toLayout]);
  
  return progress;
}
```

### Particle Click Detection
```javascript
function useParticleInteraction(particlesRef) {
  const raycaster = useMemo(() => {
    const r = new THREE.Raycaster();
    r.params.Points.threshold = 5;
    return r;
  }, []);
  
  const handleClick = (event) => {
    const pointer = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1
    };
    
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(particlesRef.current);
    
    if (intersects.length > 0) {
      const particleIndex = intersects[0].index;
      onParticleClick(particleIndex);
    }
  };
  
  return handleClick;
}
```

---

## 🎨 Design System

### Colors (Category-coded)
```css
Tools:       #EC4899 (Pink)
Inspiration: #FF5102 (Orange)
AI:          #06B6D4 (Cyan)
Learning:    #10B981 (Green)
Templates:   #F59E0B (Amber)
Community:   #3B82F6 (Blue)

Background (dark):  #141414
Background (light): #faf8f5
Brand accent:       #FE5102 (Aperol)
```

### Particle Specs
- Count: 1000 (desktop), 500 (mobile)
- Size: 2-4px base, 6-8px hover
- Glow: Subtle additive blending
- Color: Category-based with transitions

---

## 📂 Resource Data Schema

```json
[
  {
    "id": 1,
    "name": "Figma",
    "url": "https://figma.com",
    "description": "Cloud-based collaborative interface design platform...",
    "category": "Tools",
    "subCategory": "Design",
    "pricing": "Freemium",
    "featured": true,
    "opensource": false,
    "tags": ["design", "prototyping", "collaboration", "ui/ux"],
    "count": null,
    "tier": 1,
    "thumbnail": null,
    "screenshot": "/assets/screenshots/1-figma.jpg",
    "gravityScore": 9.8,
    "gravityRationale": "Industry standard for collaborative UI design"
  }
]
```

**Key fields:**
- `gravityScore` (1.0-10.0): Controls position in 3D view — higher scores appear closer to center
- `screenshot`: Path relative to `public/`, captured via automation scripts
- `category`: Must be one of: `Tools`, `Inspiration`, `AI`, `Learning`, `Templates`, `Community`
- `pricing`: `Free`, `Freemium`, or `Paid`

---

## 🚨 Performance Targets

- **60 FPS** (constant frame rate)
- **< 3s load time** on 3G
- **< 500KB** bundle size (gzipped)
- **> 90** Lighthouse Performance score

### Optimization Checklist
- [x] Use InstancedMesh (critical!)
- [x] Reduce particles on mobile
- [x] BufferGeometry for all shapes
- [x] Proper Three.js disposal
- [x] Lazy load heavy components
- [x] Code splitting

---

## 💡 Working with AI Code Editors

### Good Prompts
✅ "Implement Fibonacci sphere in InspoCanvas.tsx using phi = acos(-1 + 2i/n)"
✅ "Add raycasting with threshold=5 for particle clicks"
✅ "Optimize with InstancedMesh, verify 60fps"

### Bad Prompts
❌ "Make the particles look cool"
❌ "Fix the animation"
❌ "Build the whole thing"

### Pro Tips
1. **Be specific** - Reference exact files and algorithms
2. **Test incrementally** - Verify each feature works
3. **Commit often** - Save progress frequently
4. **Use extended thinking** - Ask for architecture plans
5. **Reference docs** - Point to Three.js examples

---

## 🔄 Development Workflow

```
Session 1: Setup
→ Initialize project
→ Verify dev server runs
→ See empty scene
✅ CHECKPOINT

Session 2: Basic Sphere
→ Implement Fibonacci distribution
→ Test with 100 particles
→ Scale to 1000
→ Add rotation
✅ CHECKPOINT

Session 3: Optimize
→ Switch to InstancedMesh
→ Add color coding
→ Verify 60fps
✅ CHECKPOINT

Session 4: Morph Design
→ Plan architecture
→ Create layout generators
→ Set up state management
✅ CHECKPOINT

[Continue through Day 5...]
```

---

## 🆘 Common Issues

### Particles not showing
1. Check camera position/distance
2. Verify particle positions in range
3. Try larger particle size temporarily
4. Add axes/grid helpers for debugging

### Low FPS
1. Verify InstancedMesh is being used
2. Reduce particle count
3. Check for unnecessary re-renders
4. Profile in Chrome DevTools

### Morph looks jumpy
1. Use requestAnimationFrame (not setInterval)
2. Check easing function
3. Ensure frame-independent timing
4. Test with longer duration

---

## 📚 Resources

- [Three.js Journey](https://threejs-journey.com) - Best course
- [R3F Docs](https://docs.pmnd.rs/react-three-fiber)
- [Drei Helpers](https://github.com/pmndrs/drei)
- [Three.js Examples](https://threejs.org/examples/)

---

## ✅ Day 1 Success Criteria

By end of Day 1, you should have:
- [x] Rotating particle sphere
- [x] 1000 particles at 60fps
- [x] Color-coded categories
- [x] Smooth auto-rotation
- [x] Sample resource data

**Take a screenshot!** This is your foundation.

---

## 🎯 Next Session Prompts

### After Day 1 Sphere Works:
```
Great! The sphere is working. Now let's design the morph system.

Please create:
1. src/utils/particleLayouts.ts with three functions:
   - generateSphereLayout(count, radius)
   - generateGalaxyLayout(count, maxRadius)
   - generateGridLayout(count, columns)

2. src/store/useAppStore.ts with Zustand:
   - viewMode: '3d' | 'card' | 'table'
   - activeCategory: null | 'Tools' | 'Inspiration' | 'AI' | 'Learning' | 'Templates' | 'Community'
   - setViewMode, setCategory actions

3. Plan the transition algorithm that will lerp between layouts.

Let me know when complete and I'll review the architecture!
```

---

## 🚀 Ready to Build!

Open your AI code editor and paste the **AI Code Editor Starter Prompt** above to begin.

The full conversation context is preserved here - reference this document anytime you need to remember the plan or find key code snippets.

**You got this!**

---

*Last updated: February 2026*
*Original build time: ~30-40 hours over 5 days*
