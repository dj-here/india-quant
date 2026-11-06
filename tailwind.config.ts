import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          dark: "#070814",
          surface: "#0f1124",
          card: "#161933",
          border: "#262b54",
          cyan: "#00f0ff",
          magenta: "#ff0077",
          amber: "#ffb703",
          purple: "#9d4edd",
          emerald: "#06d6a0",
        },
      },
      fontFamily: {
        orbitron: ["var(--font-orbitron)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 15px rgba(0,240,255,0.8))" },
          "50%": { opacity: "0.7", filter: "drop-shadow(0 0 5px rgba(0,240,255,0.4))" },
        },
      },
      animation: {
        "pulse-glow": "pulseGlow 2s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
