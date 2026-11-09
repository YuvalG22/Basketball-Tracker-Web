import { usePreferences } from "../preferences/context";
import { STATS_SEASONS } from "../utils/statsSeason";
export default function StatsSeasonSelector({ selection }) {
  const {t}=usePreferences();
  return <div className="space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-semibold text-accent">{t("Showing season")} {selection.season}</p>
      <label className="flex items-center gap-2 text-sm font-medium">{t("Season")}
        <select value={selection.season} onChange={event=>selection.select(event.target.value)} className="min-h-11 rounded-xl border border-line bg-surface px-3 py-2 text-ink">
          {STATS_SEASONS.map((season,index)=><option key={season} value={season}>{season} · {t(index === 0 ? "Current season" : "Last season")}</option>)}
        </select>
      </label>
    </div>
    {selection.fallback && <p role="status" className="rounded-xl bg-raised p-3 text-sm text-muted">{t("No stats available for 26/27. Showing 25/26.")}</p>}
  </div>;
}
