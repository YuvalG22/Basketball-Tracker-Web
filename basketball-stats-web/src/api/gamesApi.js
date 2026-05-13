import { apiClient } from "./apiClient";

export async function getGames() {
  const response = await apiClient.get("/games");
  return response.data;
}

export async function getGameDetails(gameId) {
  const response = await apiClient.get(`/games/${gameId}`);
  return response.data;
}