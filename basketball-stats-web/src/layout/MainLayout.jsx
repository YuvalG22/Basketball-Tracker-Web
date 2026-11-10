import { usePreferences } from "../preferences/context";
import { Outlet } from "react-router-dom";
import BottomNav from "../navigation/BottomNav";
export default function MainLayout() {
  const {
    t,
    language,
    setLanguage,
    theme,
    setTheme
  } = usePreferences();
  return <div className="min-h-screen bg-background text-ink">
      <main className="mx-auto max-w-7xl min-w-0 px-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <p className="text-xs font-bold tracking-[0.15em] text-accent">{t("Afeka College Basketball")}</p>
        <div className="flex flex-wrap items-center gap-2">
<select aria-label={t("Language")} value={language} onChange={event => setLanguage(event.target.value)} className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm"><option value="he">עברית</option><option value="en">English</option></select>
<select aria-label={t("Theme")} value={theme} onChange={event => setTheme(event.target.value)} className="min-h-11 rounded-xl border border-line bg-surface px-3 text-sm"><option value="light">{t("Light")}</option><option value="dark">{t("Dark")}</option><option value="system">{t("System")}</option></select>
</div></header>
        <Outlet />
      </main>

      <BottomNav />
    </div>;
}
