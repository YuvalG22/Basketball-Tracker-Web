import { usePreferences } from "../preferences/context";
import { useState } from "react";
import { findTeam } from "../utils/teamLogos";
export default function TeamLogo({
  name,
  className = "h-12 w-12"
}) {
  const {
    t
  } = usePreferences();
  const team = findTeam(name);
  const src = team ? team.imageUrl ?? `/teams/${team.file}` : null;
  const [failed, setFailed] = useState(null);
  return <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line p-1.5 ${team?.dark ? "bg-[#142442]" : "bg-white"} ${className}`}>
    {src && failed !== src ? <img src={src} alt={`${name} ${t("logo")}`} className="h-full w-full object-contain" onError={() => setFailed(src)} /> : <svg viewBox="0 0 24 24" className="h-3/4 w-3/4 text-muted" role="img" aria-label={`${name} ${t("team emblem unavailable")}`} fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="m3 8 9-5 9 5-9 5-9-5Zm3 3v7h12v-7M8 14v4m4-4v4m4-4v4M3 21h18" />
      </svg>}
  </span>;
}
