import { useState, useEffect } from 'react'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  useEffect(() => {
    if (menuOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-50 bg-brand-charcoal border-b border-[var(--border-secondary)]">
      <div className="w-full max-w-[1184px] mx-auto px-6 py-3 flex items-center justify-between">
        {/* Brand Logo - Small Icon */}
        <div className="flex items-center">
          <button onClick={handleScrollToTop} className="flex items-center cursor-pointer">
            <img
              src="/assets/logos/brandmark-vanilla.svg"
              alt="Brand Logo"
              className="w-6 h-6"
            />
          </button>
        </div>

        {/* Hamburger/Close Menu Icon (Mobile & Desktop) */}
        <button
          className="relative flex items-center justify-center w-6 h-6"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          type="button"
        >
          {/* Hamburger Lines - transform to X when open */}
          <div
            className={`absolute flex flex-col items-center justify-center w-6 h-6 transition-all duration-300 ease-in-out pointer-events-none ${menuOpen ? 'rotate-180' : 'rotate-0'}`}
          >
            {/* Top line - rotates to form top part of X */}
            <span className={`absolute w-[18px] h-[1.5px] bg-brand-vanilla transition-all duration-300 ease-in-out pointer-events-none ${
              menuOpen ? 'rotate-45 translate-y-0' : 'rotate-0 -translate-y-[3px]'
            }`} />
            {/* Bottom line - rotates to form bottom part of X */}
            <span className={`absolute w-[18px] h-[1.5px] bg-brand-vanilla transition-all duration-300 ease-in-out pointer-events-none ${
              menuOpen ? '-rotate-45 translate-y-0' : 'rotate-0 translate-y-[3px]'
            }`} />
          </div>
        </button>
      </div>
    </header>
  )
}
