import type { Config } from "tailwindcss";

const config: Config = {
  
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        loop: {
          50: "#f5f3ff",
          100: "#291583",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#7c6ce7",
          600: "#6554c0",
          700: "#51419e",
          800: "#3d3277",
          900: "#18152d",
        },
      },
      boxShadow: {
        panel: "0 24px 70px -36px rgba(24, 21, 45, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;