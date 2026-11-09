import { aggregateTiming } from "../utils/seasonTiming";
import { gameSeason } from "../utils/schedule";
import { useState, useCallback } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { getGames, getGameDetails } from "../api/gamesApi";
import { calculatePlayingTime } from "../utils/playingTime";
import { calculatePlusMinus } from "../utils/plusMinus";
import { MinutesContext } from "./context";
export default function MinutesProvider({ children }) {
  const [enabled, setEnabled] = useState(false);
  const request = useCallback(() => setEnabled(true), []);
  const list = useQuery({ queryKey: ["games"], queryFn: getGames, enabled });
  const details = useQueries({ queries: (list.data ?? []).map(game => ({ queryKey: ["game-details", String(game.id)], queryFn: () => getGameDetails(game.id), enabled })) });
  const games = {};
  const complete = list.isSuccess && details.every(query => query.isSuccess);
  details.forEach((query, index) => {
    if (!query.data?.game) return;
    const result = calculatePlayingTime(query.data);
    games[String(list.data[index].id)] = { ...result, plusMinus: calculatePlusMinus(query.data), players: query.data.players, season: gameSeason(list.data[index]) };
  });
  const {averages,plusMinusTotals}=aggregateTiming(games,complete);
  const seasons={};
  for (const season of new Set((list.data??[]).map(gameSeason))) {
    const seasonGames=Object.fromEntries(Object.entries(games).filter(([,game])=>game.season===season));
    const seasonComplete=list.isSuccess && details.every((query,index)=>gameSeason(list.data[index])!==season || query.isSuccess);
    seasons[season]=aggregateTiming(seasonGames,seasonComplete);
  }
  return <MinutesContext.Provider value={{ games, averages, plusMinusTotals, seasons, request }}>{children}</MinutesContext.Provider>;
}
