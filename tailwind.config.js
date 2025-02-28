/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".custom-scrollbar::-webkit-scrollbar": {
          width: "2px",
          height: "2px",
        },
        ".custom-scrollbar": {
          userSelect: "none",
        },
        ".custom-scrollbar::-webkit-scrollbar-thumb": {
          backgroundColor: "#2D3748",
          borderRadius: "4px",
        },
      };
      addUtilities(newUtilities);
    },
    require("tailwind-scrollbar"),
  ],
};
