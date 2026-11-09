import { seasonPlusMinusTotals } from "./plusMinus.js";

export function aggregateTiming(games, complete) {
  const totals = {}, counts = {}, unknown = new Set();
  for (const game of Object.values(games)) {
    for (const player of game.players ?? []) {
      const id = String(player.player_id);
      if (game.seconds[id] == null) unknown.add(id);
    }
    for (const [id, seconds] of Object.entries(game.seconds)) {
      totals[id] = (totals[id] ?? 0) + seconds;
      counts[id] = (counts[id] ?? 0) + (seconds > 0 ? 1 : 0);
    }
  }
  return {
    averages: complete ? Object.fromEntries(Object.keys(totals)
      .filter(id => !unknown.has(id)).map(id => [id, totals[id] / (counts[id] || 1)])) : {},
    plusMinusTotals: seasonPlusMinusTotals(games, complete),
  };
}
