import { useState } from "react";
import { data, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getGameDetails } from "../api/gamesApi";

import GameStatsView from "../components/GameDetails";

export default function LiveGamePage() {
  const { gameId } = useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["live-game", gameId],
    queryFn: () => getGameDetails(gameId),
    refetchInterval: 3000,
  });

  if (isLoading) return <p>Loading live game...</p>;
  if (isError) return <p>{error.message}</p>;

  return (
    <GameStatsView
      game={data.game}
      players={data.players}
      events={data.events ?? []}
      lineupEvents={data.lineupEvents ?? []}
      isLive={true}
    />
  );
}