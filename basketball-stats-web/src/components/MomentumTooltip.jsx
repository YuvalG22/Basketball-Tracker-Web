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
    language,
    teamName
  } = usePreferences();
  const sample = payload?.[0]?.payload;
  const point = sample?.recordedPoint ?? sample;
  if (!active || !point) return null;
  return <div dir={language === "he" ? "rtl" : "ltr"} className="momentum-tooltip rounded-xl border border-line bg-surface p-3 text-xs shadow-xl">
    <p>{t(gameClockLabel(point.period, point.clockSecRemaining, regulationPeriods))}</p>
    <p dir="ltr">{teamName("Afeka")}{" "}{point.teamScore} - {point.opponentScore} {teamName(opponentName)}</p>
    <p>{t("Lead:")}{" "}{Math.abs(point.scoreDiff)} {point.scoreDiff > 0 ? teamName("Afeka") : point.scoreDiff < 0 ? teamName(opponentName) : t("(tied)")}</p>
  </div>;
}
