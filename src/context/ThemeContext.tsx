import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = "context-relay-theme";

function getInitialTheme(): Theme {
  // Check for stored preference in chrome.storage
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // ignore
  }
  return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [ready, setReady] = useState(false);

  // On mount, try to read from chrome.storage (extension context)
  useEffect(() => {
    async function load() {
      try {
        if (typeof chrome !== "undefined" && chrome.storage?.local) {
          const result = await new Promise<{ [THEME_KEY]?: string }>((resolve) => {
            chrome.storage.local.get(THEME_KEY, resolve);
          });
          if (result[THEME_KEY] === "dark" || result[THEME_KEY] === "light") {
            setTheme(result[THEME_KEY] as Theme);
          }
        }
      } catch {
        // chrome.storage not available
      }
      setReady(true);
    }
    load();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    // Persist to both localStorage and chrome.storage
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
    try {
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.set({ [THEME_KEY]: theme });
      }
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}