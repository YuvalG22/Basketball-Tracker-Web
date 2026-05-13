import { apiClient } from "./apiClient";

export async function getHomeGame() {
  const response = await apiClient.get("/games/home");
  return response.data;
}