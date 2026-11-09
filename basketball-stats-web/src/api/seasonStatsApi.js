import { apiClient } from "./apiClient";

export async function getSeasonStats(season) {
  const response = await apiClient.get("/stats/season", { params: { season } });
  return response.data;
}