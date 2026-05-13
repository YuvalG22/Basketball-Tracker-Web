import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPlayerDetails } from "../api/playersApi";

export default function PlayerDetailsPage() {
  const { playerId } = useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["player-details", playerId],
    queryFn: () => getPlayerDetails(playerId),
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>{error.message}</p>;

  const { player, averages, games } = data;

  return (
    <section>
      <div className="rounded-3xl bg-slate-900 p-6">
        <h1 className="text-3xl font-bold">
          #{player.number} {player.name}
        </h1>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-slate-800 p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">
              {averages.ppg}
            </div>

            <div className="mt-1 text-sm text-slate-400">
              PPG
            </div>
          </div>

          <div className="rounded-2xl bg-slate-800 p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">
              {averages.rpg}
            </div>

            <div className="mt-1 text-sm text-slate-400">
              RPG
            </div>
          </div>

          <div className="rounded-2xl bg-slate-800 p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">
              {averages.apg}
            </div>

            <div className="mt-1 text-sm text-slate-400">
              APG
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {games.map((game) => (
          <div
            key={game.game_id}
            className="rounded-2xl bg-slate-900 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">
                  נגד {game.opponent_name}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  מחזור {game.round_number}
                </p>
              </div>

              <div className="text-xl font-bold text-orange-400">
                {game.points} PTS
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-slate-300">
              <div>REB: {game.rebounds}</div>
              <div>AST: {game.assists}</div>
              <div>STL: {game.steals}</div>
              <div>BLK: {game.blocks}</div>
              <div>TOV: {game.turnovers}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}