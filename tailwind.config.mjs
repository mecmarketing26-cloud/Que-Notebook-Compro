/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Bento palette ──
        navy:      '#16224C', // primario: fondos oscuros, marca, botón secundario
        amber:     '#FFC233', // acento/CTA principal — solo CTA y datos destacados
        'amber-hover': '#FFCE57',
        blue:      '#2563EB', // acción ML, links, íconos de uso
        'blue-hover':  '#1D4FD0',
        'blue-page':   '#1E50C7', // fondo de la página legal
        green:     '#12A150', // positivo
        'green-text':  '#0E7A45',
        'green-soft':  '#E4F6EC',
        paper:     '#EFEDE7', // fondo app
        'paper-deep':  '#DAD6CD', // canvas / fondo profundo
        card:      '#FFFFFF',
        'card-border': '#ECE8DF',
        tile:      '#F6F5F0',
        'text-primary':   '#1E1B16',
        'text-navy':      '#16224C',
        'text-secondary': '#5D5A51',
        'text-soft':      '#75716A',
        'text-muted':     '#9B9788',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        sans:    ['"Hanken Grotesk"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 18px 50px rgba(0,0,0,0.16)',
        lift: '0 12px 28px rgba(30,27,22,0.14)',
        cta:  '0 6px 20px rgba(255,194,51,0.38)',
      },
      borderRadius: {
        sm:   '10px',
        md:   '13px',
        lg:   '18px',
        xl:   '20px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
};
