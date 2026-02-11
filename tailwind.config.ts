import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '400px',  // Custom breakpoint for very small devices
      },
      borderColor: {
        DEFAULT: 'var(--border-secondary)',
      },
      colors: {
        // BRAND-OS Color System (static values for specific use cases)
        brand: {
          charcoal: '#191919',
          vanilla: '#FFFAEE',
          aperol: '#FE5102',
        },
        // OS palette - now maps to CSS variables for theme responsiveness
        // Class names retain '-dark' suffix for backwards compatibility
        os: {
          'bg-darker': 'var(--bg-primary)',
          'bg-dark': 'var(--bg-primary)',
          'surface-dark': 'var(--bg-secondary)',
          'border-dark': 'var(--border-secondary)',
          'text-primary-dark': 'var(--fg-primary)',
          'text-secondary-dark': 'var(--fg-secondary)',
        },
      },
      fontFamily: {
        sans: ['"Neue Haas Grotesk Display Pro"', 'system-ui', 'sans-serif'],
        display: ['"Neue Haas Grotesk Display Pro"', 'system-ui', 'sans-serif'],
        text: ['"Neue Haas Grotesk Display Pro"', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        mono: ['Offbit', 'ui-monospace', 'monospace'],
        accent: ['Offbit', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'brand': '12px',
        'brand-lg': '16px',
      },
      boxShadow: {
        'brand': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'brand-lg': '0 4px 16px rgba(0, 0, 0, 0.15)',
      },
      fontSize: {
        // DISPLAY STYLES (Mobile sizes - use with md: and xl: for responsive)
        // Display 1: 60px → 112px → 160px
        'd1-mobile': ['60px', { lineHeight: '1.2', letterSpacing: '-2px', fontWeight: '700' }],
        'd1-tablet': ['112px', { lineHeight: '1.2', letterSpacing: '-3.5px', fontWeight: '700' }],
        'd1-desktop': ['160px', { lineHeight: '1.2', letterSpacing: '-4px', fontWeight: '700' }],

        // Display 2: 38px → 80px → 120px
        'd2-mobile': ['38px', { lineHeight: '1.25', letterSpacing: '-0.5px', fontWeight: '500' }],
        'd2-tablet': ['80px', { lineHeight: '1.25', letterSpacing: '-1px', fontWeight: '500' }],
        'd2-desktop': ['120px', { lineHeight: '1.25', letterSpacing: '-2px', fontWeight: '500' }],

        // HEADING STYLES (Mobile sizes - use with md: and xl: for responsive)
        // Heading 1: 32px → 40px → 56px
        'h1-mobile': ['32px', { lineHeight: '1.2', letterSpacing: '-0.25px', fontWeight: '700' }],
        'h1-tablet': ['40px', { lineHeight: '1.2', letterSpacing: '-1px', fontWeight: '700' }],
        'h1-desktop': ['56px', { lineHeight: '1.2', letterSpacing: '-1.5px', fontWeight: '700' }],

        // Heading 2: 28px → 36px → 48px
        'h2-mobile': ['28px', { lineHeight: '1.2', letterSpacing: '-0.75px', fontWeight: '700' }],
        'h2-tablet': ['36px', { lineHeight: '1.2', letterSpacing: '-0.75px', fontWeight: '700' }],
        'h2-desktop': ['48px', { lineHeight: '1.2', letterSpacing: '-1px', fontWeight: '700' }],

        // Heading 3: 24px → 30px → 40px
        'h3': ['24px', { lineHeight: '1.2', letterSpacing: '-0.25px', fontWeight: '600' }],
        'h3-tablet': ['30px', { lineHeight: '1.2', letterSpacing: '-0.5px', fontWeight: '600' }],
        'h3-desktop': ['40px', { lineHeight: '1.2', letterSpacing: '-0.5px', fontWeight: '600' }],

        // Heading 4: 22px → 28px → 32px
        'h4-mobile': ['22px', { lineHeight: '1.2', letterSpacing: '-0.25px', fontWeight: '600' }],
        'h4-tablet': ['28px', { lineHeight: '1.2', letterSpacing: '-0.25px', fontWeight: '600' }],
        'h4-desktop': ['32px', { lineHeight: '1.2', letterSpacing: '-0.25px', fontWeight: '600' }],

        // Heading 5: 20px → 24px → 28px (Offbit font)
        'h5-mobile': ['20px', { lineHeight: '1.25', letterSpacing: '0', fontWeight: '400' }],
        'h5-tablet': ['24px', { lineHeight: '1.25', letterSpacing: '0', fontWeight: '400' }],
        'h5-desktop': ['28px', { lineHeight: '1.25', letterSpacing: '0', fontWeight: '400' }],

        // Heading 6: 18px → 22px → 24px (Offbit font)
        'h6-mobile': ['18px', { lineHeight: '1.2', letterSpacing: '0', fontWeight: '400' }],
        'h6-tablet': ['22px', { lineHeight: '1.2', letterSpacing: '0', fontWeight: '400' }],
        'h6-desktop': ['24px', { lineHeight: '1.2', letterSpacing: '0', fontWeight: '400' }],

        // BODY STYLES (Fixed across all breakpoints)
        // Body 1: 20px (all devices)
        'b1': ['20px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],

        // Body 2: 16px (all devices)
        'b2': ['16px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],

        // COMPONENT STYLES (Fixed across all breakpoints)
        // Button: 16px
        'button': ['16px', { lineHeight: '1.25', letterSpacing: '0', fontWeight: '500' }],

        // Caption: 12px
        'caption': ['12px', { lineHeight: '1.25', letterSpacing: '0', fontWeight: '400' }],

        // Label: 12px (uppercase with letter spacing)
        'label': ['12px', { lineHeight: '1.25', letterSpacing: '0.5px', fontWeight: '500' }],
      },
      animation: {
        blob: 'blob 10s infinite',
        cursor: 'cursor .75s step-end infinite',
        'dot-pulse': 'dot-pulse 1.4s ease-in-out infinite',
        'dot-wave': 'dot-wave 0.6s ease-in-out infinite',
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        cursor: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'dot-pulse': {
          '0%, 100%': {
            transform: 'scale(0.8)',
            opacity: '0.4',
          },
          '50%': {
            transform: 'scale(1.2)',
            opacity: '1',
          },
        },
        'dot-wave': {
          '0%, 100%': {
            transform: 'translateY(0) scale(1)',
          },
          '50%': {
            transform: 'translateY(-4px) scale(1.1)',
          },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
