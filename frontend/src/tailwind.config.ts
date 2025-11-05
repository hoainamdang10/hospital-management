import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
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
      animation: {
        'float-1': 'float-1 8s ease-in-out infinite',
        'float-2': 'float-2 12s ease-in-out infinite',
        'float-3': 'float-3 10s ease-in-out infinite',
        'drift-1': 'drift-1 15s ease-in-out infinite',
        'drift-2': 'drift-2 18s ease-in-out infinite',
        'drift-3': 'drift-3 14s ease-in-out infinite',
        'bounce-slow': 'bounce-slow 6s ease-in-out infinite',
        'water-float': 'water-float 16s ease-in-out infinite',
        'bubble-rise': 'bubble-rise 12s ease-in-out infinite',
        'gentle-sway': 'gentle-sway 8s ease-in-out infinite',
      },
      keyframes: {
        'float-1': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '25%': { transform: 'translateY(-20px) translateX(10px)' },
          '50%': { transform: 'translateY(-40px) translateX(-5px)' },
          '75%': { transform: 'translateY(-20px) translateX(-10px)' },
        },
        'float-2': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px) scale(1)' },
          '33%': { transform: 'translateY(-30px) translateX(15px) scale(1.1)' },
          '66%': { transform: 'translateY(-15px) translateX(-10px) scale(0.9)' },
        },
        'float-3': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px) rotate(0deg)' },
          '20%': { transform: 'translateY(-25px) translateX(8px) rotate(2deg)' },
          '40%': { transform: 'translateY(-45px) translateX(-12px) rotate(-1deg)' },
          '60%': { transform: 'translateY(-30px) translateX(5px) rotate(1deg)' },
          '80%': { transform: 'translateY(-10px) translateX(-8px) rotate(-1deg)' },
        },
        'drift-1': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)', opacity: '0.3' },
          '25%': { transform: 'translateY(-15px) translateX(20px)', opacity: '0.5' },
          '50%': { transform: 'translateY(-35px) translateX(10px)', opacity: '0.7' },
          '75%': { transform: 'translateY(-20px) translateX(-15px)', opacity: '0.4' },
        },
        'drift-2': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px) scale(1)', opacity: '0.2' },
          '30%': { transform: 'translateY(-40px) translateX(-10px) scale(1.2)', opacity: '0.6' },
          '70%': { transform: 'translateY(-20px) translateX(25px) scale(0.8)', opacity: '0.4' },
        },
        'drift-3': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px) rotate(0deg)', opacity: '0.25' },
          '40%': { transform: 'translateY(-30px) translateX(-20px) rotate(3deg)', opacity: '0.6' },
          '80%': { transform: 'translateY(-50px) translateX(15px) rotate(-2deg)', opacity: '0.3' },
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0px) scale(1)', opacity: '0.4' },
          '50%': { transform: 'translateY(-25px) scale(1.1)', opacity: '0.7' },
        },
        'water-float': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px) scale(1)', opacity: '0.3' },
          '25%': { transform: 'translateY(-30px) translateX(15px) scale(1.05)', opacity: '0.6' },
          '50%': { transform: 'translateY(-50px) translateX(-10px) scale(0.95)', opacity: '0.8' },
          '75%': { transform: 'translateY(-25px) translateX(-20px) scale(1.02)', opacity: '0.5' },
        },
        'bubble-rise': {
          '0%': { transform: 'translateY(0px) scale(0.8)', opacity: '0.2' },
          '25%': { transform: 'translateY(-20px) scale(1)', opacity: '0.5' },
          '50%': { transform: 'translateY(-45px) scale(1.1)', opacity: '0.7' },
          '75%': { transform: 'translateY(-30px) scale(0.9)', opacity: '0.4' },
          '100%': { transform: 'translateY(-60px) scale(0.7)', opacity: '0.1' },
        },
        'gentle-sway': {
          '0%, 100%': { transform: 'translateX(0px) rotate(0deg)', opacity: '0.4' },
          '33%': { transform: 'translateX(10px) rotate(1deg)', opacity: '0.6' },
          '66%': { transform: 'translateX(-8px) rotate(-1deg)', opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
};

export default config;