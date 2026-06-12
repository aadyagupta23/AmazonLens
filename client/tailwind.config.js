/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        amazon: {
          dark: "#131921",
          nav: "#232F3E",
          orange: "#FF9900",
          "orange-light": "#F3A847",
          yellow: "#FFD814",
          "yellow-hover": "#F7CA00",
          teal: "#007185",
          "teal-dark": "#C7511F",
          green: "#067D62",
          red: "#CC0C39",
          "light-bg": "#EAEDED",
          border: "#DDD",
          text: "#0F1111",
          "text-secondary": "#565959",
          link: "#007185",
          prime: "#00A8E1",
          "badge-green": "#067D62",
          "badge-orange": "#FF9900",
          "badge-red": "#CC0C39"
        }
      },
      fontFamily: {
        amazon: ['"Amazon Ember"', '"Helvetica Neue"', "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};
