import { apiClient } from "./apiClient";

export async function getPlayers() {
  const response = await apiClient.get("/players");
  return response.data;
}

export async function getPlayerDetails(playerId) {
  const response = await apiClient.get(`/players/${playerId}`);
  return response.data;
}