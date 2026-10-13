import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

// Safety Buddy brand: logo yellow + dark navy-charcoal.
// `blue` and `indigo` are remapped to the brand yellow so every existing
// page that uses bg-blue-* / text-blue-* / ring-blue-* picks up the theme.
// (Text contrast fixes for these live in resources/css/app.css.)
const brandYellow = {
  50: '#FFFBEB',
  100: '#FEF6C3',
  200: '#FDEC8A',
  300: '#FCE14D',
  400: '#FBD926',
  500: '#F7D31A', // logo yellow
  600: '#EAB308',
  700: '#CA8A04',
  800: '#A16207',
  900: '#713F12',
  950: '#422006',
};

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', 'Helvetica', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                brand: brandYellow,
                blue: brandYellow,
                indigo: brandYellow,
                ink: {
                    50: '#F4F6F8',
                    100: '#E4E8ED',
                    300: '#8B96A5',
                    400: '#6B7787',
                    500: '#4A5565',
                    600: '#2E3744',
                    700: '#222A36',
                    800: '#1A212B',
                    900: '#12171E',
                    950: '#0B0F14',
                },
            },
            screens: {
                xs: '480px',
            },
        },
    },

    plugins: [forms, require('tailwind-scrollbar')],
};
