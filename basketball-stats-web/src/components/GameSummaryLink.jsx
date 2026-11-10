import { Link } from "react-router-dom";
import { usePreferences } from "../preferences/context";
export function canOpenSummary(game) { return game?.status === "FINISHED" && game.has_events !== false; }
export default function GameSummaryLink({ game, children, className = "" }) {
  const { t } = usePreferences();
  return canOpenSummary(game)
    ? <Link to={`/games/${game.id}`} className={className}>{children}</Link>
    : <div className={className} aria-disabled="true">{children}<span className="block text-xs text-muted">{t("No stats available")}</span></div>;
}
