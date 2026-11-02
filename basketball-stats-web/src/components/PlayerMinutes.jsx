import { usePreferences } from "../preferences/context";
import { useMinutes } from "../timing/context";
import { formatMinutes } from "../utils/playingTime";
export default function PlayerMinutes({ playerId, gameId }) {
  const { t } = usePreferences();
  const timing = useMinutes();
  const seconds = gameId == null ? timing.averages[String(playerId)] : timing.games[String(gameId)]?.seconds[String(playerId)];
  return <span className="text-xs text-muted">{t(gameId == null ? "Minutes per game" : "MIN")} <bdi dir="ltr">{formatMinutes(seconds)}</bdi></span>;
}
