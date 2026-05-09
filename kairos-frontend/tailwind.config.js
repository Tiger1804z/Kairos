/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#06080D",
        surface: "#0E1117",
        card: "#161B22",
        muted: "#1C2028",
        accent: "#6366F1",
        "accent-hover": "#4F46E5",
        success: "#10B981",
        warning: "#F97316",
        danger: "#EF4444",
      },
    },
  },
  plugins: [],
};
