import { usePreferences } from "../preferences/context";
import { gameClockLabel } from "../utils/gameStats";
export default function MomentumTooltip({
  active,
  payload,
  opponentName,
  regulationPeriods = 4
}) {
  const {
    t,
    teamName
  } = usePreferences();
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return <div className="rounded-lg border border-line bg-surface p-2 text-xs">
    <p>{t(gameClockLabel(point.period, point.clockSecRemaining, regulationPeriods))}</p>
    <p dir="ltr">{teamName("Afeka")}{" "}{point.teamScore} - {point.opponentScore} {teamName(opponentName)}</p>
    <p>{t("Lead:")}{" "}{Math.abs(point.scoreDiff)} {point.scoreDiff > 0 ? t("Afeka") : point.scoreDiff < 0 ? teamName(opponentName) : t("(tied)")}</p>
  </div>;
}
