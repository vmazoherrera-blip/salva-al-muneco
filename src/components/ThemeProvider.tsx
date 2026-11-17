"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemePreference = "system" | "dark" | "light";

interface ThemeContextType {
  theme: ThemePreference;
  effectiveTheme: "dark" | "light";
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  effectiveTheme: "dark",
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [effectiveTheme, setEffectiveTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("doll_theme") as ThemePreference | null;
      if (stored === "dark" || stored === "light" || stored === "system") {
        setThemeState(stored);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateTheme = (pref: ThemePreference) => {
      let resolved: "dark" | "light" = "dark";
      if (pref === "system") {
        resolved = mediaQuery.matches ? "dark" : "light";
      } else {
        resolved = pref;
      }

      setEffectiveTheme(resolved);

      if (resolved === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
        root.setAttribute("data-theme", "dark");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
      }
    };

    updateTheme(theme);

    const onSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        updateTheme("system");
      }
    };

    mediaQuery.addEventListener("change", onSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", onSystemThemeChange);
  }, [theme]);

  const setTheme = (newTheme: ThemePreference) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("doll_theme", newTheme);
    } catch {}
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
