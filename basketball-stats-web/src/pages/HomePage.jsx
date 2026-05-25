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

  const isLive = game.status === "LIVE" || data?.type === "LIVE";

  const teamScore = isLive
    ? Number(game.live_team_score ?? game.team_score ?? 0)
    : Number(game.team_score ?? 0);

  const opponentScore = isLive
    ? Number(game.live_opponent_score ?? game.opponent_score ?? 0)
    : Number(game.opponent_score ?? 0);

  const homeTeamName = game.is_home_game ? "Afeka" : game.opponent_name;
  const awayTeamName = game.is_home_game ? game.opponent_name : "Afeka";

  const homeScore = game.is_home_game ? teamScore : opponentScore;
  const awayScore = game.is_home_game ? opponentScore : teamScore;

  const gameLink = isLive ? `/live/${game.id}` : `/games/${game.id}`;

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-[#2ECC71]">
          {isLive ? "LIVE NOW" : "LAST GAME"}
        </p>

        <h1 className="text-3xl font-bold">Home</h1>
      </div>

      <Link
        to={gameLink}
        className={`block rounded-3xl border p-5 transition active:scale-[0.98] ${
          isLive
            ? "border-[#2ECC71]/30 bg-[#1A241E]"
            : "border-white/10 bg-[#1F1D1D]"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
              isLive
                ? "bg-[#2ECC71]/15 text-[#2ECC71]"
                : "bg-[#2D2A2A] text-[#FFFFFF80]"
            }`}
          >
            {isLive && <span className="h-2 w-2 rounded-full bg-[#2ECC71]" />}
            {isLive
              ? `LIVE • Q${game.current_period ?? 1} • ${formatClock(
                  game.clock_sec_remaining ?? 0,
                )}`
              : "FT"}
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
            isLive={isLive}
          />

          <TeamScoreRow
            name={awayTeamName}
            score={awayScore}
            isWinner={!isLive && awayScore > homeScore}
            isLive={isLive}
          />
        </div>

        <div className="mt-5 rounded-2xl bg-[#2D2A2A] p-3 text-center text-sm font-semibold text-[#FFFFFF80]">
          {isLive ? "Open live game" : "Open game summary"}
        </div>
      </Link>
    </section>
  );
}

function TeamScoreRow({ name, score, isWinner, isLive }) {
  const active = isLive || isWinner;

  return (
    <div className="flex items-center justify-between">
      <div
        className={`text-lg ${
          active ? "font-bold text-white" : "font-medium text-[#FFFFFF80]"
        }`}
      >
        {name}
      </div>

      <div
        className={`text-4xl ${
          active ? "font-black text-white" : "font-semibold text-[#FFFFFF80]"
        }`}
      >
        {score}
      </div>
    </div>
  );
}

function formatClock(seconds) {
  const total = Math.max(0, Number(seconds ?? 0));
  const min = Math.floor(total / 60);
  const sec = total % 60;

  return `${min}:${sec.toString().padStart(2, "0")}`;
}