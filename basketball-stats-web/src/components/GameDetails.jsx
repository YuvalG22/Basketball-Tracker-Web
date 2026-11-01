import { useState } from "react";
import {
  Area,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
} from "recharts";
import { getPeriodScores, buildMomentumPoints } from "../utils/gameStats";

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
    <section className="flex flex-col gap-5 md:flex-row">
      <div className="flex min-w-0 flex-col md:w-1/3 gap-5">
        <GameHeader
          game={game}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          homeScore={homeScore}
          awayScore={awayScore}
          periodScores={periodScores}
          momentumPoints={momentumPoints}
        />
        <PlayByPlaySection events={events} opponentName={game.opponent_name} />
      </div>
      <div className="min-w-0 md:w-2/3">
        <BoxScoreSection
          players={players}
        />
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
      <div className="overflow-x-auto">
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
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-raised text-[10px] font-bold text-accent"
                      >
                        {player.player_number}
                      </div>

                      <div className="min-w-0">
                        <div
                          className="truncate text-sm font-bold text-ink"
                        >
                          {player.player_name}
                        </div>

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
    <th className="px-2 py-3 text-center">
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

function PlayByPlaySection({ events, opponentName }) {
  return (
    <div className="min-w-0">
      <div className="rounded-[20px] bg-surface p-4 xl:max-h-155 xl:overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Play by Play</h2>
        </div>
        <div className="space-y-4">
          {events.map((event) => {
            if (event.type === "PERIOD_START") {
              return (
                <QuarterSeparator
                  key={event.id}
                  period={event.period}
                  isStart
                />
              );
            }

            if (event.type === "PERIOD_END") {
              return (
                <QuarterSeparator
                  key={event.id}
                  period={event.period}
                  isStart={false}
                />
              );
            }

            return (
              <PlayByPlayRow
                key={event.id}
                event={event}
                opponentName={opponentName}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuarterSeparator({ period, isStart }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-raised" />

      <div
        className={`rounded-full px-4 py-1 text-xs font-bold ${
          isStart
            ? "bg-accent/10 text-accent"
            : "bg-raised text-muted"
        }`}
      >
        {isStart ? `START Q${period}` : `END Q${period}`}
      </div>

      <div className="h-px flex-1 bg-raised" />
    </div>
  );
}

function PlayByPlayRow({ event, opponentName }) {
  const isOpponent = event.type.startsWith("OPP");

  return (
    <div
      className={`flex items-center ${
        isOpponent ? "justify-start" : "justify-end"
      }`}
    >
      <div
        className={`flex items-center gap-3 ${
          isOpponent ? "flex-row" : "flex-row-reverse"
        }`}
      >
        <div className="text-xs font-bold text-ink">
          {formatClock(event.clock_sec_remaining)}
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-raised text-sm font-bold text-accent">
          {getPointsFromEvent(event.type)}
        </div>

        <div
          className={`flex items-center gap-2 ${
            isOpponent ? "flex-row" : "flex-row-reverse"
          }`}
        >
          <span className="text-[18px] font-bold text-ink">
            {event.team_score_at_event} - {event.opponent_score_at_event}
          </span>

          <div className={`flex flex-row items-center gap-2`}>
            <span className="text-sm text-ink">
              {event.player_name ?? opponentName}
            </span>

            {event.assist_player_name && (
              <span className="text-xs text-muted">
                Assist: {event.assist_player_name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
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
      <div className="mb-5 flex items-center justify-between">
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
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <HeaderTeam name={homeTeamName} align="left" />

        <div className="text-center">
          <div
            className="text-3xl font-black tracking-tight text-ink md:text-4xl"
          >
            {homeScore} - {awayScore}
          </div>

          <div
            className="mt-2 text-xl font-bold text-muted"
          >
            FINAL
          </div>
        </div>

        <HeaderTeam name={awayTeamName} align="right" />
      </div>
      {canShowMomentum && (
        <div className="mt-4">
          <MomentumAreaChart momentumPoints={momentumPoints} />
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

function formatClock(seconds) {
  const total = Number(seconds ?? 0);
  const min = Math.floor(total / 60);
  const sec = total % 60;

  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function getPointsFromEvent(type) {
  switch (type) {
    case "TWO_MADE":
    case "OPP_TWO_MADE":
      return 2;

    case "THREE_MADE":
    case "OPP_THREE_MADE":
      return 3;

    case "FT_MADE":
    case "OPP_FT_MADE":
      return 1;

    default:
      return "";
  }
}

function MomentumAreaChart({ momentumPoints }) {
  const data = momentumPoints.map((p) => ({
    ...p,
    positiveDiff: p.scoreDiff > 0 ? p.scoreDiff : 0,
    negativeDiff: p.scoreDiff < 0 ? p.scoreDiff : 0,
  }));

  const maxAbs = Math.max(...data.map((d) => Math.abs(d.scoreDiff)));

  return (
    <div className="h-30 w-full rounded-2xl bg-raised">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 320, height: 120 }}>
        <AreaChart data={data}>
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
            type="monotone"
            dataKey="positiveDiff"
            stroke="var(--color-accent)"
            fill="var(--color-accent)"
            fillOpacity={0.8}
            dot={false}
            connectNulls
            activeDot={false}
          />

          <Area
            type="monotone"
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
  );
}

function HeaderTeam({ name, align }) {
  return (
    <div
      className={`flex flex-col items-center ${
        align === "right" ? "justify-self-end" : "justify-self-start"
      }`}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-raised text-4xl shadow-lg">
        🏀
      </div>

      <div className="mt-3 max-w-[120px] text-center text-lg font-black text-ink">
        {name}
      </div>
    </div>
  );
}
