import { Outlet } from "react-router-dom";
import BottomNav from "../navigation/BottomNav";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-background text-ink">
      <main className="mx-auto max-w-7xl px-5 pb-28 pt-6 sm:px-8">
        <header className="mb-6 border-b border-line pb-4">
          <p className="text-xs font-bold tracking-[0.15em] text-accent">AFEKA BASKETBALL</p>
        </header>
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
