import type { Config } from 'tailwindcss';
// Imported rather than require()d: the `import type` above and the
// `export default` below make this an ES module once Node strips the
// types off it, and `require` does not exist in that scope — even though
// Tailwind's load-config.js reaches this file through require().
import tailwindcssAnimate from 'tailwindcss-animate';

/**
 * Tailwind exists in this app for the product only.
 *
 * The marketing site (src/app/(marketing), src/components/marketing,
 * src/components/blog) is hand-written CSS and inline style objects, and none
 * of it is scanned below. That is deliberate on two counts: nothing there needs
 * a utility class, and — more importantly — Tailwind's preflight would rewrite
 * the marketing reset out from under it. Preflight ships only in
 * app/(product)/product.css, which only the product route group loads.
 */
export default {
  darkMode: ['class'],
  /**
   * One glob, pointing at the SPA.
   *
   * Widening this to `./src/**` would cost nothing at runtime (Tailwind only
   * emits classes it finds) but it would quietly invite utility classes into
   * the marketing components, where they would render unstyled — the utilities
   * are only in the stylesheet the product routes load.
   */
  content: ['./src/product/**/*.{ts,tsx}', './src/app/(product)/**/*.{js,jsx,ts,tsx}'],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      /**
       * The marketing site's two faces, so the product and the site read as one
       * company. Declared on <html> by the ROOT layout via next/font, which is
       * what makes them reachable from here.
       */
      fontFamily: {
        /* Fallbacks inside var(), for the reason documented on .vf-auth-display
           in product.css: a bare `var(--x)` that resolves to nothing invalidates
           the whole font-family declaration, and the names listed after it are
           never reached. */
        sans: ["var(--font-body, 'Hanken Grotesk')", 'Segoe UI', 'sans-serif'],
        display: ["var(--font-display, 'Plus Jakarta Sans')", 'Segoe UI', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
