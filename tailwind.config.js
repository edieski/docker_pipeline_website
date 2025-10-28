/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'devops-blue': '#1e40af',
        'devops-green': '#059669',
        'devops-red': '#dc2626',
        'devops-yellow': '#d97706',
        'devops-purple': '#7c3aed',
        'devops-gray': '#374151',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      }
    },
  },
  plugins: [],
}
