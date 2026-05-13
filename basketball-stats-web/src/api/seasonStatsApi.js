import { apiClient } from "./apiClient";

export async function getSeasonStats() {
  const response = await apiClient.get("/stats/season");
  return response.data;
}