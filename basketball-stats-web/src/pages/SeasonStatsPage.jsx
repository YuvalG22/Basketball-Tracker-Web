import { useMinutes } from "../timing/context";
import { formatMinutes } from "../utils/playingTime";
import { formatAveragePlusMinus } from "../utils/plusMinus";
import { usePreferences } from "../preferences/context";
import PlayerAvatar from "../components/PlayerAvatar";
import Dialog from "../components/Dialog";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSeasonStats } from "../api/seasonStatsApi";
function getAverage(player, statKey) {
  const total = Number(player[statKey] ?? 0);
  const gamesPlayed = Number(player.gp ?? 0);
  if (gamesPlayed === 0) return 0;
  return (total / gamesPlayed).toFixed(1);
}
function getPercentage(made, attempts) {
  const m = Number(made ?? 0);
  const a = Number(attempts ?? 0);
  if (!a || a <= 0 || m == 0) {
    return "0%";
  }
  const percentage = m / a * 100;
  if (Number.isNaN(percentage)) {
    return "0%";
  }
  return `${percentage.toFixed(1)}%`;
}
function sortValue(player, stat) {
  if (stat.sortValue) return stat.sortValue(player);
  return stat.customValue ? parseFloat(stat.customValue(player)) : Number(getAverage(player, stat.key));
}
const statCards = [{
  title: "Minutes per game",
  label: "MPG",
  customValue: player => formatMinutes(player.mpgSeconds),
  sortValue: player => player.mpgSeconds ?? -Infinity
}, {
  title: "Points",
  label: "PPG",
  key: "pts"
}, {
  title: "Assists",
  label: "APG",
  key: "ast"
}, {
  title: "Rebounds",
  label: "RPG",
  key: "reb_total"
}, {
  title: "Defensive Rebounds",
  label: "DRPG",
  key: "reb_def"
}, {
  title: "Offensive Rebounds",
  label: "ORPG",
  key: "reb_off"
}, {
  title: "Steals",
  label: "SPG",
  key: "stl"
}, {
  title: "Turnovers",
  label: "TPG",
  key: "tov"
}, {
  title: "Field Goal %",
  label: "FG%",
  customValue: player => getPercentage(player.fgm, player.fga)
}, {
  title: "Three Point %",
  label: "3P%",
  customValue: player => getPercentage(player.threem, player.threea)
}, {
  title: "Free Throw %",
  label: "FT%",
  customValue: player => getPercentage(player.ftm, player.fta)
}, {
  title: "Field Goals",
  label: "FG",
  key: "fgm"
}, {
  title: "Three Pointers",
  label: "3PT",
  key: "threem"
}, {
  title: "Free Throws",
  label: "FT",
  key: "ftm"
}, {
  title: "Plus/minus per game",
  label: "+/-",
  customValue: player => formatAveragePlusMinus(player.plusMinusAverage),
  sortValue: player => player.plusMinusAverage ?? -Infinity
}];
export default function SeasonStatsPage() {
  const {
    t
  } = usePreferences();
  const [selectedStat, setSelectedStat] = useState(null);
  const { averages, plusMinusTotals = {} } = useMinutes();
  const {
    data = [],
    isLoading,
    isError
  } = useQuery({
    queryKey: ["season-stats"],
    queryFn: getSeasonStats
  });
  const players = useMemo(() => data.map(player => {
    const total = plusMinusTotals[String(player.player_id)];
    return { ...player, mpgSeconds: averages[String(player.player_id)],
      plusMinusAverage: total != null && Number(player.gp) > 0 ? total / Number(player.gp) : undefined };
  }), [data, averages, plusMinusTotals]);
  const sortedByStat = useMemo(() => {
    if (!selectedStat) return [];
    return [...players].sort((a, b) => {
      const aValue = sortValue(a, selectedStat);
      const bValue = sortValue(b, selectedStat);
      return bValue - aValue;
    });
  }, [players, selectedStat]);
  if (isLoading) return <p>{t("Loading...")}</p>;
  if (isError) return <p>{t("Unable to load data. Please try again.")}{/* error details are not user-facing */}</p>;
  return <section className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">{t("Season Stats")}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map(stat => <SeasonStatCard key={stat.key ?? stat.label} stat={stat} players={players} onSeeAll={() => setSelectedStat(stat)} />)}
      </div>

      {selectedStat && <StatsBottomSheet stat={selectedStat} players={sortedByStat} onClose={() => setSelectedStat(null)} />}
    </section>;
}
function SeasonStatCard({
  stat,
  players,
  onSeeAll
}) {
  const {
    t
  } = usePreferences();
  const topPlayers = [...players].sort((a, b) => {
    const aValue = sortValue(a, stat);
    const bValue = sortValue(b, stat);
    return bValue - aValue;
  }).slice(0, 3);
  return <div className="rounded-[20px] bg-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{t(stat.title)}</h2>
        </div>

        <button onClick={onSeeAll} className="rounded-full bg-surface px-4 py-2 text-sm font-semibold text-ink">{t("See all")}


        </button>
      </div>

      <div className="space-y-3">
        {topPlayers.map(player => <PlayerStatRow key={player.player_id} player={player} stat={stat} />)}
      </div>
    </div>;
}
function PlayerStatRow({
  player,
  stat
}) {
  const {
    t
  } = usePreferences();
  return <div className="flex items-center justify-between gap-3 rounded-2xl bg-raised p-3">
      <div className="flex min-w-0 items-center gap-3">
        <PlayerAvatar player={player} className="h-10 w-10" />

        <div className="min-w-0">
          <div className="break-words font-semibold">{player.player_name}</div>
          <div className="text-[10px] text-muted">{t("GAMES")}{" "}{player.gp}</div>
        </div>
      </div>

      <div className="shrink-0 text-start">
        <div dir="ltr" className="text-xl font-bold text-accent">
          {stat.customValue ? stat.customValue(player) : getAverage(player, stat.key)}
        </div>

        <div className="text-xs text-end text-muted">{t(stat.label)}</div>
      </div>
    </div>;
}
function StatsBottomSheet({
  stat,
  players,
  onClose
}) {
  const {
    t
  } = usePreferences();
  return <Dialog onClose={onClose} title={t(stat.title)}>

      <div className="flex max-h-[85dvh] flex-col bg-surface p-4">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full text-muted" />

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{t(stat.title)}</h2>
            <p className="text-sm text-muted">{t(stat.label)}</p>
          </div>

          <button onClick={onClose} className="rounded-full bg-surface px-4 py-2 text-sm">{t("Close")}


          </button>
        </div>

        <div className="min-h-0 space-y-3 overflow-y-auto pb-4">
          {players.map(player => <PlayerStatRow key={player.player_id} player={player} stat={stat} />)}
        </div>
      </div>
    </Dialog>;
}
