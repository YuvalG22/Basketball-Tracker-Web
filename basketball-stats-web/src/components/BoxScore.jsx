import { useQueries } from "@tanstack/react-query";
import { useState } from "react";
import { getPlayerDetails } from "../api/playersApi";
import { usePreferences } from "../preferences/context";
import { calculatePlayingTime, formatMinutes } from "../utils/playingTime";
import { calculatePlusMinus, formatPlusMinus } from "../utils/plusMinus";
import { PlayerGameDialog } from "./PlayerGameLog";
const columns = [["MIN", "seconds"], ["PTS", "points"], ["REB", "rebounds"], ["AST", "assists"], ["STL", "steals"], ["BLK", "blocks"], ["FG", "fg"], ["Threes", "three_made"], ["FT", "ft_made"], ["TO", "turnovers"], ["PF", "fouls"], ["+/-", "plusMinus"]];
const shot = (made, miss) => `${Number(made ?? 0)}/${Number(made ?? 0) + Number(miss ?? 0)}`;
const statValue = (player, key) => key === "plusMinus" ? formatPlusMinus(player.plusMinus) : key === "seconds" ? formatMinutes(player.seconds) : key === "fg" ? shot(Number(player.two_made ?? 0) + Number(player.three_made ?? 0), Number(player.two_miss ?? 0) + Number(player.three_miss ?? 0)) : key === "three_made" ? shot(player.three_made, player.three_miss) : key === "ft_made" ? shot(player.ft_made, player.ft_miss) : player[key] ?? "—";
const sum = (rows, key) => rows.length && rows.every(row => row[key] != null && Number.isFinite(Number(row[key]))) ? rows.reduce((total, row) => total + Number(row[key]), 0) : undefined;
export default function BoxScore({ game, players, events, lineupEvents }) {
  const { t, playerName, language } = usePreferences();
  const [selectedId, setSelectedId] = useState(null);
  const histories = useQueries({ queries: players.map(player => ({ queryKey: ["player-details", String(player.player_id)], queryFn: () => getPlayerDetails(player.player_id), enabled: player.defensive_rebounds == null || player.offensive_rebounds == null || String(player.player_id) === selectedId })) });
  const timing = calculatePlayingTime({ game, players, events, lineupEvents });
  const plusMinus = calculatePlusMinus({ game, players, events, lineupEvents });
  const rows = players.map((player, index) => {
    const history = histories[index].data?.games?.find(row => String(row.game_id) === String(game.id));
    return { ...player, shots: history?.shots ?? [], periods: history?.periods ?? [], plusMinus: plusMinus[String(player.player_id)], defensive_rebounds: player.defensive_rebounds ?? history?.defensive_rebounds, offensive_rebounds: player.offensive_rebounds ?? history?.offensive_rebounds, seconds: timing.seconds[String(player.player_id)], fg: Number(player.two_made ?? 0) + Number(player.three_made ?? 0) };
  });
  const selectedPlayer = rows.find(player => String(player.player_id) === selectedId);
  const starters = new Set(timing.starters ?? []);
  const groups = timing.starters ? [[null, rows.filter(row => starters.has(String(row.player_id)))], ["Bench", rows.filter(row => !starters.has(String(row.player_id)))]] : [[null, rows]];
  const totals = Object.fromEntries([...columns.map(([, key]) => key), "two_made", "two_miss", "three_miss", "ft_miss"].map(key => [key, sum(rows, key)]));
  for (const key of ["two_made", "two_miss", "three_made", "three_miss", "ft_made", "ft_miss"]) totals[key] = rows.reduce((total, row) => total + Number(row[key] ?? 0), 0);
  // Team +/- is the score difference, rather than the sum of player stints.
  totals.plusMinus = [game.team_score, game.opponent_score].every(score => score != null && score !== "" && Number.isFinite(Number(score))) ? Number(game.team_score) - Number(game.opponent_score) : undefined;
  return <div dir={language === "he" ? "rtl" : "ltr"} className="min-w-0 rounded-[20px] bg-surface">
    <div className="p-3"><h2 className="text-xl font-bold">{t("Box Score")}</h2></div>
    <div className="overflow-x-auto" role="region" aria-label={t("Player box score, scroll for more statistics")} tabIndex={0}>
      <table dir={language === "he" ? "rtl" : "ltr"} className="w-full min-w-[60rem] table-fixed border-collapse text-[15px] xl:min-w-[54rem]">
        <colgroup>
          <col className="w-48" />
          {columns.map(([, key]) => <col key={key} className="w-16 xl:w-14" />)}
        </colgroup>
        <thead><tr className="border-b border-line text-muted">
          <th scope="col" className="sticky start-0 bg-surface px-3 py-2 text-start font-bold">{t("Player")}</th>
          {columns.map(([label, key]) => <th key={key} scope="col" dir={key === "plusMinus" ? "ltr" : undefined} className={`whitespace-nowrap px-1 py-2 text-center font-bold ${key === "points" ? "box-score-points" : ""}`}>{t(label)}</th>)}
        </tr></thead>
        {groups.map(([label, group]) => <tbody key={label ?? "players"}>
          {label && <tr className="border-b border-line bg-raised"><th scope="rowgroup" colSpan={columns.length + 1} className="px-3 py-1 text-start font-semibold">{t(label)}</th></tr>}
          {group.map(player => <tr key={player.player_id} onClick={() => setSelectedId(String(player.player_id))} className="group cursor-pointer border-b border-line even:bg-background hover:bg-raised focus-within:bg-raised last:border-b-0">
            <td className="sticky start-0 bg-surface px-3 py-1 group-even:bg-background group-hover:bg-raised group-focus-within:bg-raised"><button type="button" dir={language === "he" ? "rtl" : "ltr"} aria-haspopup="dialog" onClick={event => { event.stopPropagation(); setSelectedId(String(player.player_id)); }} className="flex min-h-7 w-full items-center gap-2 rounded-lg text-start focus-visible:outline-2 focus-visible:outline-accent"><span dir="ltr" className={`w-6 shrink-0 text-muted ${language === "he" ? "text-right" : "text-left"}`}>{player.player_number ?? "—"}</span><bdi className="min-w-0 truncate font-bold text-ink">{playerName(player.player_name)}</bdi></button></td>
            {columns.map(([, key]) => <td key={key} dir="ltr" className={`whitespace-nowrap px-1 py-1 text-center tabular-nums ${key === "points" ? "box-score-points font-extrabold" : ""}`}>{statValue(player, key)}</td>)}
          </tr>)}
        </tbody>)}
        <tfoot><tr className="border-t-2 border-line bg-raised font-bold">
          <th scope="row" className="sticky start-0 bg-raised px-3 py-2 text-start font-bold">{t("Totals")}</th>
          {columns.map(([, key]) => <td key={key} dir="ltr" className={`whitespace-nowrap px-1 py-2 text-center font-bold tabular-nums ${key === "points" ? "box-score-points" : ""}`}>{statValue(totals, key)}</td>)}
        </tr></tfoot>
      </table>
    </div>
    {selectedPlayer && <PlayerGameDialog key={selectedId} game={{ ...game, ...selectedPlayer, game_id: game.id }} player={selectedPlayer} playerName={selectedPlayer.player_name} onClose={() => setSelectedId(null)} />}
  </div>;
}
