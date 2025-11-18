import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    // Check localStorage for saved theme, default to 'light'
    const [theme, setTheme] = useState(localStorage.getItem("app-theme") || "light");

    useEffect(() => {
        // Apply the theme to the <body> tag
        document.body.setAttribute("data-theme", theme);
        // Save to local storage
        localStorage.setItem("app-theme", theme);
    }, [theme]);

    const toggleTheme = (newTheme) => {
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);