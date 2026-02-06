Problem Statement
The 3D universe view can be laggy on mobile, and the current fade-in doesn't guarantee the scene is fully ready before revealing. The user wants a delightful fade-in only when everything is officially ready.

Current Implementation Analysis
Loading State Flow (Home.tsx)

1. Page loads → showLoader=true, universeReady=false
2. InspoCanvas lazy-loads via Suspense
3. GalaxySystem starts layer fade-in (skybox→nebula→nodes)
4. When layers reach thresholds → onReady() called
5. universeReady=true → setTimeout(300ms) → showLoader=false
6. Canvas fades in with DURATION.cinematic (800ms)
Issues Found
Issue	Location	Severity
300ms arbitrary delay between readiness and loader dismiss	Home.tsx:411	High
Timing mismatch - loader exits (500ms) vs canvas fades (800ms)	Home.tsx:371-387	High
No visual progress - "Generating World" doesn't reflect actual state	AILoader.tsx	Medium
O(n) raycasting every frame on all resources	InspoCanvas:365-421	High (mobile)
No mobile detection - loads full 3D regardless of device	Home.tsx	High
Silent Suspense fallback - fallback={null}	Home.tsx:400	Medium
Current Ready Condition (InspoCanvas:790-798)
The scene signals "ready" when:

Skybox opacity ≥ 95%
Nebula opacity ≥ 95%
Nodes opacity ≥ 50%
This fires ~900-950ms after mount, but the transition timing doesn't coordinate well.

Proposed Solution
Coordinate Loader Exit + Canvas Fade-In
Strategy: Use a phased approach where the loader completes its exit before the canvas fades in, creating one continuous motion.

Current Flow (buggy):


onReady() → universeReady=true → [300ms delay] → showLoader=false
                    ↓
            Canvas starts fading (800ms)
                    ↓
            Loader starts exiting (500ms)  ← OVERLAP = JANK
New Flow (coordinated):


onReady() → phase='transitioning' → Loader exits (300ms)
                                         ↓
                               onExitComplete → phase='ready'
                                         ↓
                               Canvas fades in (800ms)
Implementation in Home.tsx:

Replace the two separate states with a single phase:


// Current (buggy):
const [universeReady, setUniverseReady] = useState(false);
const [showLoader, setShowLoader] = useState(true);

// New (coordinated):
type LoadingPhase = 'loading' | 'transitioning' | 'ready';
const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('loading');
When InspoCanvas signals ready:


onReady={() => {
  setLoadingPhase('transitioning'); // Start loader exit animation
}}
Use AnimatePresence onExitComplete to sequence:


<AnimatePresence onExitComplete={() => setLoadingPhase('ready')}>
  {loadingPhase === 'loading' && (
    <motion.div
      key="loader"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURATION.normal, ease: EASING.smooth }}
    >
      <AILoader />
    </motion.div>
  )}
</AnimatePresence>
Canvas fades in only after loader is fully gone:


<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: loadingPhase === 'ready' ? 1 : 0 }}
  transition={{ duration: DURATION.cinematic, ease: EASING.smooth }}
>
  <InspoCanvas ... />
</motion.div>
Timeline Summary
Phase	Duration	What Happens
loading	Until 3D ready	AILoader visible, canvas hidden
transitioning	300ms	Loader fades out smoothly
ready	800ms	Canvas fades in cinematically
Total	~1100ms	Seamless, coordinated reveal
