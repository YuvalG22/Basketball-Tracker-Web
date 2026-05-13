import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getGameDetails } from "../api/gamesApi";

export default function GameDetailsPage() {
  const { gameId } = useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["game-details", gameId],
    queryFn: () => getGameDetails(gameId),
  });

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (isError) {
    return <p>{error.message}</p>;
  }

  const { game, players } = data;

  return (
    <section>
      <div className="rounded-3xl bg-slate-900 p-6">
        <p className="text-sm text-slate-400">
          מחזור {game.round_number}
        </p>

        <h1 className="mt-2 text-2xl font-bold">
          נגד {game.opponent_name}
        </h1>

        <div className="mt-6 text-center">
          <div className="text-5xl font-bold">
            {game.team_score} - {game.opponent_score}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {players.map((player) => (
          <div
            key={player.player_id}
            className="rounded-2xl bg-slate-900 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  #{player.player_number} {player.player_name}
                </h2>
              </div>

              <div className="text-xl font-bold text-orange-400">
                {player.points} PTS
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-slate-300">
              <div>REB: {player.rebounds}</div>
              <div>AST: {player.assists}</div>
              <div>STL: {player.steals}</div>
              <div>BLK: {player.blocks}</div>
              <div>TOV: {player.turnovers}</div>
            </div>

            <div className="mt-4 border-t border-slate-800 pt-4 text-sm text-slate-400">
              <div>
                2PT: {player.two_made}/{Number(player.two_made) + Number(player.two_miss)}
              </div>

              <div>
                3PT: {player.three_made}/{Number(player.three_made) + Number(player.three_miss)}
              </div>

              <div>
                FT: {player.ft_made}/{Number(player.ft_made) + Number(player.ft_miss)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}