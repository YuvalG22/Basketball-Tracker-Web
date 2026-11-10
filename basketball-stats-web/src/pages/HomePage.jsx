import GameSummaryLink, { canOpenSummary } from "../components/GameSummaryLink";
﻿import { formatGameRound } from "../utils/gameRound";
import { usePreferences } from "../preferences/context";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CURRENT_SEASON, gameSeason } from "../utils/schedule";

const LAST_SEASON = "25/26";
import { getGames, getGameDetails } from "../api/gamesApi";
import TeamLogo from "../components/TeamLogo";
import PlayerAvatar from "../components/PlayerAvatar";
import PlayerMinutes from "../components/PlayerMinutes";

const resultOf = game => Number(game.team_score) > Number(game.opponent_score) ? "W" : Number(game.team_score) < Number(game.opponent_score) ? "L" : "D";
const resultKey = result => result === "W" ? "Win" : result === "L" ? "Loss" : "Draw";
const resultClass = result => result === "W" ? "bg-success" : result === "L" ? "bg-danger" : "bg-muted";

export default function HomePage() {
  const { t, teamName, language, playerName } = usePreferences();
  const [params, setParams] = useSearchParams();
  const season = params.get("season") === LAST_SEASON ? LAST_SEASON : CURRENT_SEASON;
  const selectSeason = value => {
    const next = new URLSearchParams(params);
    next.set("season", value);
    setParams(next);
  };
  const gamesLink = `/games?season=${encodeURIComponent(season)}`;
  const history = useQuery({ queryKey: ["games"], queryFn: getGames });
  const recent = (history.data ?? []).filter(item => !item.is_deleted && item.status === "FINISHED" && gameSeason(item) === season)
    .sort((a, b) => Number(b.game_date_epoch) - Number(a.game_date_epoch));
  const game = recent[0] ?? null;
  const detail = useQuery({ queryKey: ["game-details", String(game?.id)], queryFn: () => getGameDetails(game.id), enabled: canOpenSummary(game) });
  const date = value => new Date(Number(value)).toLocaleDateString(language === "he" ? "he-IL" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

  const header = <div className="flex flex-wrap items-end justify-between gap-4">
    <div><h1 className="text-3xl font-bold sm:text-4xl">{t("Home")}</h1><p className="mt-2 text-sm text-muted">{t("Your team, at a glance.")}</p></div>
    <div className="flex flex-wrap items-center gap-3">
      {history.isSuccess && <span className="rounded-full border border-line px-3 py-1.5 text-xs text-muted">{recent.length} {t("Completed games")}</span>}
      <label className="flex items-center gap-2 text-sm font-medium">
        {t("Season")}
        <select value={season} onChange={event => selectSeason(event.target.value)} className="min-h-11 rounded-xl border border-line bg-surface px-3 py-2 text-ink">
          <option value={CURRENT_SEASON}>{CURRENT_SEASON} · {t("Current season")}</option>
          <option value={LAST_SEASON}>{LAST_SEASON} · {t("Last season")}</option>
        </select>
      </label>
    </div>
  </div>;
  if (history.isLoading) return <section className="space-y-6">{header}<p role="status">{t("Loading...")}</p></section>;
  if (history.isError) return <section className="space-y-6">{header}<div role="alert" className="rounded-2xl bg-surface p-5"><p>{t("Unable to load data. Please try again.")}</p><button className="mt-3 rounded-xl bg-raised px-4 py-2" onClick={() => history.refetch()}>{t("Retry")}</button></div></section>;
  if (!game) return <section className="space-y-6">{header}
    <div className="rounded-[24px] border border-line bg-surface px-5 py-12 text-center">
      <p className="text-xs font-semibold text-accent">{t("Season")} {season}</p>
      <h2 className="mt-3 text-xl font-bold">{t("No completed games yet")}</h2>
      <p className="mt-2 text-sm text-muted">{t("Results and game leaders will appear after the first completed game of this season.")}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Link to={gamesLink} className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-white">{t("View all games")} <ForwardArrow /></Link>
        {season === CURRENT_SEASON && <button type="button" onClick={() => selectSeason(LAST_SEASON)} className="min-h-11 rounded-xl bg-raised px-4 text-sm font-semibold">{t("View last season")}</button>}
      </div>
    </div>
  </section>;

  const result = resultOf(game);
  const homeTeam = { name: game.is_home_game ? "Afeka" : game.opponent_name, score: Number(game.is_home_game ? game.team_score : game.opponent_score) };
  const awayTeam = { name: game.is_home_game ? game.opponent_name : "Afeka", score: Number(game.is_home_game ? game.opponent_score : game.team_score) };
  return <section className="space-y-6">
    {header}
    <TeamOverview games={recent} />

    <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-5">
        <GameSummaryLink game={game} className="home-scorecard group block overflow-hidden rounded-[24px] border border-line bg-surface transition hover:border-accent">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-7 sm:pt-6">
            <h2 className="text-xs font-bold tracking-wide text-accent">{t("LAST GAME")}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${resultClass(result)}`}>{t(resultKey(result))}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 text-xs text-muted">
            <span>{formatGameRound(game, t)}</span><span aria-hidden="true">·</span><span>{date(game.game_date_epoch)}</span><span aria-hidden="true">·</span><span>{t(game.is_home_game ? "Home game" : "Away game")}</span>
          </div>
          <div dir="ltr" className="home-scoreboard">
            <ScoreTeam team={homeTeam} winner={homeTeam.score > awayTeam.score} />
            <div className="text-center"><div className="home-score-numbers"><span>{homeTeam.score}</span><span className="home-score-dash" aria-hidden="true">–</span><span>{awayTeam.score}</span></div><div className="mt-2 text-[11px] font-semibold tracking-wide text-muted">{t("FINAL")}</div></div>
            <ScoreTeam team={awayTeam} winner={awayTeam.score > homeTeam.score} />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm font-semibold text-accent sm:px-7">{canOpenSummary(game) && <><span>{t("Open game summary")}</span><ForwardArrow /></>}</div>
        </GameSummaryLink>

        <section className="rounded-[24px] border border-line bg-surface p-4 sm:p-5" aria-label={t("Last game leaders")}>
          <h2 className="mb-4 text-lg font-bold">{t("Last game leaders")}</h2>
          {!canOpenSummary(game) ? <p className="text-sm text-muted">{t("No stats available")}</p> : detail.isPending ? <p role="status" className="py-4 text-sm text-muted">{t("Loading...")}</p> : detail.isError ? <p className="text-sm text-muted">{t("Unable to load data. Please try again.")} <button className="underline" onClick={() => detail.refetch()}>{t("Retry")}</button></p> : detail.data?.players?.length ? <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[["Points", "points"], ["Rebounds", "rebounds"], ["Assists", "assists"]].map(([label, field]) => {
              const leader = [...detail.data.players].sort((a, b) => Number(b[field] ?? 0) - Number(a[field] ?? 0))[0];
              return <Link key={field} to={`/players/${leader.player_id}`} className="rounded-2xl bg-raised p-3 transition hover:ring-1 hover:ring-accent">
                <div className="mb-3 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2"><span className="text-xs text-muted">{t(label)}</span><strong className="text-2xl text-accent">{Number(leader[field] ?? 0)}</strong></div>
                <div className="flex min-w-0 items-center gap-2"><span className="hidden sm:inline-flex"><PlayerAvatar player={leader} className="h-9 w-9" /></span><span className="min-w-0 break-words text-xs font-semibold sm:text-sm">{playerName(leader.player_name)}</span></div>
                <div className="mt-2"><PlayerMinutes playerId={leader.player_id} gameId={game.id} /></div>
              </Link>;
            })}
          </div> : <p className="text-sm text-muted">{t("No player stats recorded.")}</p>}
        </section>
      </div>

      <section className="min-w-0 rounded-[24px] border border-line bg-surface p-4 sm:p-5" aria-label={t("Recent games")}>
        <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{t("Recent games")}</h2><Link to={gamesLink} className="inline-flex min-h-11 items-center text-xs font-semibold text-accent">{t("View all games")}<ForwardArrow /></Link></div>
        {recent.length > 0 && <div className="mb-3 flex items-center justify-between gap-2 border-b border-line pb-4"><span className="text-xs text-muted">{t("Last 5")}</span><div className="flex gap-1.5" dir="ltr">{recent.slice(0, 5).reverse().map(item => <span key={item.id} title={`${teamName(item.opponent_name)}: ${item.team_score}-${item.opponent_score}`} aria-label={t(resultKey(resultOf(item)))} className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white ${resultClass(resultOf(item))}`}>{resultOf(item)}</span>)}</div></div>}
        <div className="text-[10px] text-end text-muted">{t("Afeka College – opponent")}</div>
        <ul className="divide-y divide-line">{recent.slice(0, 5).map(item => <li key={item.id}><GameSummaryLink game={item} className="flex min-w-0 items-center justify-between gap-3 rounded-xl py-3 transition hover:bg-raised">
          <div className="flex min-w-0 items-center gap-2"><TeamLogo name={item.opponent_name} className="h-8 w-8" /><div className="min-w-0"><div className="break-words text-sm font-semibold">{teamName(item.opponent_name)}</div><div className="mt-1 text-[11px] text-muted">{formatGameRound(item, t)}</div><div className="mt-0.5 text-[11px] text-muted">{date(item.game_date_epoch)}</div></div></div>
          <div className="shrink-0 text-end"><div dir="ltr" className="whitespace-nowrap text-sm font-bold tabular-nums">{item.team_score}–{item.opponent_score}</div><span className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${resultClass(resultOf(item))}`}>{resultOf(item)}</span></div>
        </GameSummaryLink></li>)}</ul>
        {history.isPending && <p role="status" className="py-4 text-sm text-muted">{t("Loading...")}</p>}
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-4"><Link to="/season" className="flex min-h-11 items-center justify-center rounded-xl bg-raised px-2 text-center text-xs font-semibold">{t("Season Stats")}</Link><Link to="/players" className="flex min-h-11 items-center justify-center rounded-xl bg-raised px-2 text-center text-xs font-semibold">{t("Players")}</Link></div>
      </section>
    </div>
  </section>;
}

function TeamOverview({ games }) {
  const { t } = usePreferences();
  const wins = games?.filter(game => resultOf(game) === "W").length;
  const losses = games?.filter(game => resultOf(game) === "L").length;
  const draws = games?.filter(game => resultOf(game) === "D").length;
  const average = key => games?.length ? (games.reduce((sum, game) => sum + Number(game[key] ?? 0), 0) / games.length).toFixed(1) : "—";
  const stats = [["Record", games ? `${wins}–${losses}${draws ? `–${draws}` : ""}` : "—", draws ? "Wins / losses / draws" : "Wins / losses"], ["Win rate", games?.length ? `${Math.round(wins / games.length * 100)}%` : "—", "Completed games"], ["Points per game", average("team_score"), "Afeka"], ["Points allowed", average("opponent_score"), "Per game"]];
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([label, value, caption]) => <div key={label} className="rounded-2xl border border-line bg-surface px-4 py-4 sm:px-5"><div className="text-xs text-muted">{t(label)}</div><div dir="ltr" className="mt-2 w-fit text-3xl font-bold tracking-tight text-ink">{value}</div><div className="mt-1 text-[11px] text-muted">{t(caption)}</div></div>)}</div>;
}

function ScoreTeam({ team, winner }) {
  const { teamName } = usePreferences();
  return <div className="flex min-w-0 flex-col items-center gap-3 text-center"><TeamLogo name={team.name} className="h-14 w-14 sm:h-20 sm:w-20" /><div className={winner ? "font-bold text-ink" : "font-medium text-muted"}>{teamName(team.name)}</div></div>;
}

function ForwardArrow() {
  return <svg className="ms-1 h-4 w-4 shrink-0 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" /></svg>;
}
