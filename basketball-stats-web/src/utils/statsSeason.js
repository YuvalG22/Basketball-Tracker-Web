export const STATS_SEASONS = ["26/27", "25/26"];
export const hasSeasonStats = rows => (rows ?? []).some(player => Number(player.gp) > 0);
export function resolveStatsSeason(requested, current, previous) {
  if (STATS_SEASONS.includes(requested)) return {season:requested, query:requested === STATS_SEASONS[0] ? current : previous, fallback:false};
  if (!current.isSuccess || hasSeasonStats(current.data)) return {season:STATS_SEASONS[0],query:current,fallback:false};
  if (!previous.isSuccess) return {season:STATS_SEASONS[1],query:previous,fallback:false};
  const fallback = hasSeasonStats(previous.data);
  return {season:fallback ? STATS_SEASONS[1] : STATS_SEASONS[0],query:fallback ? previous : current,fallback};
}
