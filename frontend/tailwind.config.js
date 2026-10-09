/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base:     '#080C14',
          surface:  '#0F1623',
          card:     '#141C2E',
          elevated: '#1A2340',
        },
        brand: {
          cyan:   '#00D8FF',
          indigo: '#6366F1',
          violet: '#8B5CF6',
        },
        ui: {
          border:  'rgba(255,255,255,0.07)',
          muted:   '#4B5563',
          subtle:  '#1F2A3C',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          danger:  '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'glow-cyan':   'radial-gradient(ellipse at center, rgba(0,216,255,0.15) 0%, transparent 70%)',
        'glow-indigo': 'radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)',
        'glow-violet': 'radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 70%)',
        'primary-btn': 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        'ai-card':     'linear-gradient(135deg, rgba(0,216,255,0.1) 0%, rgba(99,102,241,0.1) 100%)',
      },
      boxShadow: {
        'glass':        '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-hover':  '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
        'btn-primary':  '0 8px 24px rgba(99,102,241,0.4)',
        'btn-cyan':     '0 8px 24px rgba(0,216,255,0.3)',
        'glow-sm':      '0 0 12px rgba(0,216,255,0.3)',
        'glow-md':      '0 0 24px rgba(0,216,255,0.4)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'pulse-slow':  'pulse 3s ease-in-out infinite',
        'float':       'float 4s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'glow-ring':   'glowRing 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowRing: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0,216,255,0.4)' },
          '50%':      { boxShadow: '0 0 24px rgba(0,216,255,0.8)' },
        },
      },
    },
  },
  plugins: [],
}
