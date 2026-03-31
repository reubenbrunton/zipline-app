import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0F0F19",
          black: "#000000",
          red: "#FF4533",
          white: "#FFFFFF",
        },
        surface: {
          1: "#12121E",
          2: "#1A1A2E",
          3: "#22223A",
        },
        muted: {
          DEFAULT: "#8888AA",
          foreground: "#666688",
        },
        border: "rgba(255,255,255,0.07)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-cal-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [],
};
export default config;
