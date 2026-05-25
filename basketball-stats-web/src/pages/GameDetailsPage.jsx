import { useState } from "react";
import { data, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getGameDetails } from "../api/gamesApi";

import GameStatsView from "../components/GameDetails";

export default function GameDetailsPage() {
  const { gameId } = useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["game-details", gameId],
    queryFn: () => getGameDetails(gameId),
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>{error.message}</p>;

  const { game, players, events = [] } = data;

  return (
    <GameStatsView
      game={data.game}
      players={data.players}
      events={data.events ?? []}
      lineupEvents={data.lineupEvents ?? []}
      isLive={data.game.status === "LIVE"}
    />
  );
}