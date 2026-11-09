export const CURRENT_SEASON = "26/27";
export const gameSeason = game => game.season?.trim() || "25/26";
export function availableSeasons(games) {
  return [...new Set([CURRENT_SEASON, ...games.filter(g => !g.is_deleted).map(gameSeason)])].sort().reverse();
}
export function seasonGames(games, season) {
  return games.filter(g => !g.is_deleted && (season === "all" || gameSeason(g) === season))
     .sort((a, b) => {
      const aScheduled = a.status === "SCHEDULED";
      const bScheduled = b.status === "SCHEDULED";
      if (aScheduled !== bScheduled) return aScheduled ? -1 : 1;
      const direction = aScheduled ? 1 : -1;
      return direction * (Number(a.game_date_epoch) - Number(b.game_date_epoch) || Number(a.round_number) - Number(b.round_number));
    });
}
