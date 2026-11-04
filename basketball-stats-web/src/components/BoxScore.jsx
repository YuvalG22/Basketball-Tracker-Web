import { useQueries } from "@tanstack/react-query";
import { getPlayerDetails } from "../api/playersApi";
import { usePreferences } from "../preferences/context";
import { calculatePlayingTime, formatMinutes } from "../utils/playingTime";
import { calculatePlusMinus, formatPlusMinus } from "../utils/plusMinus";
import PlayerAvatar from "./PlayerAvatar";
const columns = [["MIN", "seconds"], ["PTS", "points"], ["AST", "assists"], ["DREB", "defensive_rebounds"], ["OREB", "offensive_rebounds"], ["STL", "steals"], ["BLK", "blocks"], ["FG", "fg"], ["3PT", "three_made"], ["FT", "ft_made"], ["TO", "turnovers"], ["PF", "fouls"], ["+/-", "plusMinus"]];
const shot = (made, miss) => `${Number(made ?? 0)}/${Number(made ?? 0) + Number(miss ?? 0)}`;
export default function BoxScore({ game, players, events, lineupEvents }) {
  const { t } = usePreferences();
  const histories = useQueries({ queries: players.map(player => ({ queryKey: ["player-details", String(player.player_id)], queryFn: () => getPlayerDetails(player.player_id), enabled: player.defensive_rebounds == null || player.offensive_rebounds == null })) });
  const timing = calculatePlayingTime({ game, players, events, lineupEvents });
  const plusMinus = calculatePlusMinus({ players, events, lineupEvents });
  const rows = players.map((player, index) => {
    const history = histories[index].data?.games?.find(row => String(row.game_id) === String(game.id));
    return { ...player, plusMinus: plusMinus[String(player.player_id)], defensive_rebounds: player.defensive_rebounds ?? history?.defensive_rebounds, offensive_rebounds: player.offensive_rebounds ?? history?.offensive_rebounds, seconds: timing.seconds[String(player.player_id)], fg: Number(player.two_made ?? 0) + Number(player.three_made ?? 0) };
  });
  const starters = new Set(timing.starters ?? []);
  const groups = timing.starters ? [[null, rows.filter(row => starters.has(String(row.player_id)))], ["Bench", rows.filter(row => !starters.has(String(row.player_id)))]] : [[null, rows]];
  return <div className="min-w-0 rounded-[20px] bg-surface">
    <div className="flex items-center justify-between p-3"><h2 className="text-xl font-bold">{t("Box Score")}</h2><span className="text-sm text-muted">{players.length} {t("players")}</span></div>
    <div className="overflow-x-auto" role="region" aria-label={t("Player box score, scroll for more statistics")} tabIndex={0}>
      <table className="w-full min-w-155 border-collapse text-xs">
        <thead><tr className="border-b border-line text-muted">
          <th scope="col" className="sticky start-0 bg-surface px-3 py-3 text-start font-semibold">{t("Player")}</th>
          {columns.map(([label, key]) => <th key={key} scope="col" className="px-2 py-3 text-center font-semibold">{t(label)}</th>)}
        </tr></thead>
        {groups.map(([label, group]) => <tbody key={label ?? "players"}>
          {label && <tr className="border-b border-line bg-raised"><th scope="rowgroup" colSpan={columns.length + 1} className="px-3 py-2 text-start font-semibold">{t(label)}</th></tr>}
          {group.map(player => <tr key={player.player_id} className="border-b border-line last:border-b-0">
            <td className="sticky start-0 bg-surface px-2 py-3"><div className="flex w-36 items-center gap-2"><PlayerAvatar player={player} className="h-9 w-9" /><div className="min-w-0"><div className="truncate text-sm font-bold text-ink">{player.player_name}</div><span className="text-xs text-muted">#{player.player_number ?? "-"}</span></div></div></td>
            {columns.map(([, key]) => <td key={key} dir="ltr" className="px-2 py-3 text-center text-sm">{key === "plusMinus" ? formatPlusMinus(player.plusMinus) : key === "seconds" ? formatMinutes(player.seconds) : key === "fg" ? shot(Number(player.two_made ?? 0) + Number(player.three_made ?? 0), Number(player.two_miss ?? 0) + Number(player.three_miss ?? 0)) : key === "three_made" ? shot(player.three_made, player.three_miss) : key === "ft_made" ? shot(player.ft_made, player.ft_miss) : player[key] ?? "—"}</td>)}
          </tr>)}
        </tbody>)}
      </table>
    </div>
  </div>;
}
