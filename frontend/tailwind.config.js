/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        rebuild: {
          navy: "#0f3d5e",
          teal: "#1d7a7a",
          sand: "#f4efe6",
        },
      },
    },
  },
  plugins: [],
};
