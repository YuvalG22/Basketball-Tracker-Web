import { usePreferences } from "../preferences/context";
import { Outlet } from "react-router-dom";
import BottomNav from "../navigation/BottomNav";
export default function MainLayout() {
  const { t } = usePreferences();
  return <div className="min-h-screen bg-background text-ink">
      <main className="mx-auto max-w-7xl min-w-0 px-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <p className="text-xs font-bold tracking-[0.15em] text-accent">{t("Afeka College Basketball")}</p>
        </header>
        <Outlet />
      </main>

      <BottomNav />
    </div>;
}
