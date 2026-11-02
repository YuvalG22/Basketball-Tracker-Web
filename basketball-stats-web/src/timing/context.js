import { createContext, useContext, useEffect } from "react";
export const MinutesContext = createContext({ games: {}, averages: {} });
export function useMinutes() {
  const context = useContext(MinutesContext);
  const { request } = context;
  useEffect(() => { request?.(); }, [request]);
  return context;
}
