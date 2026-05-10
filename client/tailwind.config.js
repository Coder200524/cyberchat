/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0D0D0D',
          card: '#111827',
          cyan: '#00F5FF',
          purple: '#A855F7',
          gray: '#374151',
          lightText: '#E5E7EB',
        }
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'cyan-glow': '0 0 10px #00F5FF, 0 0 20px #00F5FF',
        'purple-glow': '0 0 10px #A855F7, 0 0 20px #A855F7',
      }
    },
  },
  plugins: [],
}
