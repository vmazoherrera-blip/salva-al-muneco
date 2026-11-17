"use client";

import React, { useState, useEffect } from "react";
import { useTheme, ThemePreference } from "./ThemeProvider";
import { Sun, Moon, Laptop } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  showLabels = false,
}) => {
  const { theme, effectiveTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`flex items-center p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 ${className}`}>
        <div className="w-7 h-7" />
        <div className="w-7 h-7" />
        <div className="w-7 h-7" />
      </div>
    );
  }

  const options: { id: ThemePreference; label: string; icon: React.ReactNode }[] = [
    {
      id: "light",
      label: "Claro",
      icon: <Sun className="w-3.5 h-3.5 text-amber-500" />,
    },
    {
      id: "system",
      label: "Auto",
      icon: <Laptop className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />,
    },
    {
      id: "dark",
      label: "Oscuro",
      icon: <Moon className="w-3.5 h-3.5 text-indigo-400" />,
    },
  ];

  return (
    <div
      role="group"
      aria-label="Selector de Tema"
      className={`inline-flex items-center p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-950/90 border border-slate-300/80 dark:border-slate-800 shadow-sm backdrop-blur-md transition-colors ${className}`}
    >
      {options.map((opt) => {
        const isActive = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            title={`Tema ${opt.label} (${opt.id === "system" ? "Sigue las preferencias de tu sistema operativo" : opt.label})`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              isActive
                ? "bg-white text-slate-900 shadow-xs border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {opt.icon}
            {showLabels && <span>{opt.label}</span>}
          </button>
        );
      })}
    </div>
  );
};
