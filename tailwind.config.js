/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
      },
      scale: {
        102: '1.02',
      },
      zIndex: {
        15: '15',
      },
      borderRadius: {
        xs: '0.125rem',
      },
    },
  },
  plugins: [],
  safelist: [
    'from-rose-600',
    'via-purple-600',
    'to-indigo-600',
    'from-pink-500',
    'via-rose-500',
    'to-amber-500',
    'from-cyan-400',
    'via-blue-500',
    'to-purple-600',
    'from-amber-400',
    'via-orange-500',
    'to-red-500',
    'from-emerald-400',
    'via-teal-500',
    'to-indigo-500',
    'from-red-600',
    'to-amber-600'
  ]
}
