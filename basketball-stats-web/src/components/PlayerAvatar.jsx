import { usePreferences } from "../preferences/context";
import { useState } from "react";
export default function PlayerAvatar({
  player,
  className = "h-10 w-10"
}) {
  const {
    t, playerName
  } = usePreferences();
  const name = playerName(player.name ?? player.player_name ?? "Player");
  const candidate = player.photo_url ?? player.photoUrl ?? player.image_url;
  const src = typeof candidate === "string" && /^(https?:\/\/|\/[^/])/.test(candidate) ? candidate : null;
  const [failed, setFailed] = useState(null);
  return <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-raised ${className}`}>
    {src && failed !== src ? <img src={src} alt={`${name} ${t("portrait")}`} className="h-full w-full object-cover" onError={() => setFailed(src)} /> : <svg viewBox="0 0 40 40" className="h-full w-full text-muted" role="img" aria-label={`${name} ${t("portrait unavailable")}`} fill="currentColor">
        <circle cx="20" cy="14" r="7" /><path d="M6 40v-6a14 14 0 0 1 28 0v6Z" />
      </svg>}
  </span>;
}
