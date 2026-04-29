/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#0f172a',          // slate-900
        'sidebar-hover': '#1e293b',  // slate-800
        'sidebar-muted': '#94a3b8',  // slate-400
        accent: '#22c55e',           // emerald-500 — primary CTA
        'accent-dark': '#16a34a',    // emerald-600
        'accent-soft': '#dcfce7',    // emerald-100
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
