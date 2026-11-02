import { usePreferences } from "../preferences/context";
import { NavLink } from "react-router-dom";
const items = [{
  to: "/",
  label: "Home",
  icon: "home"
}, {
  to: "/season",
  label: "Season",
  icon: "stats"
}, {
  to: "/games",
  label: "Games",
  icon: "games"
}, {
  to: "/players",
  label: "Players",
  icon: "players"
}];
export default function BottomNav() {
  const {
    t
  } = usePreferences();
  return <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-5xl grid-cols-4 px-2 py-2">
        {items.map(item => <NavLink key={item.to} to={item.to} className={({
        isActive
      }) => `flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-all ${isActive ? "text-accent" : "text-muted"}`}>

            <span className="text-lg">
              <NavIcon name={item.icon} />
            </span>

            <span className="text-[11px] font-semibold">
              {t(item.label)}
            </span>
          </NavLink>)}
      </div>
    </nav>;
}
function NavIcon({
  name
}) {
  const paths = {
    home: "M3 10.5 12 3l9 7.5M5 9v12h5v-7h4v7h5V9",
    stats: "M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7",
    games: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    players: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2"
  };
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>;
}
