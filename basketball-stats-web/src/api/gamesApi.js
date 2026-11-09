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

// Games tab includes fixtures; historical/statistical consumers keep getGames().
export async function getScheduleGames() {
  const response = await apiClient.get("/games");
  return (response.data ?? []).filter(game => !game.is_deleted);
}
