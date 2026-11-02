import { formatGameRound } from "../utils/gameRound";
import { usePreferences } from "../preferences/context";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getGames } from "../api/gamesApi";
import TeamLogo from "../components/TeamLogo";

export default function GamesPage() {
  const { t } = usePreferences();
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["games"],
    queryFn: getGames,
  });
  if (isLoading) return <p>{t("Loading...")}</p>;
  if (isError) return <p>{t("Unable to load data. Please try again.")}</p>;

  return <section>
    <h1 className="mb-4 text-2xl font-bold">{t("Games")}</h1>
    {data.length === 0 ? <p className="text-muted">{t("No completed games yet")}</p> : (
      <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
        {data.map(game => {
          const teamScore = Number(game.team_score ?? 0);
          const opponentScore = Number(game.opponent_score ?? 0);
          const home = { name: game.is_home_game ? "Afeka" : game.opponent_name, score: game.is_home_game ? teamScore : opponentScore };
          const away = { name: game.is_home_game ? game.opponent_name : "Afeka", score: game.is_home_game ? opponentScore : teamScore };
          const result = teamScore > opponentScore ? "W" : teamScore < opponentScore ? "L" : "D";
          return <li key={game.id} className="border-b border-line last:border-b-0">
            <Link to={`/games/${game.id}`} className="games-list-row transition hover:bg-raised focus-visible:bg-raised">
              <div className="games-list-meta text-xs text-muted">
                <span className="break-words">{formatGameRound(game, t)}</span>
                <span className="shrink-0 tabular-nums">{new Date(Number(game.game_date_epoch)).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
              </div>
              <div className="min-w-0 space-y-1">
                <GameTeamRow team={home} winner={home.score > away.score} />
                <GameTeamRow team={away} winner={away.score > home.score} />
              </div>
              <div aria-label={t(result === "W" ? "Win" : result === "L" ? "Loss" : "Draw")} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${result === "W" ? "bg-success" : result === "L" ? "bg-danger" : "bg-muted"}`}>{result}</div>
            </Link>
          </li>;
        })}
      </ul>
    )}
  </section>;
}

function GameTeamRow({ team, winner }) {
  const { teamName } = usePreferences();
  return <div className={`flex min-w-0 items-center gap-2 ${winner ? "font-bold text-ink" : "font-medium text-muted"}`}>
    <TeamLogo name={team.name} className="h-7 w-10" />
    <span className="min-w-0 flex-1 break-words text-sm">{teamName(team.name)}</span>
    <span className="shrink-0 text-base tabular-nums">{team.score}</span>
  </div>;
}
