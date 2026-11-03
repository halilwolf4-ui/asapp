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
          deep: "var(--color-bg-deep)",
          surface: "var(--color-bg-surface)",
          card: "var(--color-bg-card)",
          elevated: "var(--color-bg-elevated)",
        },
        accent: {
          pink: "var(--color-accent-pink)",
          coral: "var(--color-accent-coral)",
          mint: "var(--color-accent-mint)",
          yellow: "var(--color-accent-yellow)",
          purple: "var(--color-accent-purple)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          accent: "var(--color-text-accent)",
        }
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "-apple-system", "sans-serif"],
        display: ["'Outfit'", "'Plus Jakarta Sans'", "sans-serif"],
      },
      fontSize: {
        'display-2xl': ['5.5rem', { lineHeight: '1', letterSpacing: '-0.04em', fontWeight: '800' }],
        'display-xl': ['4.25rem', { lineHeight: '1.05', letterSpacing: '-0.035em', fontWeight: '800' }],
        'display-lg': ['3.25rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '750' }],
        'display-md': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.025em', fontWeight: '700' }],
      },
      screens: {
        'tablet-p': '768px',  // Tablet Portrait
        'tablet-l': '1024px', // Tablet Landscape
        'desktop': '1280px',
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      }
    },
  },
  plugins: [],
}

