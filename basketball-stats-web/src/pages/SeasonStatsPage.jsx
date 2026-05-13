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

  const percentage = (m / a) * 100;

  if (Number.isNaN(percentage)) {
    return "0%";
  }

  return `${percentage.toFixed(1)}%`;
}

const statCards = [
  {
    title: "Points",
    label: "PPG",
    key: "pts",
  },
  {
    title: "Assists",
    label: "APG",
    key: "ast",
  },
  {
    title: "Rebounds",
    label: "RPG",
    key: "reb_total",
  },
  {
    title: "Defensive Rebounds",
    label: "DRPG",
    key: "reb_def",
  },
  {
    title: "Offensive Rebounds",
    label: "ORPG",
    key: "reb_off",
  },
  {
    title: "Steals",
    label: "SPG",
    key: "stl",
  },
  {
    title: "Turnovers",
    label: "TPG",
    key: "tov",
  },
  {
    title: "Field Goal %",
    label: "FG%",
    customValue: (player) => getPercentage(player.fgm, player.fga),
  },
  {
    title: "Three Point %",
    label: "3P%",
    customValue: (player) => getPercentage(player.threem, player.threea),
  },
  {
    title: "Free Throw %",
    label: "FT%",
    customValue: (player) => getPercentage(player.ftm, player.fta),
  },
  {
    title: "Field Goals",
    label: "FG",
    key: "fgm",
  },
  {
    title: "Three Pointers",
    label: "3PT",
    key: "threem",
  },
];

export default function SeasonStatsPage() {
  const [selectedStat, setSelectedStat] = useState(null);

  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["season-stats"],
    queryFn: getSeasonStats,
  });

  const sortedByStat = useMemo(() => {
    if (!selectedStat) return [];

    return [...data].sort((a, b) => {
      const aValue = selectedStat.customValue
        ? parseFloat(selectedStat.customValue(a))
        : Number(getAverage(a, selectedStat.key));

      const bValue = selectedStat.customValue
        ? parseFloat(selectedStat.customValue(b))
        : Number(getAverage(b, selectedStat.key));

      return bValue - aValue;
    });
  }, [data, selectedStat]);

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>{error.message}</p>;

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Season Stats</h1>
      </div>

      <div className="space-y-4">
        {statCards.map((stat) => (
          <SeasonStatCard
            key={stat.key ?? stat.label}
            stat={stat}
            players={data}
            onSeeAll={() => setSelectedStat(stat)}
          />
        ))}
      </div>

      {selectedStat && (
        <StatsBottomSheet
          stat={selectedStat}
          players={sortedByStat}
          onClose={() => setSelectedStat(null)}
        />
      )}
    </section>
  );
}

function SeasonStatCard({ stat, players, onSeeAll }) {
  const topPlayers = [...players]
    .sort((a, b) => {
      const aValue = stat.customValue
        ? parseFloat(stat.customValue(a))
        : getAverage(a, stat.key);

      const bValue = stat.customValue
        ? parseFloat(stat.customValue(b))
        : getAverage(b, stat.key);

      return bValue - aValue;
    })
    .slice(0, 3);

  return (
    <div className="rounded-3xl bg-[#1F1D1D] p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{stat.title}</h2>
        </div>

        <button
          onClick={onSeeAll}
          className="rounded-full bg-[#1F1D1D] px-4 py-2 text-sm font-semibold text-white"
        >
          See all
        </button>
      </div>

      <div className="space-y-3">
        {topPlayers.map((player, index) => (
          <PlayerStatRow
            key={player.player_id}
            rank={index + 1}
            player={player}
            stat={stat}
          />
        ))}
      </div>
    </div>
  );
}

function PlayerStatRow({ rank, player, stat }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#2D2A2A] p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1F1D1D] text-sm font-bold text-[#2ECC71]">
          {rank}
        </div>

        <div>
          <div className="font-semibold">{player.player_name}</div>
          <div className="text-[10px] text-[#FFFFFF80]">GAMES {player.gp}</div>
        </div>
      </div>

      <div className="text-left">
        <div className="text-xl font-bold text-[#2ECC71]">
          {stat.customValue
            ? stat.customValue(player)
            : getAverage(player, stat.key)}
        </div>

        <div className="text-xs text-end text-[#FFFFFF80]">{stat.label}</div>
      </div>
    </div>
  );
}

function StatsBottomSheet({ stat, players, onClose }) {
  return (
    <div className="fixed inset-0 z-100 bg-black/60">
      <button className="absolute inset-0 h-full w-full" onClick={onClose} />

      <div className="absolute bottom-0 left-0 right-0 z-101 max-h-[80vh] rounded-t-3xl bg-[#1F1D1D] p-4">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full text-[#FFFFFF80]" />

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{stat.title}</h2>
            <p className="text-sm text-[#FFFFFF80]">{stat.label}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-[#1F1D1D] px-4 py-2 text-sm"
          >
            Close
          </button>
        </div>

        <div className="max-h-[62vh] space-y-3 overflow-y-auto pb-4">
          {players.map((player, index) => (
            <PlayerStatRow
              key={player.player_id}
              rank={index + 1}
              player={player}
              stat={stat}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
