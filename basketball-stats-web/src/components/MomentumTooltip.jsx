import { gameClockLabel } from "../utils/gameStats";

export default function MomentumTooltip({ active, payload, opponentName, regulationPeriods = 4 }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return <div className="rounded-lg border border-line bg-surface p-2 text-xs">
    <p>{gameClockLabel(point.period, point.clockSecRemaining, regulationPeriods)}</p>
    <p>Afeka {point.teamScore} - {point.opponentScore} {opponentName}</p>
    <p>Lead: {Math.abs(point.scoreDiff)} {point.scoreDiff > 0 ? "Afeka" : point.scoreDiff < 0 ? opponentName : "(tied)"}</p>
  </div>;
}
