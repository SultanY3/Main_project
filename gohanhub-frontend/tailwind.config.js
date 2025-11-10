/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'tw-',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  corePlugins: {
    preflight: false, // Don't override Bootstrap
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
