/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bone: {
          50: "#f6f2e8",
          100: "#ece7dc",
          200: "#dfd8c8",
          300: "#c9c0ac",
        },
        ink: {
          400: "#5a5348",
          500: "#3a352d",
          700: "#26221c",
          900: "#1a1815",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
        serif: ['"Instrument Serif"', "Georgia", "Cambria", "serif"],
        display: ['"Anton"', "Impact", "sans-serif"],
      },
      letterSpacing: {
        widest: "0.16em",
      },
    },
  },
  plugins: [],
};
