import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getHomeGame } from "../api/homeApi";

export default function HomePage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["home-game"],
    queryFn: getHomeGame,
    refetchInterval: 5000,
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>{error.message}</p>;

  const game = data?.game;
  const isLive = data?.type === "LIVE";

  if (!game) {
    return (
      <section className="space-y-5">
        <h1 className="text-3xl font-bold">Home</h1>

        <div className="rounded-3xl bg-[#1F1D1D] p-5 text-center">
          <p className="text-[#FFFFFF80]">No games yet</p>
        </div>
      </section>
    );
  }

  const homeTeamName = game.is_home_game ? "Afeka" : game.opponent_name;
  const awayTeamName = game.is_home_game ? game.opponent_name : "A";

  const homeScore = game.is_home_game ? game.team_score : game.opponent_score;
  const awayScore = game.is_home_game ? game.opponent_score : game.team_score;

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-[#2ECC71]">
          {isLive ? "LIVE NOW" : "LAST GAME"}
        </p>

        <h1 className="text-3xl font-bold">Home</h1>
      </div>

      <Link
        to={`/games/${game.id}`}
        className="block rounded-3xl bg-[#1F1D1D] p-5 active:scale-[0.98]"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div
              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                isLive
                  ? "bg-red-500/20 text-red-400"
                  : "bg-[#2D2A2A] text-[#FFFFFF80]"
              }`}
            >
              {isLive ? "LIVE" : "FT"}
            </div>
          </div>

          <div className="text-xs text-[#FFFFFF80]">
            Round {game.round_number}
          </div>
        </div>

        <div className="space-y-4">
          <TeamScoreRow
            name={homeTeamName}
            score={homeScore}
            isWinner={!isLive && homeScore > awayScore}
          />

          <TeamScoreRow
            name={awayTeamName}
            score={awayScore}
            isWinner={!isLive && awayScore > homeScore}
          />
        </div>

        {isLive && (
          <div className="mt-5 rounded-2xl bg-[#2D2A2A] p-3 text-center text-sm font-semibold text-red-400">
            משחק חי מתעדכן אוטומטית
          </div>
        )}
      </Link>
    </section>
  );
}

function TeamScoreRow({ name, score, isWinner }) {
  return (
    <div className="flex items-center justify-between">
      <div
        className={`text-lg ${
          isWinner ? "font-bold text-white" : "font-medium text-[#FFFFFF80]"
        }`}
      >
        {name}
      </div>

      <div
        className={`text-3xl ${
          isWinner ? "font-bold text-white" : "font-semibold text-[#FFFFFF80]"
        }`}
      >
        {score}
      </div>
    </div>
  );
}