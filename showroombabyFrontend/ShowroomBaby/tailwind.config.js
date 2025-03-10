/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#FF7043',
        secondary: '#FFA726',
        background: '#F8F8F8',
        card: '#FFFFFF',
        text: '#333333',
        border: '#EEEEEE',
        notification: '#FF3B30',
        placeholder: '#999999',
        backdrop: 'rgba(0, 0, 0, 0.5)',
      },
      fontFamily: {
        sans: ['System'],
        bold: ['System-Bold'],
      },
    },
  },
  plugins: [],
}

