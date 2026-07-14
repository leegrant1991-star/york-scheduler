/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        york: {
          navy: '#060D24',
          light: '#0B1638', // "navy-light"
          card: '#111F47', // "navy-card"
          'card-hover': '#16295C',
          gold: '#E79B2D',
          'gold-hover': '#F0A73C',
          'gold-muted': 'rgba(231,155,45,0.14)',
          white: '#FFFFFF',
          gray: '#C7CDD9', // "light-gray"
          muted: '#8892A6',
          border: 'rgba(255,255,255,0.08)',
          'border-strong': 'rgba(255,255,255,0.16)',
          success: '#3DDC84',
          danger: '#F0554C',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'york-grid': `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
        'york-radial': 'radial-gradient(circle at top left, rgba(231,155,45,0.12), transparent 55%)',
      },
      backgroundSize: {
        grid: '28px 28px',
      },
      boxShadow: {
        'york-sm': '0 1px 2px rgba(0,0,0,0.4)',
        'york-md': '0 8px 24px rgba(0,0,0,0.45)',
        'york-gold': '0 0 0 1px rgba(231,155,45,0.4), 0 0 24px rgba(231,155,45,0.25)',
      },
      keyframes: {
        'york-fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'york-fade-up': 'york-fade-up 0.32s ease-out both',
      },
    },
  },
  plugins: [],
};
