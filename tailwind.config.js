/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f3f7f2",
          100: "#e2ecdf",
          500: "#587e51",
          600: "#446339",
          700: "#36502d",
          800: "#2b4023",
          900: "#1f2f1a",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
