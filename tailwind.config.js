/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          charcoal: '#191919',
          vanilla: '#FFFAEE',
          aperol: '#FE5102',
        },
      },
      fontFamily: {
        display: ['"Neue Haas Grotesk Display Pro"', 'system-ui', 'sans-serif'],
        text: ['"Neue Haas Grotesk Text Pro"', 'system-ui', 'sans-serif'],
        mono: ['Offbit', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        accent: ['Offbit', 'ui-monospace', 'SFMono-Regular', 'monospace'],
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
    },
  },
  plugins: [],
}
