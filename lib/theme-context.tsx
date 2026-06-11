"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark"); // default to dark

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    // const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    // const initialTheme: Theme = stored || (mediaQuery.matches ? "dark" : "light");
    const initialTheme: Theme = stored || "dark";
    setThemeState(initialTheme);
    applyTheme(initialTheme);

    // const handleSystemChange = (e: MediaQueryListEvent) => {
    //   if (!localStorage.getItem("theme")) {
    //     const nextTheme: Theme = e.matches ? "dark" : "light";
    //     setThemeState(nextTheme);
    //     applyTheme(nextTheme);
    //   }
    // };

    // mediaQuery.addEventListener("change", handleSystemChange);
    // return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  const applyTheme = (t: Theme) => {
    const root = window.document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  };

  const setTheme = (t: Theme) => {
    localStorage.setItem("theme", t);
    setThemeState(t);
    applyTheme(t);
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
