import { AFEKA_NAME_EN, AFEKA_NAME_HE } from "../utils/teamNames";
import { useEffect, useState } from "react";
import { PreferencesContext } from "./context";
function read(key, allowed, fallback) {
  try {
    const value = localStorage.getItem(key);
    return allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}
export default function PreferencesProvider({
  children
}) {
  const [language, setLanguage] = useState(() => read("basketball-language", ["he", "en"], "he"));
  const [theme, setTheme] = useState(() => read("basketball-theme", ["light", "dark", "system"], "light"));
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "he" ? "rtl" : "ltr";
    document.title = language === "he" ? `${AFEKA_NAME_HE} כדורסל` : `${AFEKA_NAME_EN} Basketball`;
    try {
      localStorage.setItem("basketball-language", language);
    } catch {/* Storage is optional. */}
  }, [language]);
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme = theme === "system" ? media?.matches ? "dark" : "light" : theme;
    };
    apply();
    media?.addEventListener("change", apply);
    try {
      localStorage.setItem("basketball-theme", theme);
    } catch {/* Storage is optional. */}
    return () => media?.removeEventListener("change", apply);
  }, [theme]);
  return <PreferencesContext.Provider value={{
    language,
    setLanguage,
    theme,
    setTheme
  }}>{children}</PreferencesContext.Provider>;
}
