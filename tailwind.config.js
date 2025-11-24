/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6", // blue-500
        "background-light": "#f8fafc", // slate-50
        "background-dark": "#0f172a", // slate-900
        border: "#d1d5db",
        surface: "#ffffff",
        // Add other colors as needed
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        sans: ["Poppins", "sans-serif"], // default
      },
      borderRadius: {
        DEFAULT: "0.5rem", // 8px
      },
    },
  },
  plugins: [],
};
