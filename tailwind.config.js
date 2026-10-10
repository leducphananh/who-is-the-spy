/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        detective: {
          dark: '#030712', // slate-950
          card: '#0f172a', // slate-900
          border: '#1e293b', // slate-800
          amber: '#fbbf24', // amber-400
          cyan: '#22d3ee', // cyan-400
          danger: '#f43f5e', // rose-500
          safe: '#34d399', // emerald-400
        },
      },
    },
  },
  plugins: [],
}
