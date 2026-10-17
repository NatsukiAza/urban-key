/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const rotateX = plugin(function ({ addUtilities }) {
    addUtilities({
        '.rotate-y-180': {
            transform: 'rotateY(180deg)',
        },
    });
});
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './views/**/*.{js,ts,jsx,tsx,mdx}',
        './lib/**/*.{js,ts,jsx,tsx}',
    ],
    darkMode: 'class',
    theme: {
        container: {
            center: true,
        },
        extend: {
            colors: {
                uk: {
                    page: '#F7F5F9',
                    'page-dark': '#0E1726',
                    card: '#FFFFFF',
                    'card-dark': '#161D31',
                    col: '#F0ECF3',
                    'col-dark': '#131B2D',
                    'card-raised-dark': '#1C2439',
                    line: '#E7E2EC',
                    'line-dark': '#2A3350',
                    field: '#DCD5E2',
                    'field-dark': '#2A3350',
                    ink: '#1B1424',
                    'ink-dark': '#EEF0F7',
                    muted: '#5C5F77',
                    'muted-dark': '#A3A8C3',
                    'link-dark': '#D7B8DE',
                    money: '#7A5A2E',
                    'money-dark': '#D8AC71',
                    won: '#047A3F',
                    'won-dark': '#34D27B',
                    lost: '#C42B35',
                    'lost-dark': '#FF8A92',
                    warn: '#8A4B00',
                    'warn-bg': '#FFF1DC',
                    'warn-dark': '#FFD08A',
                    sidebar: '#3A1A40',
                    'sidebar-dark': '#1A0F20',
                    'sidebar-text': '#E9DDEC',
                    'sidebar-sub': '#CDB8D3',
                },
                primary: {
                    DEFAULT: '#502558',
                    light: '#f6eef7',
                    'dark-light': 'rgba(80,37,88,.15)',
                },
                gold: {
                    DEFAULT: '#D8AC71',
                    dark: '#7a5a2e',
                    light: '#fbf6ee',
                },
                secondary: {
                    DEFAULT: '#805dca',
                    light: '#ebe4f7',
                    'dark-light': 'rgb(128 93 202 / 15%)',
                },
                success: {
                    DEFAULT: '#00ab55',
                    light: '#ddf5f0',
                    'dark-light': 'rgba(0,171,85,.15)',
                },
                danger: {
                    DEFAULT: '#e7515a',
                    light: '#fff5f5',
                    'dark-light': 'rgba(231,81,90,.15)',
                },
                warning: {
                    DEFAULT: '#e2a03f',
                    light: '#fff9ed',
                    'dark-light': 'rgba(226,160,63,.15)',
                },
                info: {
                    DEFAULT: '#2196f3',
                    light: '#e7f7ff',
                    'dark-light': 'rgba(33,150,243,.15)',
                },
                dark: {
                    DEFAULT: '#3b3f5c',
                    light: '#eaeaec',
                    'dark-light': 'rgba(59,63,92,.15)',
                },
                black: {
                    DEFAULT: '#0e1726',
                    light: '#e3e4eb',
                    'dark-light': 'rgba(14,23,38,.15)',
                },
                white: {
                    DEFAULT: '#ffffff',
                    light: '#e0e6ed',
                    dark: '#888ea8',
                },
            },
            fontFamily: {
                nunito: ['var(--font-nunito)', 'Nunito', 'sans-serif'],
            },
            spacing: {
                4.5: '18px',
            },
            boxShadow: {
                '3xl': '0 2px 2px rgb(224 230 237 / 46%), 1px 6px 7px rgb(224 230 237 / 46%)',
            },
            typography: ({ theme }) => ({
                DEFAULT: {
                    css: {
                        '--tw-prose-invert-headings': theme('colors.white.dark'),
                        '--tw-prose-invert-links': theme('colors.white.dark'),
                        h1: { fontSize: '40px', marginBottom: '0.5rem', marginTop: 0 },
                        h2: { fontSize: '32px', marginBottom: '0.5rem', marginTop: 0 },
                        h3: { fontSize: '28px', marginBottom: '0.5rem', marginTop: 0 },
                        h4: { fontSize: '24px', marginBottom: '0.5rem', marginTop: 0 },
                        h5: { fontSize: '20px', marginBottom: '0.5rem', marginTop: 0 },
                        h6: { fontSize: '16px', marginBottom: '0.5rem', marginTop: 0 },
                        p: { marginBottom: '0.5rem' },
                        li: { margin: 0 },
                        img: { margin: 0 },
                    },
                },
            }),
        },
    },
    plugins: [
        require('@tailwindcss/forms')({
            strategy: 'class',
        }),
        require('@tailwindcss/typography'),
        rotateX,
    ],
};
