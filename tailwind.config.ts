import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        forest: {
          50: "#effaf4",
          100: "#d8f3e3",
          200: "#b4e5cb",
          300: "#82d0ad",
          400: "#4fb48a",
          500: "#2d9870",
          600: "#1f7a5a",
          700: "#1a624a",
          800: "#174e3c",
          900: "#134033",
          950: "#0a241d",
        },
        terracotta: {
          50: "#fdf5f1",
          100: "#fae7dd",
          200: "#f4ccb9",
          300: "#ecaa8c",
          400: "#e2805c",
          500: "#d9633d",
          600: "#b8442a", // darkened for 4.5:1 text contrast on cream/white
          700: "#a63c29",
          800: "#853327",
          900: "#6c2d23",
        },
        gold: {
          100: "#fdf3d7",
          300: "#f6d488",
          400: "#f2c14e",
          500: "#e3a92b",
          600: "#85560b", // darkened for 4.5:1 text contrast on gold-100
        },
        // Slightly darker than the default stone-500 so small grey text passes WCAG AA on cream/sand.
        stone: { 500: "#6b655f" },
        cream: "#faf7f2",
        sand: "#f3ede3",
        ink: "#1c1917",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(28,25,23,0.04), 0 8px 24px -8px rgba(28,25,23,0.10)",
        lift: "0 2px 4px rgba(28,25,23,0.05), 0 18px 40px -12px rgba(28,25,23,0.22)",
      },
      keyframes: {
        "slide-in-right": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        "slide-up": { from: { transform: "translateY(16px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.25s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
