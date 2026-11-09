import { formatGameRound } from "../utils/gameRound";
import { usePreferences } from "../preferences/context";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { getScheduleGames } from "../api/gamesApi";
import { availableSeasons, seasonGames, CURRENT_SEASON } from "../utils/schedule";
import TeamLogo from "../components/TeamLogo";

export default function GamesPage() {
  const { t, language } = usePreferences();
  const [params, setParams] = useSearchParams();
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["schedule-games"], queryFn: getScheduleGames,
  });
  const seasons = availableSeasons(data);
  const requested = params.get("season");
  const season = requested === "all" || seasons.includes(requested) ? requested : CURRENT_SEASON;
  const games = seasonGames(data, season);
  if (isLoading) return <p>{t("Loading...")}</p>;
  if (isError) return <p>{t("Unable to load data. Please try again.")}</p>;

  return <section>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl font-bold">{t("Games")}</h1>
      <label className="flex items-center gap-2 text-sm font-medium">
        {t("Season")}
        <select value={season} onChange={event => {
          const next = new URLSearchParams(params);
          next.set("season", event.target.value);
          setParams(next);
        }} className="min-h-11 rounded-lg border border-line bg-surface px-3 py-2 text-ink">
          {seasons.map(value => <option key={value} value={value}>{value}</option>)}
          <option value="all">{t("All seasons")}</option>
        </select>
      </label>
    </div>
    {games.length === 0 ? <p className="text-muted">{t("No games in this season")}</p> : (
      <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
        {games.map(game => {
          const scheduled = game.status === "SCHEDULED";
          const finished = game.status === "FINISHED";
          const teamScore = scheduled ? "—" : Number(game.team_score ?? 0);
          const opponentScore = scheduled ? "—" : Number(game.opponent_score ?? 0);
          const home = { name: game.is_home_game ? "Afeka" : game.opponent_name, score: game.is_home_game ? teamScore : opponentScore };
          const away = { name: game.is_home_game ? game.opponent_name : "Afeka", score: game.is_home_game ? opponentScore : teamScore };
          const result = teamScore > opponentScore ? "W" : teamScore < opponentScore ? "L" : "D";
          const row = <>
            <div className="games-list-meta text-xs text-muted">
              <span className="break-words">{formatGameRound(game, t)}</span>
              <span className="shrink-0 tabular-nums">{new Date(Number(game.game_date_epoch)).toLocaleDateString(language === "he" ? "he-IL" : "en-GB", { timeZone: "Asia/Jerusalem", day: "2-digit", month: "2-digit", year: "numeric" })}</span>
            </div>
            <div className="min-w-0 space-y-1">
              <GameTeamRow team={home} winner={finished && home.score > away.score} />
              <GameTeamRow team={away} winner={finished && away.score > home.score} />
            </div>
            {finished ? <div aria-label={t(result === "W" ? "Win" : result === "L" ? "Loss" : "Draw")} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${result === "W" ? "bg-success" : result === "L" ? "bg-danger" : "bg-muted"}`}>{result}</div>
              : <span className="shrink-0 rounded-full bg-raised px-2 py-1 text-xs font-medium text-muted">{t(scheduled ? "Scheduled" : "Live")}</span>}
          </>;
          return <li key={game.id} className="border-b border-line last:border-b-0">
            {finished ? <Link to={`/games/${game.id}`} className="games-list-row transition hover:bg-raised focus-visible:bg-raised">{row}</Link>
              : <div className="games-list-row">{row}</div>}
          </li>;
        })}
      </ul>
    )}
  </section>;
}

function GameTeamRow({ team, winner }) {
  const { teamName } = usePreferences();
  return <div className={`flex min-w-0 items-center gap-2 ${winner ? "font-bold text-ink" : "font-medium text-muted"}`}>
    <TeamLogo name={teamName(team.name)} className="h-7 w-7" />
    <span className="min-w-0 flex-1 break-words text-sm">{teamName(team.name)}</span>
    <span className="shrink-0 text-base tabular-nums">{team.score}</span>
  </div>;
}
