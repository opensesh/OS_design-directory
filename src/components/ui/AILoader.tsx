/**
 * AILoader
 *
 * Animated loader component with Aperol-branded visuals.
 * Uses existing CSS keyframes from globals.css:
 * - loader-rotate: Rotating sphere with Aperol glow
 * - loader-letter-anim: Staggered letter animation
 */

export function AILoader() {
  const text = 'LOADING';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-os-bg-dark gap-8">
      {/* Rotating sphere with Aperol glow */}
      <div
        className="w-20 h-20 rounded-full"
        style={{
          animation: 'loader-rotate 2.5s ease-in-out infinite',
          boxShadow: `
            0 10px 20px 0 #fff inset,
            0 20px 30px 0 #FE7A42 inset,
            0 60px 60px 0 #FE5102 inset
          `,
        }}
      />

      {/* Animated text */}
      <div className="flex gap-1 font-display text-2xl tracking-[0.3em] text-os-text-primary-dark">
        {text.split('').map((letter, i) => (
          <span
            key={i}
            className="inline-block"
            style={{
              animation: 'loader-letter-anim 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
            }}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}

export default AILoader;
