import { usePreferences } from "../preferences/context";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getGameDetails } from "../api/gamesApi";
import GameStatsView from "../components/GameDetails";
export default function GameDetailsPage() {
  const {
    t
  } = usePreferences();
  const {
    gameId
  } = useParams();
  const {
    data,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["game-details", gameId],
    queryFn: () => getGameDetails(gameId)
  });
  if (isLoading) return <p>{t("Loading...")}</p>;
  if (isError) return <p>{t("Unable to load data. Please try again.")}{/* error details are not user-facing */}</p>;
  if (data?.game?.status !== "FINISHED") return <p>{t("Completed game not found")}</p>;
  return <GameStatsView key={gameId} game={data.game} players={data.players ?? []} events={data.events ?? []} lineupEvents={data.lineupEvents ?? []} />;
}
