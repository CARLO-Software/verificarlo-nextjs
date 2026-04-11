import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Premium color palette
        'bright-sun': {
          50: '#fefbe8',
          100: '#fff5a6',
          200: '#ffe989',
          300: '#ffe14c',
          400: '#fdbf12',
          500: '#eca506',
          600: '#cc7e02',
          700: '#a35805',
          800: '#86450d',
          900: '#723911',
          950: '#431c05',
          DEFAULT: '#fdbf12',
        },
        'carbon': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#0a0a0a',
        },
      },
      boxShadow: {
        'premium': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        'premium-lg': '0 35px 60px -12px rgba(0, 0, 0, 0.2)',
        'glow-gold': '0 0 30px rgba(253, 191, 18, 0.3)',
        'glow-gold-sm': '0 0 15px rgba(253, 191, 18, 0.2)',
        'card-hover': '0 20px 40px -15px rgba(0, 0, 0, 0.15), 0 0 20px rgba(253, 191, 18, 0.1)',
      },
      animation: {
        'card-lift': 'cardLift 0.3s ease-out forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
        'speedometer': 'speedometer 1s ease-out forwards',
        'engine-rev': 'engineRev 0.5s ease-in-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        cardLift: {
          '0%': { transform: 'translateY(0) scale(1)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
          '100%': { transform: 'translateY(-8px) scale(1.02)', boxShadow: '0 25px 50px -12px rgba(253, 191, 18, 0.25)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(253, 191, 18, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(253, 191, 18, 0.4)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        speedometer: {
          '0%': { transform: 'rotate(-90deg)' },
          '100%': { transform: 'rotate(var(--speedometer-angle, 0deg))' },
        },
        engineRev: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.05)' },
          '50%': { transform: 'scale(0.98)' },
          '75%': { transform: 'scale(1.02)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #fdbf12 0%, #eca506 50%, #cc7e02 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #0a0a0a 100%)',
        'gradient-gold-dark': 'linear-gradient(135deg, rgba(253, 191, 18, 0.1) 0%, transparent 50%)',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
