/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        souq: {
          green: "#0B4D36",
          deep: "#083A29",
          gold: "#C9A24B",
          goldlight: "#E8D7A9",
          sand: "#FAF7EF",
          ink: "#1B231E"
        }
      },
      fontFamily: { cairo: ["Cairo", "sans-serif"] }
    }
  },
  plugins: []
};
