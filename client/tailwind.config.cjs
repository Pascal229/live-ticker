/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#CC3333",
        secondary: "#000000"
      },
      fontFamily: {
        "sans-serif": "'Atkinson Hyperlegible', sans-serif"
      }
    },
    plugins: [],
  }
}