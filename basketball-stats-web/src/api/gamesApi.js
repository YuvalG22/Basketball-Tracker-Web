import { gameShots } from "../utils/gameShots";
import { teamStatsFromEvents } from "../utils/teamStats";
import { apiClient } from "./apiClient";
import { completedGames } from "../utils/gameStats";

// Older deployments expose events separately. Share one fallback request across
// list/detail consumers rather than issuing one request per game.
let legacyEventsRequest, legacyEventsLoadedAt = 0;
function getLegacyEvents() {
  if (!legacyEventsRequest || Date.now() - legacyEventsLoadedAt > 30000) {
    legacyEventsLoadedAt = Date.now();
    legacyEventsRequest = apiClient.get("/events").then(response => {
      if (!Array.isArray(response.data)) throw new Error("Invalid events response");
      return response.data.filter(event => !event.is_deleted);
    }).catch(() => { legacyEventsRequest = null; return null; });
  }
  return legacyEventsRequest;
}
async function withAvailability(games) {
  if (!games.some(game => game.status === "FINISHED" && typeof game.has_events !== "boolean")) return games;
  const events = await getLegacyEvents();
  if (!events) return games; // A failed lookup is unknown, never proof of zero events.
  const gameIds = new Set(events.map(event => String(event.game_remote_id)));
  return games.map(game => typeof game.has_events === "boolean" ? game : { ...game, has_events: gameIds.has(String(game.id)) });
}
export async function getGames() {
  const response = await apiClient.get("/games", {
    params: { status: "FINISHED" },
  });
  return withAvailability(completedGames(response.data));
}

export async function getGameDetails(gameId) {
  const response = await apiClient.get(`/games/${gameId}`);
  const data = response.data;
  if (!data?.game) return data;
  if (typeof data.game.has_events === "boolean" && data.teamStats && Array.isArray(data.shots)) return data;
  const events = await getLegacyEvents();
  if (!events) return data;
  const gameEvents = events.filter(event => String(event.game_remote_id) === String(data.game.id));
  return { ...data, game: { ...data.game, has_events: data.game.has_events ?? gameEvents.length > 0 }, shots: data.shots ?? gameShots(gameEvents), teamStats: data.teamStats ?? teamStatsFromEvents(data.game, gameEvents) };
}

// Games tab includes fixtures; historical/statistical consumers keep getGames().
export async function getScheduleGames() {
  const response = await apiClient.get("/games");
  return withAvailability((response.data ?? []).filter(game => !game.is_deleted));
}
