import { useQueries } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getSeasonStats } from "../api/seasonStatsApi";
import { STATS_SEASONS, resolveStatsSeason } from "../utils/statsSeason";
export function useStatsSeason() {
  const [params, setParams] = useSearchParams();
  const queries = useQueries({queries:STATS_SEASONS.map(season => ({queryKey:["season-stats",season],queryFn:()=>getSeasonStats(season)}))});
  const result = resolveStatsSeason(params.get("season"), ...queries);
  return {...result, ready:result.query.isSuccess, select:season=>{
    const next=new URLSearchParams(params); next.set("season",season); setParams(next);
  }};
}
