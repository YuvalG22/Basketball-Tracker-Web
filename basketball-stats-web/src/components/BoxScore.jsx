import { useQueries } from "@tanstack/react-query";
import { useState } from "react";
import { getPlayerDetails } from "../api/playersApi";
import { usePreferences } from "../preferences/context";
import { calculatePlayingTime, formatMinutes } from "../utils/playingTime";
import { calculatePlusMinus, formatPlusMinus } from "../utils/plusMinus";
import PlayerAvatar from "./PlayerAvatar";
import { PlayerGameDialog } from "./PlayerGameLog";
const columns = [["MIN", "seconds"], ["PTS", "points"], ["REB", "rebounds"], ["AST", "assists"], ["DREB", "defensive_rebounds"], ["OREB", "offensive_rebounds"], ["STL", "steals"], ["BLK", "blocks"], ["FG", "fg"], ["3PT", "three_made"], ["FT", "ft_made"], ["TO", "turnovers"], ["PF", "fouls"], ["+/-", "plusMinus"]];
const shootingColumns = new Set(["fg", "three_made", "ft_made"]);
const shot = (made, miss) => `${Number(made ?? 0)}/${Number(made ?? 0) + Number(miss ?? 0)}`;
export default function BoxScore({ game, players, events, lineupEvents }) {
  const { t, playerName } = usePreferences();
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
  return <div className="min-w-0 rounded-[20px] bg-surface">
    <div className="flex items-center justify-between p-3"><h2 className="text-xl font-bold">{t("Box Score")}</h2><span className="text-sm text-muted">{players.length} {t("players")}</span></div>
    <div className="overflow-x-auto" role="region" aria-label={t("Player box score, scroll for more statistics")} tabIndex={0}>
      <table className="w-full min-w-[56.5rem] table-fixed border-collapse text-xs">
        <colgroup>
          <col className="w-40" />
          {columns.map(([, key]) => <col key={key} className={shootingColumns.has(key) ? "w-18" : "w-12"} />)}
        </colgroup>
        <thead><tr className="border-b border-line text-muted">
          <th scope="col" className="sticky start-0 bg-surface px-3 py-2 text-start font-semibold">{t("Player")}</th>
          {columns.map(([label, key]) => <th key={key} scope="col" dir={key === "plusMinus" ? "ltr" : undefined} className={`break-words px-2 py-2 text-center ${key === "points" ? "box-score-points font-extrabold" : "font-semibold"}`}>{t(label)}</th>)}
        </tr></thead>
        {groups.map(([label, group]) => <tbody key={label ?? "players"}>
          {label && <tr className="border-b border-line bg-raised"><th scope="rowgroup" colSpan={columns.length + 1} className="px-3 py-1 text-start font-semibold">{t(label)}</th></tr>}
          {group.map(player => <tr key={player.player_id} onClick={() => setSelectedId(String(player.player_id))} className="group cursor-pointer border-b border-line hover:bg-raised focus-within:bg-raised last:border-b-0">
            <td className="sticky start-0 bg-surface px-2 py-1 group-hover:bg-raised group-focus-within:bg-raised"><button type="button" aria-haspopup="dialog" onClick={event => { event.stopPropagation(); setSelectedId(String(player.player_id)); }} className="flex w-36 items-center gap-2 rounded-lg text-start focus-visible:outline-2 focus-visible:outline-accent"><PlayerAvatar player={player} className="h-8 w-8" /><span className="min-w-0"><span className="block truncate text-sm font-bold text-ink">{playerName(player.player_name)}</span><span className="text-xs text-muted">#{player.player_number ?? "-"}</span></span></button></td>
            {columns.map(([, key]) => <td key={key} dir="ltr" className={`px-2 py-1 text-center text-sm ${key === "points" ? "box-score-points font-extrabold" : ""}`}>{key === "plusMinus" ? formatPlusMinus(player.plusMinus) : key === "seconds" ? formatMinutes(player.seconds) : key === "fg" ? shot(Number(player.two_made ?? 0) + Number(player.three_made ?? 0), Number(player.two_miss ?? 0) + Number(player.three_miss ?? 0)) : key === "three_made" ? shot(player.three_made, player.three_miss) : key === "ft_made" ? shot(player.ft_made, player.ft_miss) : player[key] ?? "—"}</td>)}
          </tr>)}
        </tbody>)}
      </table>
    </div>
    {selectedPlayer && <PlayerGameDialog key={selectedId} game={{ ...game, ...selectedPlayer, game_id: game.id }} player={selectedPlayer} playerName={selectedPlayer.player_name} onClose={() => setSelectedId(null)} />}
  </div>;
}
