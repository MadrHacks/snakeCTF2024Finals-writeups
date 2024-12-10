/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#EE2625",
        secondary: "#F15151"
      }
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
}