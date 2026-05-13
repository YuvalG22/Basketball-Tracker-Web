import { NavLink } from "react-router-dom";

const items = [
  { to: "/season", label: "עונה" },
  { to: "/games", label: "משחקים" },
  { to: "/players", label: "שחקנים" },
  { to: "/live", label: "Live" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `py-3 text-center text-sm font-medium ${
                isActive ? "text-orange-400" : "text-slate-400"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}