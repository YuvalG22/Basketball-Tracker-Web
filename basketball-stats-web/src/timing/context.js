import { createContext, useContext, useEffect } from "react";
export const MinutesContext = createContext({ games: {}, averages: {} });
export function useMinutes(season) {
  const context = useContext(MinutesContext);
  const { request } = context;
  useEffect(() => { request?.(); }, [request]);
  return season == null ? context : {...context, averages:context.seasons?.[season]?.averages ?? {}, plusMinusTotals:context.seasons?.[season]?.plusMinusTotals ?? {}};
}
