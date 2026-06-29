/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Status colors used consistently across badges + charts
        status: {
          pass: "#22c55e", // green
          fail: "#ef4444", // red
          flaky: "#eab308", // yellow
        },
      },
    },
  },
  plugins: [],
};
