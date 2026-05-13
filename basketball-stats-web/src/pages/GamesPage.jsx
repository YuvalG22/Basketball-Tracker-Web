import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getGames } from "../api/gamesApi";

export default function GamesPage() {
  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["games"],
    queryFn: getGames,
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>{error.message}</p>;

  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">Games</h1>

      <div className="space-y-3">
        {data.map((game) => (
          <Link
            key={game.id}
            to={`/games/${game.id}`}
            className="block rounded-2xl bg-[#1F1D1D]"
          >
            <div key={game.id} className="w-full rounded-2xl bg-[#1F1D1D] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col text-center text-sm text-[#FFFFFF80]">
                    <div>Round {game.round_number}</div>
                    <div>
                      {new Date(
                        Number(game.game_date_epoch),
                      ).toLocaleDateString("he-IL", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                  </div>

                  <div className="h-12 w-px bg-[#FFFFFF80]" />

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`${
                          (game.team_score > game.opponent_score &&
                            game.is_home_game) ||
                          (game.team_score < game.opponent_score &&
                            !game.is_home_game)
                            ? "font-bold text-white"
                            : "font-medium text-[#FFFFFF80]"
                        }`}
                      >
                        {game.is_home_game ? "Afeka" : game.opponent_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`${
                          (game.team_score > game.opponent_score &&
                            !game.is_home_game) ||
                          (game.team_score < game.opponent_score &&
                            game.is_home_game)
                            ? "font-bold text-white"
                            : "font-medium text-[#FFFFFF80]"
                        }`}
                      >
                        {game.is_home_game ? game.opponent_name : "Afeka"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="space-y-2 text-right">
                    <div
                      className={`text-xl ${
                        (game.team_score > game.opponent_score &&
                          game.is_home_game) ||
                        (game.team_score < game.opponent_score &&
                          !game.is_home_game)
                          ? "font-bold text-white"
                          : "font-medium text-[#FFFFFF80]"
                      }`}
                    >
                      {game.is_home_game
                        ? game.team_score
                        : game.opponent_score}
                    </div>

                    <div
                      className={`text-xl ${
                        (game.team_score > game.opponent_score &&
                          !game.is_home_game) ||
                        (game.team_score < game.opponent_score &&
                          game.is_home_game)
                          ? "font-bold text-white"
                          : "font-medium text-[#FFFFFF80]"
                      }`}
                    >
                      {game.is_home_game
                        ? game.opponent_score
                        : game.team_score}
                    </div>
                  </div>

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${
                      game.team_score > game.opponent_score
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  >
                    {game.team_score > game.opponent_score ? "W" : "L"}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
