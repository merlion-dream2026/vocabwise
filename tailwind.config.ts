import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './data/**/*.json',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        starter: {
          DEFAULT: '#FF6B9D',
          light: '#FFF0F6',
          border: '#FFB3D4',
          dark: '#E0457A',
        },
        explorer: {
          DEFAULT: '#4A90D9',
          light: '#EEF5FF',
          border: '#A8CCEF',
          dark: '#2D6DB5',
        },
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
      },
      animation: {
        'bounce-soft': 'bounce-soft 0.4s ease',
        'flip-in': 'flip-in 0.3s ease',
      },
      keyframes: {
        'bounce-soft': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        'flip-in': {
          '0%': { opacity: '0', transform: 'rotateY(90deg)' },
          '100%': { opacity: '1', transform: 'rotateY(0deg)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
