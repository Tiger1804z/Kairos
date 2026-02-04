/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#06080D",
        surface: "#0E1117",
        card: "#161B22",
        accent: "#3B82F6",
      },
    },
  },
  plugins: [],
};
