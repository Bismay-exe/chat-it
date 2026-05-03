/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        "sf-pro": ["SF-Pro-Regular"],
        "sf-pro-medium": ["SF-Pro-Medium"],
        "sf-pro-semibold": ["SF-Pro-SemiBold"],
        "sf-pro-bold": ["SF-Pro-Bold"],
      },
      colors: {
        background: "#0A0A0A",
        foreground: "#F5F5F5",
        surface: "#121212",
        "surface-secondary": "#1E1E1E",
        primary: "#3B82F6",
        "primary-soft": "rgba(59, 130, 246, 0.2)",
        "text-primary": "#FFFFFF",
        "text-secondary": "#A1A1AA",
        "text-muted": "#52525B",
        border: "#27272A",
        error: "#EF4444",
        success: "#22C55E",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};
