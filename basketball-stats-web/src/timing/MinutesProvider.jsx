import { useState, useCallback } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { getGames, getGameDetails } from "../api/gamesApi";
import { calculatePlayingTime } from "../utils/playingTime";
import { MinutesContext } from "./context";
export default function MinutesProvider({ children }) {
  const [enabled, setEnabled] = useState(false);
  const request = useCallback(() => setEnabled(true), []);
  const list = useQuery({ queryKey: ["games"], queryFn: getGames, enabled });
  const details = useQueries({ queries: (list.data ?? []).map(game => ({ queryKey: ["game-details", String(game.id)], queryFn: () => getGameDetails(game.id), enabled })) });
  const games = {}, totals = {}, counts = {}, unknown = new Set();
  const complete = list.isSuccess && details.every(query => query.isSuccess);
  details.forEach((query, index) => {
    if (!query.data?.game) return;
    const result = calculatePlayingTime(query.data);
    games[String(list.data[index].id)] = { ...result, players: query.data.players };
    for (const player of query.data.players ?? []) {
      const id = String(player.player_id);
      if (result.seconds[id] == null) unknown.add(id);
    }
    for (const [id, seconds] of Object.entries(result.seconds)) {
      totals[id] = (totals[id] ?? 0) + seconds;
      counts[id] = (counts[id] ?? 0) + (seconds > 0 ? 1 : 0);
    }
  });
  const averages = complete ? Object.fromEntries(Object.keys(totals).filter(id => !unknown.has(id)).map(id => [id, totals[id] / (counts[id] || 1)])) : {};
  return <MinutesContext.Provider value={{ games, averages, request }}>{children}</MinutesContext.Provider>;
}
