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

const countingStats = [
  ["Points", "points"], ["Rebounds", "rebounds"],
  ["Defensive Rebounds", "defensive_rebounds"], ["Offensive Rebounds", "offensive_rebounds"],
  ["Assists", "assists"], ["Steals", "steals"], ["Blocks", "blocks"], ["Turnovers", "turnovers"],
];
const count = value => Number(value ?? 0);
const logStats = [["PTS", "points", "Points"], ["REB", "rebounds", "Rebounds"], ["AST", "assists", "Assists"], ["STL", "steals", "Steals"], ["BLK", "blocks", "Blocks"], ["TOV", "turnovers", "Turnovers"]];
const gameStats = game => game.fouls == null ? countingStats : [...countingStats, ["Fouls", "fouls"]];

function shootingStats(game) {
  const two = count(game.two_made), three = count(game.three_made), ft = count(game.ft_made);
  const twoA = two + count(game.two_miss), threeA = three + count(game.three_miss), ftA = ft + count(game.ft_miss);
  return [["Field goals", two + three, twoA + threeA], ["2 pointers", two, twoA], ["3 pointers", three, threeA], ["Free throws", ft, ftA]];
}

function shootingValue(made, attempts) {
  return `${made}/${attempts} (${attempts ? Math.round(made / attempts * 100) : 0}%)`;
}

export default function PlayerGameLog({ games, playerId }) {
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
    return { ...result, ...game, seconds: detail?.seconds[String(playerId)], fouls: game.fouls ?? player?.fouls, team_score: game.team_score ?? result?.team_score, opponent_score: game.opponent_score ?? result?.opponent_score, is_playoff: game.is_playoff ?? result?.is_playoff, playoff_stage: game.playoff_stage ?? result?.playoff_stage, playoff_game_number: game.playoff_game_number ?? result?.playoff_game_number };
  });
  const selectedGame = rows.find(game => String(game.game_id) === selectedId);
  return <section aria-label={t("Game log")}>
    <h2 className="mb-3 text-xl font-bold">{t("Games")}</h2>
    {results.isError && <p className="mb-3 text-sm text-muted" role="status">{t("Game results could not be loaded.")} <button type="button" className="underline" onClick={() => results.refetch()}>{t("Retry")}</button></p>}
    {games.length === 0 ? <p className="text-muted">{t("No games played yet.")}</p> : <div className="player-log-container rounded-2xl border border-line bg-surface" role="region" aria-label={t("Game log")} tabIndex={0}>
      <table className="player-log-table">
        <thead><tr>
          <th scope="col">{t("Date")}</th><th scope="col">{t("Opponent")}</th><th scope="col">{t("Result")}</th>
          <th scope="col">{t("MIN")}</th>
          {logStats.map(([label, , full]) => <th key={label} scope="col" title={t(full)}>{t(label)}</th>)}
          {['FG', '2PT', '3PT', 'FT'].map(label => <th scope="col" key={label}>{t(label)}</th>)}
          {rows.some(game => game.fouls != null) && <th scope="col">{t("Fouls")}</th>}
        </tr></thead>
        <tbody>{rows.map(game => {
          const date = Number(game.game_date_epoch);
          const hasDate = Number.isFinite(date) && date > 0;
          const shots = shootingStats(game);
          const valid = [game.team_score, game.opponent_score].every(value => value != null && value !== '' && Number.isFinite(Number(value)));
          const result = valid ? Number(game.team_score) > Number(game.opponent_score) ? 'W' : Number(game.team_score) < Number(game.opponent_score) ? 'L' : 'D' : null;
          return <tr key={game.game_id} onClick={() => setSelectedId(String(game.game_id))}>
            <td className="player-log-date"><span dir="ltr" title={hasDate ? new Date(date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-GB') : undefined}>{hasDate ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) : '—'}</span><span className="ms-2 text-muted" title={t(game.is_home_game === false ? 'Away game' : game.is_home_game === true ? 'Home game' : 'Round')}>{game.is_home_game === false ? '@' : game.is_home_game === true ? t('vs') : ''}</span></td>
            <th scope="row" className="player-log-opponent"><button type="button" aria-haspopup="dialog" onClick={event => { event.stopPropagation(); setSelectedId(String(game.game_id)); }} aria-label={`${t('vs')} ${teamName(game.opponent_name)}`}><TeamLogo name={game.opponent_name} className="h-8 w-12" /><span>{teamName(game.opponent_name)}{isPlayoffGame(game) && <span className="mt-1 block text-xs font-normal text-muted">{formatGameRound(game, t)}</span>}</span></button></th>
            <td className="player-log-result-cell">{result ? <span dir="ltr" aria-label={t(result === 'W' ? 'Win' : result === 'L' ? 'Loss' : 'Draw')} className={`player-log-result ${result === 'W' ? 'bg-success' : result === 'L' ? 'bg-danger' : 'bg-muted'}`} title={t('Afeka – opponent')}>{result} {game.team_score}-{game.opponent_score}</span> : <span className="text-muted" title={t(results.isPending ? 'Loading result...' : 'Result unavailable')}>—</span>}</td>
            <td data-label={t("Minutes")}><span dir="ltr">{formatMinutes(game.seconds)}</span></td>
            {logStats.map(([, key]) => <td key={key} data-label={t(logStats.find(stat => stat[1] === key)[2])}><span dir="ltr">{count(game[key])}</span></td>)}
            {shots.map(([label, made, attempts]) => <td className="player-log-shooting" data-label={t(label)} key={label}><span dir="ltr">{shootingValue(made, attempts)}</span></td>)}
            {rows.some(row => row.fouls != null) && <td data-label={t("Fouls")}><span dir="ltr">{game.fouls == null ? '—' : count(game.fouls)}</span></td>}
          </tr>;
        })}</tbody>
      </table>
    </div>
}
    {selectedGame && <PlayerGameDialog key={selectedId} game={selectedGame} loading={results.isPending} onClose={() => setSelectedId(null)} />}
  </section>;
}

function GameHeading({ game, loading = false }) {
  const { t, teamName, language } = usePreferences();
  const valid = [game.team_score, game.opponent_score].every(value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)));
  const result = valid ? Number(game.team_score) > Number(game.opponent_score) ? "W" : Number(game.team_score) < Number(game.opponent_score) ? "L" : "D" : null;
  const date = Number(game.game_date_epoch);
  return <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex min-w-0 items-center gap-3">
      <TeamLogo name={game.opponent_name} className="h-12 w-20" />
      <div className="min-w-0">
        <div className="break-words font-bold text-ink">{t("vs")} {teamName(game.opponent_name)}</div>
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
        <div className="text-xs text-muted">{t("Afeka – opponent")}</div>
      </div> : <span className="text-xs text-muted">{t(loading ? "Loading result..." : "Result unavailable")}</span>}
      {result && <span aria-label={t(result === "W" ? "Win" : result === "L" ? "Loss" : "Draw")} className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${result === "W" ? "bg-success" : result === "L" ? "bg-danger" : "bg-muted"}`}>{result}</span>}
    </div>
  </div>;
}

export function PlayerGameDialog({ game, loading = false, onClose }) {
  const { t, teamName } = usePreferences();
  return <Dialog centered title={`${t("vs")} ${teamName(game.opponent_name)}`} onClose={onClose}>
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t("Game performance")}</h2>
        <button type="button" onClick={onClose} className="shrink-0 rounded-full bg-raised px-4 py-2 text-sm">{t("Close")}</button>
      </div>
      <GameHeading game={game} loading={loading} />
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <section className="rounded-2xl bg-raised p-4">
            <h3 className="mb-3 font-bold">{t("Player statistics")}</h3>
            <dl className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-sm"><dt>{t("Minutes")}</dt><dd dir="ltr" className="shrink-0 font-bold tabular-nums">{formatMinutes(game.seconds)}</dd></div>
              {gameStats(game).map(([label, key]) => <div key={key} className="flex items-center justify-between gap-2 text-sm"><dt>{t(label)}</dt><dd dir="ltr" className="shrink-0 font-bold tabular-nums">{count(game[key])}</dd></div>)}
            </dl>
          </section>
          <section className="rounded-2xl bg-raised p-4">
            <h3 className="mb-3 font-bold">{t("Shooting")}</h3>
            <dl className="space-y-3">
              {shootingStats(game).map(([label, made, attempts]) => <div key={label} className="flex items-center justify-between gap-2 text-sm"><dt>{t(label)}</dt><dd dir="ltr" className="shrink-0 font-bold tabular-nums">{shootingValue(made, attempts)}</dd></div>)}
            </dl>
          </section>
        </div>
        <section className="rounded-2xl bg-raised p-4">
          <h3 className="mb-3 font-bold">{t("Shot map")}</h3>
          <ShotMap shots={game.shots ?? []} />
        </section>
      </div>
    </div>
  </Dialog>;
}

