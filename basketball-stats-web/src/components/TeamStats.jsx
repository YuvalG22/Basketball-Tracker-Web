import { usePreferences } from "../preferences/context";
const totals = [["Rebounds", "rebounds"], ["Offensive Rebounds", "offensive_rebounds"], ["Defensive Rebounds", "defensive_rebounds"], ["Assists", "assists"], ["Steals", "steals"], ["Blocks", "blocks"], ["Turnovers", "turnovers"], ["Fouls", "fouls"]];
const shooting = [["Field goals", "fg"], ["2 pointers", "two"], ["3 pointers", "three"], ["Free throws", "ft"]];
export default function TeamStats({ stats, opponentName }) {
  const { t, teamName } = usePreferences();
  if (!stats) return <p className="p-4 text-muted">{t("Team statistics unavailable")}</p>;
  const rows = [...shooting, ...totals];
  const value = (team, key) => key.split(".").reduce((obj, part) => obj?.[part], stats[team]) ?? null;
  return <section className="team-stats rounded-2xl bg-surface p-4 sm:p-6">
    <h2 className="text-xl font-bold">{t("Team Stats")}</h2>
    <div className="mt-4 grid grid-cols-2 gap-4 text-sm font-bold"><span className="team-stats-afeka">{teamName("Afeka")}</span><span className="team-stats-opponent text-end">{teamName(opponentName)}</span></div>
    <div className="mt-3 divide-y divide-line">{rows.map(([label, key]) => {
      if (shooting.some(([, category]) => category === key)) return <div key={key} data-stat={key} className="grid grid-cols-3 items-center gap-2 py-5">
        <ShootingDonut shooting={stats.afeka?.[key]} team={teamName("Afeka")} label={t(label)} color="var(--momentum-team)" />
        <h3 className="text-center text-xs font-semibold text-muted sm:text-sm">{t(label)}</h3>
        <ShootingDonut shooting={stats.opponent?.[key]} team={teamName(opponentName)} label={t(label)} color="var(--momentum-opponent)" />
      </div>;
      const a = value("afeka", key), b = value("opponent", key);
      const max = Math.max(a ?? 0, b ?? 0, 1);
      const format = n => n == null ? "—" : n;
      return <div key={key} className="py-3" data-stat={key}>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-2 text-sm"><span dir="ltr" className="text-start tabular-nums" title={a == null ? t("Not recorded") : undefined}>{format(a)}</span><span className="text-center text-xs text-muted">{t(label)}</span><span dir="ltr" className="text-end tabular-nums" title={b == null ? t("Not recorded") : undefined}>{format(b)}</span></div>
        {a != null && b != null && <div className="mt-2 grid grid-cols-2 gap-2" aria-hidden="true"><div className="flex justify-end rounded-full bg-raised"><span className="team-stats-bar-afeka h-2.5 rounded-full" style={{ width: `${a / max * 100}%` }} /></div><div className="rounded-full bg-raised"><span className="team-stats-bar-opponent block h-2.5 rounded-full" style={{ width: `${b / max * 100}%` }} /></div></div>}
      </div>;
    })}</div>
  </section>;
}

function ShootingDonut({ shooting, team, label, color }) {
  const { t } = usePreferences();
  const made = shooting?.made ?? null;
  const attempts = shooting?.attempts ?? null;
  const percentage = attempts > 0 ? shooting?.percentage ?? null : null;
  const progress = percentage == null ? null : Math.max(0, Math.min(100, percentage));
  const percentageLabel = percentage == null ? "—" : `${Number(percentage.toFixed(1))}%`;
  return <div className="flex min-w-0 flex-col items-center gap-2">
    <div className="shooting-donut" role="img" aria-label={`${team} · ${label}: ${percentage == null ? t("Not recorded") : percentageLabel}`}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="27" fill="none" stroke="var(--color-raised)" strokeWidth="5" />
        {progress != null && <circle cx="32" cy="32" r="27" fill="none" stroke={color} strokeWidth="5" pathLength="100" strokeDasharray={`${progress} ${100 - progress}`} transform="rotate(-90 32 32)" />}
      </svg>
      <span className="shooting-donut-label tabular-nums" dir="ltr" aria-hidden="true">{percentageLabel}</span>
    </div>
    <span dir="ltr" className="text-sm font-bold tabular-nums sm:text-base" title={made == null || attempts == null ? t("Not recorded") : undefined}>{made ?? "—"}/{attempts ?? "—"}</span>
  </div>;
}
