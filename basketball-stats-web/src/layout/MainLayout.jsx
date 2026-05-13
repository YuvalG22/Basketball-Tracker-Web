import { Outlet } from "react-router-dom";
import BottomNav from "../navigation/BottomNav";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-4">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}