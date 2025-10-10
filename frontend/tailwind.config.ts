import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./modules/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0E9F6E",
          contrast: "#FFFFFF",
        },
        link: "#1E4DD8",
        neutral: {
          900: "#0E1217",
          800: "#1F2937",
          700: "#374151",
          600: "#4B5563",
          500: "#6B7280",
          400: "#9CA3AF",
          300: "#D1D5DB",
          200: "#E5E7EB",
          100: "#F3F4F6",
          50: "#F7FAFC",
        },
        accent: {
          cyan: "#06B6D4",
          amber: "#F59E0B",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#F43F5E",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["ui-monospace", "monospace"],
      },
      spacing: {
        6: "6px",
        12: "12px",
        18: "18px",
        24: "24px",
        36: "36px",
      },
      maxWidth: {
        content: "1200px",
      },
      borderRadius: {
        card: "16px",
        pill: "999px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,0.06)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "180ms",
        slow: "260ms",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(.2,.8,.2,1)",
      },
      gridTemplateColumns: {
        "12": "repeat(12, minmax(0, 1fr))",
      },
      gap: {
        gutter: "24px",
      },
    },
  },
  plugins: [],
};

export default config;
