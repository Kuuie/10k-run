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
            primary: "#6366F1",
            primaryHover: "#818CF8",
            success: "#10B981",
            warning: "#F59E0B",
            error: "#EF4444",
            progress: "#7C3AED",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
