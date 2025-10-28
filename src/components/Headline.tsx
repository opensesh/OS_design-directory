/**
 * Headline Component
 *
 * "Design Directory" centered display text.
 *
 * Design specs from Figma (node-id=540-17001):
 * - Font: Neue Haas Grotesk Display Pro, weight 700 (Bold)
 * - Size: 96px desktop (≥1024px), 64px tablet (≥640px), 40px mobile
 * - Color: #FFFAEE (Vanilla) at 95% opacity
 * - Position: Viewport center using transform
 * - Letter spacing: -0.03em (tighter for large display text)
 * - Line height: 0.9 (compact for impact)
 * - Enhanced text shadow for legibility over particle animation
 * - Font smoothing: antialiased for crisp rendering
 * - z-index: 5 (above particles z-1, below sidebar z-100)
 */
export default function Headline() {
  return (
    <div
      className="pointer-events-none"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 5,
        textAlign: 'center',
        width: '100%',
        padding: '0 24px',
      }}
    >
      <h1
        className="font-display font-bold whitespace-nowrap"
        style={{
          fontSize: 'clamp(40px, 8vw, 96px)', // Responsive: 40px min, 96px max
          color: '#FFFAEE',
          opacity: 0.95,
          letterSpacing: '-0.03em',
          lineHeight: '0.9',
          textShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
        }}
      >
        Design Directory
      </h1>
    </div>
  )
}
