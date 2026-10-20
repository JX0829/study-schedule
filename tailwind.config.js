/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./parent/index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 科技极简现代色系 (Cyber/Tech Minimal Slate & Indigo/Cyan)
        slate: {
          850: '#151e2e',
          900: '#0f172a',
          950: '#020617',
        },
        tech: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Cyan/Teal
          600: '#0d9488',
          glow: '#38bdf8',
        },
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#38bdf8', // 科技亮蓝
          500: '#0284c7',
          600: '#0369a1',
        },
        parent: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#818cf8',
          500: '#6366f1', // 科技靛蓝
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          cyan: '#06b6d4',
          blue: '#3b82f6',
          emerald: '#10b981',
          rose: '#f43f5e',
          purple: '#8b5cf6',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'PingFang SC', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'tech': '0 4px 20px -2px rgba(14, 165, 233, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'tech-hover': '0 10px 25px -3px rgba(14, 165, 233, 0.16), 0 4px 10px -2px rgba(0, 0, 0, 0.05)',
        'neon': '0 0 15px rgba(56, 189, 248, 0.35)',
      }
    },
  },
  plugins: [],
}
