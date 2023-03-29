/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#FFEEE6",
          100: "#FFDDCC",
          200: "#FEBB9A",
          300: "#FE9967",
          400: "#FD7835",
          500: "#FD5905",
          600: "#CA4502",
          700: "#983301",
          800: "#652201",
          900: "#331100",
        },
      },
    },
    plugins: [],
  }
}