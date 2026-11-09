import { shootingStats, shootingValue } from "../utils/playerShooting";
import { periodLabel } from "../utils/playByPlay";
import { formatPlusMinus } from "../utils/plusMinus";
import { useMinutes } from "../timing/context";
import { formatMinutes } from "../utils/playingTime";
import { formatGameRound, isPlayoffGame } from "../utils/gameRound";
import ShotMap from "./ShotMap";
import { usePreferences } from "../preferences/context";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGames } from "../api/gamesApi";
import Dialog from "./Dialog";
import TeamLogo from "./TeamLogo";
import PlayerAvatar from "./PlayerAvatar";

const countingStats = [
  ["Points", "points"], ["Rebounds", "rebounds"],
  ["Defensive Rebounds", "defensive_rebounds"], ["Offensive Rebounds", "offensive_rebounds"],
  ["Assists", "assists"], ["Steals", "steals"], ["Blocks", "blocks"], ["Turnovers", "turnovers"],
];
const count = value => Number(value ?? 0);
const logStats = [["PTS", "points", "Points"], ["REB", "rebounds", "Rebounds"], ["AST", "assists", "Assists"], ["STL", "steals", "Steals"], ["BLK", "blocks", "Blocks"], ["TOV", "turnovers", "Turnovers"]];
const gameStats = game => game.fouls == null ? countingStats : [...countingStats, ["Fouls", "fouls"]];

export default function PlayerGameLog({ games, playerId, player, playerName }) {
  const { t, teamName, language } = usePreferences();
  const timing = useMinutes();
  const [selectedId, setSelectedId] = useState(null);
  // Player game records contain individual stats; the completed-games cache supplies team results.
  const results = useQuery({ queryKey: ["games"], queryFn: getGames, enabled: games.length > 0 });
  const resultById = new Map((results.data ?? []).map(game => [String(game.id), game]));
  const rows = games.map(game => {
    const result = resultById.get(String(game.game_id));
    const detail = timing.games[String(game.game_id)];
    const player = detail?.players?.find(row => String(row.player_id) === String(playerId));
    return { ...result, ...game, seconds: detail?.seconds[String(playerId)], plusMinus: detail?.plusMinus?.[String(playerId)], fouls: game.fouls ?? player?.fouls, team_score: game.team_score ?? result?.team_score, opponent_score: game.opponent_score ?? result?.opponent_score, is_playoff: game.is_playoff ?? result?.is_playoff, playoff_stage: game.playoff_stage ?? result?.playoff_stage, playoff_game_number: game.playoff_game_number ?? result?.playoff_game_number };
  });
  const selectedGame = rows.find(game => String(game.game_id) === selectedId);
  return <section aria-label={t("Game log")}>
    <h2 className="mb-3 text-xl font-bold">{t("Games")}</h2>
    {results.isError && <p className="mb-3 text-sm text-muted" role="status">{t("Game results could not be loaded.")} <button type="button" className="underline" onClick={() => results.refetch()}>{t("Retry")}</button></p>}
    {games.length === 0 ? <p className="text-muted">{t("No games played yet.")}</p> : <div className="player-log-container rounded-2xl border border-line bg-surface" role="region" aria-label={t("Game log")} tabIndex={0}>
      <table className="player-log-table">
        <thead><tr>
          <th scope="col" className="player-log-extra">{t("Date")}</th><th scope="col">{t("Opponent")}</th><th scope="col">{t("Result")}</th>
          <th scope="col" className="player-log-extra">{t("MIN")}</th>
          {logStats.map(([label, , full], index) => <th key={label} scope="col" className={index > 2 ? "player-log-extra" : undefined} title={t(full)}>{t(label)}</th>)}
          {['FG', '2PT', '3PT', 'FT'].map(label => <th scope="col" className="player-log-extra" key={label}>{t(label)}</th>)}
          <th scope="col" title={t("+/-")}><span dir="ltr">+/-</span></th>
          {rows.some(game => game.fouls != null) && <th scope="col" className="player-log-extra">{t("Fouls")}</th>}
        </tr></thead>
        <tbody>{rows.map(game => {
          const date = Number(game.game_date_epoch);
          const hasDate = Number.isFinite(date) && date > 0;
          const shots = shootingStats(game);
          const valid = [game.team_score, game.opponent_score].every(value => value != null && value !== '' && Number.isFinite(Number(value)));
          const result = valid ? Number(game.team_score) > Number(game.opponent_score) ? 'W' : Number(game.team_score) < Number(game.opponent_score) ? 'L' : 'D' : null;
          return <tr key={game.game_id} onClick={() => setSelectedId(String(game.game_id))}>
            <td className="player-log-date"><span dir="ltr" title={hasDate ? new Date(date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-GB') : undefined}>{hasDate ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) : '—'}</span><span className="ms-2 text-muted" title={t(game.is_home_game === false ? 'Away game' : game.is_home_game === true ? 'Home game' : 'Round')}>{game.is_home_game === false ? '@' : game.is_home_game === true ? t('vs') : ''}</span></td>
            <th scope="row" className="player-log-opponent"><button type="button" aria-haspopup="dialog" onClick={event => { event.stopPropagation(); setSelectedId(String(game.game_id)); }} aria-label={`${t('vs')} ${teamName(game.opponent_name)}`}><TeamLogo name={game.opponent_name} className="h-8 w-8" /><span>{teamName(game.opponent_name)}{isPlayoffGame(game) && <span className="mt-1 block text-xs font-normal text-muted">{formatGameRound(game, t)}</span>}</span></button></th>
            <td className="player-log-result-cell">{result ? <span dir="ltr" aria-label={t(result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw')} className={`player-log-result ${result === 'W' ? 'bg-success' : result === 'L' ? 'bg-danger' : 'bg-muted'}`} title={`${teamName('Afeka')} – ${teamName(game.opponent_name)}`}>{result} {game.team_score}-{game.opponent_score}</span> : <span className="text-muted" title={t(results.isPending ? 'Loading result...' : 'Result unavailable')}>—</span>}</td>
            <td className="player-log-extra" data-label={t("Minutes")}><span dir="ltr">{formatMinutes(game.seconds)}</span></td>
            {logStats.map(([label, key, full], index) => <td key={key} className={index > 2 ? "player-log-extra" : undefined} data-label={t(full)} data-compact-label={t(label)}><span dir="ltr">{count(game[key])}</span></td>)}
            {shots.map(([label, made, attempts]) => <td className="player-log-shooting" data-label={t(label)} key={label}><span dir="ltr">{shootingValue(made, attempts)}</span></td>)}
            <td data-label={t("+/-")} data-compact-label="+/-"><span dir="ltr">{formatPlusMinus(game.plusMinus)}</span></td>
            {rows.some(row => row.fouls != null) && <td className="player-log-extra" data-label={t("Fouls")}><span dir="ltr">{game.fouls == null ? '—' : count(game.fouls)}</span></td>}
          </tr>;
        })}</tbody>
      </table>
    </div>
}
    {selectedGame && <PlayerGameDialog key={selectedId} game={selectedGame} player={player} playerName={playerName} loading={results.isPending} onClose={() => setSelectedId(null)} />}
  </section>;
}

function GameHeading({ game, player, playerName, loading = false }) {
  const { t, teamName, language, playerName: displayPlayerName } = usePreferences();
  const valid = [game.team_score, game.opponent_score].every(value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)));
  const result = valid ? Number(game.team_score) > Number(game.opponent_score) ? "W" : Number(game.team_score) < Number(game.opponent_score) ? "L" : "D" : null;
  const date = Number(game.game_date_epoch);
  return <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex min-w-0 items-center gap-3">
      <PlayerAvatar player={player ?? { name: playerName }} className="h-12 w-12" />
      <div className="min-w-0">
        <div className="break-words font-bold text-ink">{displayPlayerName(playerName)}</div>
        <div className="break-words text-sm">{t("vs")} {teamName(game.opponent_name)}</div>
        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
          <span>{formatGameRound(game, t)}</span>
          {Number.isFinite(date) && date > 0 && <span>{new Date(date).toLocaleDateString(language === "he" ? "he-IL" : "en-GB")}</span>}
          {typeof game.is_home_game === "boolean" && <span>{t(game.is_home_game ? "Home game" : "Away game")}</span>}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      {valid ? <div className="text-end">
        <div dir="ltr" className="text-lg font-bold tabular-nums">{game.team_score} – {game.opponent_score}</div>
        <div className="text-xs text-muted">{teamName("Afeka")} – {teamName(game.opponent_name)}</div>
      </div> : <span className="text-xs text-muted">{t(loading ? "Loading result..." : "Result unavailable")}</span>}
      {result && <span aria-label={t(result === "W" ? "Win" : result === "L" ? "Loss" : "Draw")} className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${result === "W" ? "bg-success" : result === "L" ? "bg-danger" : "bg-muted"}`}>{result}</span>}
    </div>
  </div>;
}

export function PlayerGameDialog({ game, player, playerName, loading = false, onClose }) {
  const { t, teamName } = usePreferences();
  const [period, setPeriod] = useState("all");
  const periods = (game.periods ?? []).filter(row => Number.isInteger(Number(row.period)) && Number(row.period) > 0)
    .toSorted((a, b) => Number(a.period) - Number(b.period));
  const selected = periods.find(row => String(row.period) === String(period));
  const visibleGame = selected ?? game;

  return <Dialog centered title={`${t("vs")} ${teamName(game.opponent_name)}`} onClose={onClose}>
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t("Game performance")}</h2>
        <button type="button" onClick={onClose} className="shrink-0 rounded-full bg-raised px-4 py-2 text-sm">{t("Close")}</button>
      </div>
      <GameHeading game={game} player={player} playerName={playerName} loading={loading} />
      {periods.length > 0 && <div className="mt-4 flex flex-wrap gap-1" role="group" aria-label={t("Filter by period")}>
        {["all", ...periods.map(row => String(row.period))].map(value => <button type="button" key={value}
          aria-pressed={value === (selected ? String(period) : "all")} onClick={() => setPeriod(value)}
          className={`min-h-11 border-b-2 px-3 text-sm font-semibold ${value === (selected ? String(period) : "all") ? "border-accent text-accent" : "border-transparent text-muted"}`}>
          {value === "all" ? t("All periods") : t(periodLabel(Number(value), Number(game.quarters_count) || 4))}
        </button>)}
      </div>}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl bg-raised p-4 md:order-2">
          <h3 className="mb-3 font-bold">{t("Shot map")}</h3>
          <ShotMap shots={visibleGame.shots ?? []} />
        </section>
        <div className="space-y-4">
          <section className="rounded-2xl bg-raised p-4">
            <h3 className="mb-3 font-bold">{t("Player statistics")}</h3>
            <dl className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-sm"><dt>{t("Minutes")}</dt><dd dir="ltr" className="shrink-0 font-bold tabular-nums">{formatMinutes(visibleGame.seconds)}</dd></div>
              {gameStats(visibleGame).map(([label, key]) => <div key={key} className="flex items-center justify-between gap-2 text-sm"><dt>{t(label)}</dt><dd dir="ltr" className="shrink-0 font-bold tabular-nums">{count(visibleGame[key])}</dd></div>)}
              <div className="flex items-center justify-between gap-2 text-sm"><dt dir="ltr">{t("+/-")}</dt><dd dir="ltr" className="shrink-0 font-bold tabular-nums">{formatPlusMinus(visibleGame.plusMinus)}</dd></div>
            </dl>
          </section>
          <section className="rounded-2xl bg-raised p-4">
            <h3 className="mb-3 font-bold">{t("Shooting")}</h3>
            <dl className="space-y-3">
              {shootingStats(visibleGame).map(([label, made, attempts]) => <div key={label} className="flex items-center justify-between gap-2 text-sm"><dt>{t(label)}</dt><dd dir="ltr" className="shrink-0 font-bold tabular-nums">{shootingValue(made, attempts)}</dd></div>)}
            </dl>
          </section>
        </div>
      </div>
    </div>
  </Dialog>;
}

