export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // dark: solo se activa con la clase .dark, nunca por prefers-color-scheme del SO.
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Montserrat', 'sans-serif'],
        display: ['Montserrat', 'Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        // Paleta oficial LLA
        lla: {
          primary: '#371859',
          'primary-dark': '#230552',
          'primary-hover': '#2f0163',
          celeste: '#39b5e6',
          violeta: '#6c4c99',
          magenta: '#b23c8e',
          bordeaux: '#ad3559',
          naranja: '#e2602f',
          dorado: '#efb041',
        },
        // Escala "primary" para utilidades tipo bg-primary-500
        primary: {
          50: '#ede6f0',
          100: '#d9c9e0',
          300: '#6c4c99',
          400: '#4f2a7a',
          500: '#371859',
          600: '#2f0163',
          700: '#230552',
          DEFAULT: '#371859',
        },
      },
    },
  },
  plugins: [],
}
