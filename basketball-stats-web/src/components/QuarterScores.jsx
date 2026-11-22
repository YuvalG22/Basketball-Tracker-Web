import { usePreferences } from "../preferences/context";

export default function QuarterScores({ periodScores, regulationPeriods, homeTeamName, awayTeamName }) {
  const { t, teamName } = usePreferences();
  return <div className="mt-3 overflow-x-auto rounded-2xl bg-background px-3 pb-2">
    <table dir="rtl" className="w-full table-fixed border-collapse text-center" style={{ minWidth: `${periodScores.length * 3}rem` }}>
      <caption className="sr-only">{t("Quarter scores")}</caption>
      <thead><tr className="border-b border-line">
        {periodScores.map(({ period }) => <th key={period} scope="col" className="px-1 py-2.5 text-sm font-semibold text-muted">{t(period <= regulationPeriods ? `Q${period}` : `OT${period - regulationPeriods}`)}</th>)}
      </tr></thead>
      <tbody>
        {[["home", homeTeamName], ["away", awayTeamName]].map(([side, name]) => <tr key={side} aria-label={teamName(name)}>
          {periodScores.map(period => <td key={period.period} dir="ltr" className={`px-1 py-1.5 text-lg tabular-nums ${period[side] > period[side === "home" ? "away" : "home"] ? "font-bold text-ink" : "font-medium text-muted"}`}>{period[side]}</td>)}
        </tr>)}
      </tbody>
    </table>
  </div>;
}
