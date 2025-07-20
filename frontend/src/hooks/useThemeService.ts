import { useEffect } from "react";
import { useCookie } from "./useCookie";

type Theme = "auto" | "light" | "dark";

export default function useThemeService(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useCookie<Theme>("setting_theme", "auto", { days: 365 });

  // Function to update CSS variables to default light or dark mode
  const applyTheme = (themeToApply: Theme, systemPrefersDark: boolean) => {
    const root = document.documentElement;

    // Use data-theme attribute on <html> to control css variable scopes
    if (themeToApply === "auto") {
      if (systemPrefersDark) {
        root.setAttribute("data-theme", "dark");
      } else {
        root.setAttribute("data-theme", "light");
      }
    } else {
      root.setAttribute("data-theme", themeToApply);
    }
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const systemPrefersDark = mediaQuery.matches;

    applyTheme(theme, systemPrefersDark);

    const listener = (e: MediaQueryListEvent) => {
      if (theme === "auto") {
        applyTheme(theme, e.matches);
      }
    };

    mediaQuery.addEventListener("change", listener);

    return () => mediaQuery.removeEventListener("change", listener);
  }, [theme]);

  return [theme, setTheme];
}
