/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#181B20',
        panel: '#20242C',
        panel2: '#272C36',
        line: '#343A46',
        accent: '#3D7BFF',
        accentDim: '#2C5BD9',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
