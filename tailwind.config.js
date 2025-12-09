/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm coral palette - SLC design
        coral: {
          50: "#FFF5F3",
          100: "#FFE8E4",
          200: "#FFD5CC",
          300: "#FFB5A8",
          400: "#FF8A75",
          500: "#FF6B52",
          600: "#F04E35",
          700: "#CC3D28",
          800: "#A83524",
          900: "#8B3024",
        },
        // Warm neutral background
        warm: {
          50: "#FDFBF9",
          100: "#FAF7F5",
          200: "#F5F0EB",
          800: "#2D2926",
          900: "#1C1917",
        },
        darkTheme: {
          background: "#0D0F12",
          card: "#15181E",
          elevated: "#1C1F26",
          border: "#2A2F38",
          text: {
            primary: "#F4F6FC",
            secondary: "#A1A7B3",
          },
          accent: {
            primary: "#FF6B52",
            primaryHover: "#FF8A75",
            success: "#10B981",
            warning: "#F59E0B",
            error: "#EF4444",
            progress: "#FF6B52",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
