import { apiClient } from "./apiClient";
import { completedGames } from "../utils/gameStats";

export async function getGames() {
  const response = await apiClient.get("/games", {
    params: { status: "FINISHED" },
  });
  return completedGames(response.data);
}

export async function getGameDetails(gameId) {
  const response = await apiClient.get(`/games/${gameId}`);
  return response.data;
}
