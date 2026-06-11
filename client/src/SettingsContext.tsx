import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type SettingsContextType = {
  theme: "light" | "dark";
  toggleTheme: () => void;
};

const SettingsContext = createContext<SettingsContextType>({
  theme: "light",
  toggleTheme: () => {},
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark-mode", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
    }),
    [theme],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => useContext(SettingsContext);
