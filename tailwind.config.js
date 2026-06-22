/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#22B14C',
        'primary-dark': '#1a8e3c',
      },
    },
  },
  plugins: [],
}
