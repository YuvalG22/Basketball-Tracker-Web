import { NavLink } from "react-router-dom";

const items = [
  {
    to: "/",
    label: "Home",
    icon: "🏠",
  },
  {
    to: "/season",
    label: "Season",
    icon: "🏀",
  },
  {
    to: "/games",
    label: "Games",
    icon: "📅",
  },
  {
    to: "/players",
    label: "Players",
    icon: "👤",
  },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#2D2A2A] bg-[#1A1818]/95 backdrop-blur-xl">
      <div className="mx-auto grid max-w-5xl grid-cols-4 px-2 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-all ${
                isActive
                  ? "bg-[#2D2A2A] text-[#2ECC71]"
                  : "text-[#FFFFFF80]"
              }`
            }
          >
            <span className="text-lg">
              {item.icon}
            </span>

            <span className="text-[11px] font-semibold">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}