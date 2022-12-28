module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [
    require("@tailwindcss/typography")({
      className: 'wysiwyg',
    }),
  ],
}