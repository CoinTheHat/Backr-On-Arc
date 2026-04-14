/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#6366f1", // Indigo 500
                "primary-light": "#e0e7ff",
                "primary-dark": "#4f46e5",
                "secondary": "#3b82f6", // Blue 500
                "accent": "#14b8a6", // Teal 500
                "mist": "#F8F9FC",
                "fuchsia-accent": "#e879f9",
                "brand-dark": "#0D0B1D",
                "brand-primary": "#6366f1", // Match primary
                "brand-secondary": "#14b8a6", // Match accent
                "brand-accent": "#e0e7ff",
                "brand-light": "#F2F2FA",
            },
            fontFamily: {
                "sans": ["var(--font-inter)", "sans-serif"],
                "serif": ["var(--font-playfair)", "serif"],
                "display": ["var(--font-playfair)", "serif"],
            },
            borderRadius: {
                "2xl": "1rem",
                "3xl": "1.5rem",
                "4xl": "2rem",
            },
            boxShadow: {
                "glow": "0 0 20px rgba(140, 43, 238, 0.3)",
                "glass": "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
            },
            animation: {
                "float": "float 6s ease-in-out infinite",
                "fade-in-up": "fadeInUp 0.8s ease-out forwards",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-20px)" },
                },
                fadeInUp: {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                }
            }
        },
    },
    plugins: [],
};
