import { apiClient } from "./apiClient";

export async function getPlayers() {
  const response = await apiClient.get("/players");
  return response.data;
}

export async function getPlayerDetails(playerId, season) {
  const response = await apiClient.get(`/players/${playerId}`, { params: { season } });
  return response.data;
}