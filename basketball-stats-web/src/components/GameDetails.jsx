import { useState } from "react";
import {
  Area,
  YAxis,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
} from "recharts";
import TeamLogo from "./TeamLogo";
import PlayerAvatar from "./PlayerAvatar";
import PlayByPlay from "./PlayByPlay";
import MomentumTooltip from "./MomentumTooltip";
import { getPeriodScores, buildMomentumPoints, momentumAxisClock } from "../utils/gameStats";

export default function GameStatsView({
  game,
  players = [],
  events = [],
}) {
  const momentumPoints = buildMomentumPoints(events, game.quarter_length_sec);

  const teamScore = Number(game.team_score ?? 0);
  const opponentScore = Number(game.opponent_score ?? 0);

  const homeTeamName = game.is_home_game ? "Afeka" : game.opponent_name;
  const awayTeamName = game.is_home_game ? game.opponent_name : "Afeka";

  const homeScore = game.is_home_game ? teamScore : opponentScore;
  const awayScore = game.is_home_game ? opponentScore : teamScore;

  const periodScores = getPeriodScores(events, game.is_home_game, game.quarters_count);


  return (
    <section className="space-y-5">
      <GameHeader game={game} homeTeamName={homeTeamName} awayTeamName={awayTeamName}
        homeScore={homeScore} awayScore={awayScore} periodScores={periodScores} momentumPoints={momentumPoints} />
      <div className="game-panels">
        <div className="game-panel" role="region" aria-label="Box Score">
          <BoxScoreSection players={players} />
        </div>
        <div className="game-panel" role="region" aria-label="Play by Play timeline">
          <PlayByPlay events={events} game={game} players={players} />
        </div>
      </div>
    </section>
  );
}

function BoxScoreSection({ players }) {
  const [sortKey, setSortKey] = useState("points");
  const [sortDirection, setSortDirection] = useState("desc");

  function handleSort(key) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  }

  const sortedPlayers = [...players].sort((a, b) => {
    const aValue = Number(a[sortKey] ?? 0);
    const bValue = Number(b[sortKey] ?? 0);

    return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
  });

  return (
    <div className="min-w-0 rounded-[20px] bg-surface">
      <div className="flex items-center justify-between p-3">
        <h2 className="text-xl font-bold">Box Score</h2>
        <span className="text-sm text-muted">
          {players.length} players
        </span>
      </div>
      <div className="overflow-x-auto" role="region" aria-label="Player box score, scroll for more statistics" tabIndex={0}>
        <table className="w-full min-w-155 border-collapse text-xs">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="sticky left-0 bg-surface px-3 py-3 text-left font-semibold">
                Player
              </th>

              <SortableTh
                label="PTS"
                field="points"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableTh
                label="REB"
                field="rebounds"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableTh
                label="AST"
                field="assists"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableTh
                label="STL"
                field="steals"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableTh
                label="BLK"
                field="blocks"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableTh
                label="TOV"
                field="turnovers"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableTh
                label="2PT"
                field="two_made"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableTh
                label="3PT"
                field="three_made"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableTh
                label="FT"
                field="ft_made"
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </tr>
          </thead>

          <tbody>
            {sortedPlayers.map((player) => {
              const twoAttempts =
                Number(player.two_made ?? 0) + Number(player.two_miss ?? 0);

              const threeAttempts =
                Number(player.three_made ?? 0) + Number(player.three_miss ?? 0);

              const ftAttempts =
                Number(player.ft_made ?? 0) + Number(player.ft_miss ?? 0);

              return (
                <tr
                  key={player.player_id}
                  className="border-b border-line last:border-b-0"
                >
                  <td className="sticky left-0 bg-surface px-2 py-3">
                    <div className="flex w-36 items-center gap-2">
                      <PlayerAvatar player={player} className="h-9 w-9" />

                      <div className="min-w-0">
                        <div
                          className="truncate text-sm font-bold text-ink"
                        >
                          {player.player_name}
                        </div>
                        <span className="text-xs text-muted">#{player.player_number ?? "-"}</span>

                      </div>
                    </div>
                  </td>

                  <td className="px-2 py-3 text-center text-sm">{player.points}</td>

                  <td className="px-2 py-3 text-center text-sm">{player.rebounds}</td>
                  <td className="px-2 py-3 text-center text-sm">{player.assists}</td>
                  <td className="px-2 py-3 text-center text-sm">{player.steals}</td>
                  <td className="px-2 py-3 text-center text-sm">{player.blocks}</td>
                  <td className="px-2 py-3 text-center text-sm">{player.turnovers}</td>

                  <td className="px-2 py-3 text-center text-sm">
                    {player.two_made ?? 0}/{twoAttempts}
                  </td>

                  <td className="px-2 py-3 text-center text-sm">
                    {player.three_made ?? 0}/{threeAttempts}
                  </td>

                  <td className="px-2 py-3 text-center text-sm">
                    {player.ft_made ?? 0}/{ftAttempts}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortableTh({ label, field, sortKey, sortDirection, onSort }) {
  const active = sortKey === field;

  return (
    <th aria-sort={active ? (sortDirection === "desc" ? "descending" : "ascending") : "none"} className="px-2 py-3 text-center">
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center justify-center gap-1 font-semibold ${
          active ? "text-accent" : "text-muted"
        }`}
      >
        <span>{label}</span>
        <span className="text-[10px]">
          {active ? (sortDirection === "desc" ? "↓" : "↑") : "↕"}
        </span>
      </button>
    </th>
  );
}

function GameHeader({
  game,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  periodScores,
  momentumPoints,
}) {
  const regulationPeriods = Number(game.quarters_count) || 4;
  const scoreColumns = { gridTemplateColumns: `minmax(5rem, 1.5fr) repeat(${periodScores.length + 1}, minmax(2.5rem, 1fr))` };

  const canShowMomentum =
    momentumPoints.length > 0 && momentumPoints.some((p) => p.scoreDiff !== 0);

  return (
    <div className="rounded-[20px] bg-surface p-4">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div
          className="rounded-full bg-raised px-3 py-1 text-xs font-bold text-muted"
        >
          FT
        </div>

        <div className="text-xs bg-raised text-muted rounded-full px-3 py-1">
          {`Round ${game.round_number} • ${new Date(
            Number(game.game_date_epoch),
          ).toLocaleDateString("he-IL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}`}
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-6">
        <HeaderTeam name={homeTeamName} align="left" />

        <div className="text-center">
          <div
            className="whitespace-nowrap text-2xl font-black tracking-tight text-ink sm:text-4xl"
          >
            {homeScore} - {awayScore}
          </div>

          <div
            className="mt-2 text-sm font-bold text-muted"
          >
            FINAL
          </div>
        </div>

        <HeaderTeam name={awayTeamName} align="right" />
      </div>
      {canShowMomentum && (
        <div className="mt-4">
          <MomentumAreaChart momentumPoints={momentumPoints} opponentName={game.opponent_name} periodLength={game.quarter_length_sec} regulationPeriods={regulationPeriods} />
        </div>
      )}
      <div className="mt-6 overflow-x-auto rounded-2xl bg-raised p-3">
        <div className="grid gap-2 text-center text-xs text-muted" style={scoreColumns}>
          <div></div>

          {periodScores.map((p) => (
            <div key={p.period}>{p.period <= regulationPeriods ? `Q${p.period}` : `OT${p.period - regulationPeriods}`}</div>
          ))}

          <div>FT</div>
        </div>

        <div className="mt-2 grid gap-2 text-center text-sm" style={scoreColumns}>
          <div className="truncate text-left text-muted">
            {homeTeamName}
          </div>

          {periodScores.map((p) => (
            <div
              className={`font-bold ${p.away < p.home ? "text-ink" : "text-muted"}`}
              key={p.period}
            >
              {p.home}
            </div>
          ))}

          <div
            className={`font-bold ${awayScore < homeScore ? "text-accent" : "text-muted"}`}
          >
            {homeScore}
          </div>
        </div>

        <div className="mt-2 grid gap-2 text-center text-sm" style={scoreColumns}>
          <div className="truncate text-left text-muted">
            {awayTeamName}
          </div>

          {periodScores.map((p) => (
            <div
              className={`font-bold ${p.away > p.home ? "text-ink" : "text-muted"}`}
              key={p.period}
            >
              {p.away}
            </div>
          ))}

          <div
            className={`${awayScore > homeScore ? "text-accent font-bold" : "text-muted"}`}
          >
            {awayScore}
          </div>
        </div>
      </div>
    </div>
  );
}

function MomentumAreaChart({ momentumPoints, opponentName, periodLength = 600, regulationPeriods = 4 }) {
  const data = momentumPoints.map((p) => ({
    ...p,
    positiveDiff: p.scoreDiff > 0 ? p.scoreDiff : 0,
    negativeDiff: p.scoreDiff < 0 ? p.scoreDiff : 0,
  }));

  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(d.scoreDiff)));

  return (
    <div className="w-full rounded-2xl bg-raised p-3">
      <p className="mb-2 text-xs text-muted">Lead from recorded scoring events</p>
      <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs font-semibold"><span className="text-accent">Afeka lead</span><span className="text-orange">{opponentName} lead</span></div>
      <div className="h-44" role="img" aria-label="Scoring momentum: Afeka score minus opponent score by period and game clock">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 176 }}>
        <AreaChart data={data}>
          <XAxis dataKey="gameSecond" type="number" domain={[0, "dataMax"]} tickFormatter={value => momentumAxisClock(value, periodLength, regulationPeriods, Math.max(...data.map(point => point.period)))} tick={{ fontSize: 10 }} minTickGap={32} />
          <Tooltip content={<MomentumTooltip opponentName={opponentName} regulationPeriods={regulationPeriods} />} />
          <YAxis
            width={24}
            domain={[-maxAbs, maxAbs]}
            ticks={[-maxAbs, 0, maxAbs]}
            axisLine={false}
            tickLine={false}
            padding={{ top: 10, bottom: 10 }}
            tickFormatter={(value) => Math.abs(value)}
          />
          <ReferenceLine y={0} stroke="var(--color-muted)" />
          <Area
            type="stepAfter"
            isAnimationActive={false}
            dataKey="positiveDiff"
            stroke="var(--color-accent)"
            fill="var(--color-accent)"
            fillOpacity={0.8}
            dot={false}
            connectNulls
            activeDot={false}
          />

          <Area
            type="stepAfter"
            isAnimationActive={false}
            dataKey="negativeDiff"
            stroke="var(--color-orange)"
            fill="var(--color-orange)"
            fillOpacity={0.8}
            dot={false}
            connectNulls
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

function HeaderTeam({ name, align }) {
  return (
    <div
      className={`flex flex-col items-center ${
        align === "right" ? "justify-self-end" : "justify-self-start"
      }`}
    >
      <TeamLogo name={name} className="h-14 w-20 sm:h-20 sm:w-32" />

      <div className="mt-3 max-w-full break-words text-center text-sm sm:text-lg font-black text-ink">
        {name}
      </div>
    </div>
  );
}
