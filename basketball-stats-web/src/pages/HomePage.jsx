import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getHomeGame } from "../api/homeApi";

export default function HomePage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["home-game"],
    queryFn: getHomeGame,
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>{error.message}</p>;

  const game = data?.game?.status === "FINISHED" ? data.game : null;

  if (!game) {
    return (
      <section className="space-y-5">
        <h1 className="text-3xl font-bold">Home</h1>

        <div className="rounded-[20px] bg-surface p-5 text-center">
          <p className="text-muted">No completed games yet</p>
        </div>
      </section>
    );
  }

  const teamScore = Number(game.team_score ?? 0);
  const opponentScore = Number(game.opponent_score ?? 0);

  const homeTeamName = game.is_home_game ? "Afeka" : game.opponent_name;
  const awayTeamName = game.is_home_game ? game.opponent_name : "Afeka";

  const homeScore = game.is_home_game ? teamScore : opponentScore;
  const awayScore = game.is_home_game ? opponentScore : teamScore;

  const gameLink = `/games/${game.id}`;

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-accent">
          LAST GAME
        </p>

        <h1 className="text-3xl font-bold">Home</h1>
      </div>

      <Link
        to={gameLink}
        className="block rounded-[20px] border border-line bg-surface p-5 transition active:scale-[0.98]"
      >
        <div className="mb-4 flex items-center justify-between">
          <div
            className="inline-flex items-center gap-2 rounded-full bg-raised px-3 py-1 text-xs font-bold text-muted"
          >
            FT
          </div>

          <div className="text-xs text-muted">
            Round {game.round_number}
          </div>
        </div>

        <div className="space-y-4">
          <TeamScoreRow
            name={homeTeamName}
            score={homeScore}
            isWinner={homeScore > awayScore}
          />

          <TeamScoreRow
            name={awayTeamName}
            score={awayScore}
            isWinner={awayScore > homeScore}
          />
        </div>

        <div className="mt-5 rounded-2xl bg-raised p-3 text-center text-sm font-semibold text-muted">
          Open game summary
        </div>
      </Link>
    </section>
  );
}

function TeamScoreRow({ name, score, isWinner }) {

  return (
    <div className="flex items-center justify-between">
      <div
        className={`text-lg ${
          isWinner ? "font-bold text-ink" : "font-medium text-muted"
        }`}
      >
        {name}
      </div>

      <div
        className={`text-4xl ${
          isWinner ? "font-black text-ink" : "font-semibold text-muted"
        }`}
      >
        {score}
      </div>
    </div>
  );
}
