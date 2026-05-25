import { useState } from "react";
import { data, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  AreaChart,
} from "recharts";

export default function GameStatsView({
  game,
  players,
  events,
  lineupEvents = [],
  isLive = false,
}) {
  const momentumPoints = buildMomentumPoints(events, game.quarter_length_sec);

  const teamScore = isLive
    ? Number(game.live_team_score)
    : Number(game.team_score);

  const opponentScore = isLive
    ? Number(game.live_opponent_score)
    : Number(game.opponent_score);

  const homeTeamName = game.is_home_game ? "Afeka" : game.opponent_name;
  const awayTeamName = game.is_home_game ? game.opponent_name : "Afeka";

  const homeScore = game.is_home_game ? teamScore : opponentScore;
  const awayScore = game.is_home_game ? opponentScore : teamScore;

  const periodScores = getPeriodScores(events, game.is_home_game);

  const onCourtPlayerIds = isLive
    ? getOnCourtPlayerIds(lineupEvents)
    : new Set();

  return (
    <section className="flex flex-col gap-5 md:flex-row">
      <div className="flex flex-col md:w-1/3 gap-5">
        <GameHeader
          game={game}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          homeScore={homeScore}
          awayScore={awayScore}
          periodScores={periodScores}
          momentumPoints={momentumPoints}
          isLive={isLive}
        />
        <PlayByPlaySection events={events} opponentName={game.opponent_name} />
      </div>
      <div className="md:w-2/3">
        <BoxScoreSection
          players={players}
          onCourtPlayerIds={onCourtPlayerIds}
          isLive={isLive}
        />
      </div>
    </section>
  );
}

function BoxScoreSection({
  players,
  onCourtPlayerIds = new Set(),
  isLive = false,
}) {
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
    <div className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold">Box Score</h2>
        <span className="text-sm text-[#FFFFFF80]">
          {players.length} players
        </span>
      </div>
      <div className="overflow-x-auto rounded-3xl bg-[#1F1D1D]">
        <table className="w-full min-w-155 border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#2D2A2A] text-[#FFFFFF80]">
              <th className="sticky left-0 bg-[#1F1D1D] px-3 py-3 text-left font-semibold">
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
              const isOnCourt = onCourtPlayerIds.has(String(player.player_id));
              const twoAttempts =
                Number(player.two_made) + Number(player.two_miss);

              const threeAttempts =
                Number(player.three_made) + Number(player.three_miss);

              const ftAttempts =
                Number(player.ft_made) + Number(player.ft_miss);

              return (
                <tr
                  key={player.player_id}
                  className="border-b border-[#2D2A2A] last:border-b-0"
                >
                  <td className="sticky left-0 bg-[#1F1D1D] px-2 py-3">
                    <div className="flex w-36 items-center gap-2">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          isOnCourt
                            ? "bg-[#2ECC71] text-black"
                            : "bg-[#2D2A2A] text-[#2ECC71]"
                        }`}
                      >
                        {player.player_number}
                      </div>

                      <div className="min-w-0">
                        <div
                          className={`truncate text-xs font-bold ${
                            isOnCourt ? "text-white" : "text-white/60"
                          }`}
                        >
                          {player.player_name}
                        </div>

                        {isLive && isOnCourt && (
                          <div className="mt-0.5 text-[10px] font-bold text-[#2ECC71]">
                            ON COURT
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-2 py-3 text-center font-bold text-[#2ECC71]">
                    {player.points}
                  </td>

                  <td className="px-2 py-3 text-center">{player.rebounds}</td>
                  <td className="px-2 py-3 text-center">{player.assists}</td>
                  <td className="px-2 py-3 text-center">{player.steals}</td>
                  <td className="px-2 py-3 text-center">{player.blocks}</td>
                  <td className="px-2 py-3 text-center">{player.turnovers}</td>

                  <td className="px-2 py-3 text-center">
                    {player.two_made}/{twoAttempts}
                  </td>

                  <td className="px-2 py-3 text-center">
                    {player.three_made}/{threeAttempts}
                  </td>

                  <td className="px-2 py-3 text-center">
                    {player.ft_made}/{ftAttempts}
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
          active ? "text-[#2ECC71]" : "text-[#FFFFFF80]"
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
      <div className="rounded-3xl bg-[#1F1D1D] p-4 xl:max-h-155 xl:overflow-y-auto">
        <div className="mb-3 flex items-center justify-between">
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
      <div className="h-px flex-1 bg-[#2D2A2A]" />

      <div
        className={`rounded-full px-4 py-1 text-xs font-bold ${
          isStart
            ? "bg-[#2ECC71]/20 text-[#2ECC71]"
            : "bg-[#2D2A2A] text-[#FFFFFF80]"
        }`}
      >
        {isStart ? `START Q${period}` : `END Q${period}`}
      </div>

      <div className="h-px flex-1 bg-[#2D2A2A]" />
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
        <div className="text-xs font-bold text-white">
          {formatClock(event.clock_sec_remaining)}
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2D2A2A] text-sm font-bold text-[#2ECC71]">
          {getPointsFromEvent(event.type)}
        </div>

        <div
          className={`flex items-center gap-2 ${
            isOpponent ? "flex-row" : "flex-row-reverse"
          }`}
        >
          <span className="text-[18px] font-bold text-white">
            {event.team_score_at_event} - {event.opponent_score_at_event}
          </span>

          <span className="text-sm text-[#FFFFFF80]">
            {event.player_name ?? opponentName}
          </span>
        </div>
      </div>
    </div>
  );
}

function TeamScoreRow({ name, score, isWinner }) {
  return (
    <div className="flex items-center justify-between">
      <div
        className={`text-lg ${
          isWinner ? "font-bold text-white" : "font-medium text-[#FFFFFF80]"
        }`}
      >
        {name}
      </div>

      <div
        className={`text-4xl ${
          isWinner ? "font-bold text-white" : "font-semibold text-[#FFFFFF80]"
        }`}
      >
        {score}
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
  isLive = false,
}) {
  const homeWon = Number(homeScore) > Number(awayScore);
  const awayWon = Number(awayScore) > Number(homeScore);

  const canShowMomentum =
    momentumPoints.length > 0 && momentumPoints.some((p) => p.scoreDiff !== 0);

  return (
    <div className="rounded-3xl bg-[#1F1D1D] p-4">
      <div className="mb-5 flex items-center justify-between">
        <div
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            isLive
              ? "bg-[#2ECC71]/20 text-[#2ECC71]"
              : "bg-[#2D2A2A] text-[#FFFFFF80]"
          }`}
        >
          {isLive
            ? `LIVE • Q${game.current_period} • ${formatClock(game.clock_sec_remaining)}`
            : "FT"}
        </div>

        <div className="text-xs text-[#FFFFFF80]">
          Round {game.round_number}
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <HeaderTeam name={homeTeamName} align="left" />

        <div className="text-center">
          <div
            className={`text-3xl font-black tracking-tight md:text-4xl ${
              isLive ? "text-[#E8534F]" : "text-white"
            }`}
          >
            {homeScore} - {awayScore}
          </div>

          <div
            className={`mt-2 text-xl font-bold ${
              isLive ? "text-[#E8534F]" : "text-[#FFFFFF80]"
            }`}
          >
            {isLive
              ? `Q${game.current_period} ${formatClock(
                  game.clock_sec_remaining,
                )}`
              : "FINAL"}
          </div>
        </div>

        <HeaderTeam name={awayTeamName} align="right" />
      </div>
      <div className={`mt-4 ${!canShowMomentum ? "hidden" : ""}`}>
        <MomentumAreaChart momentumPoints={momentumPoints} />
      </div>
      <div className="mt-6 rounded-2xl bg-[#2D2A2A] p-3">
        <div className="grid grid-cols-6 gap-2 text-center text-xs text-[#FFFFFF80]">
          <div></div>

          {periodScores.map((p) => (
            <div key={p.period}>Q{p.period}</div>
          ))}

          <div>FT</div>
        </div>

        <div className="mt-2 grid grid-cols-6 gap-2 text-center text-sm">
          <div className="truncate text-left text-[#FFFFFF80]">
            {homeTeamName}
          </div>

          {periodScores.map((p) => (
            <div
              className={`font-bold ${p.away < p.home ? "text-white" : "text-[#FFFFFF80]"}`}
              key={p.period}
            >
              {p.home}
            </div>
          ))}

          <div
            className={`font-bold ${awayScore < homeScore ? "text-[#2ECC71]" : "text-[#FFFFFF80]"}`}
          >
            {homeScore}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-6 gap-2 text-center text-sm">
          <div className="truncate text-left text-[#FFFFFF80]">
            {awayTeamName}
          </div>

          {periodScores.map((p) => (
            <div
              className={`font-bold ${p.away > p.home ? "text-white" : "text-[#FFFFFF80]"}`}
              key={p.period}
            >
              {p.away}
            </div>
          ))}

          <div
            className={`${awayScore > homeScore ? "text-[#2ECC71] font-bold" : "text-[#FFFFFF80]"}`}
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

function buildMomentumPoints(events, quarterLengthSec = 600) {
  const points = events
    .filter(
      (event) =>
        SCORING_EVENTS.has(event.type) &&
        event.team_score_at_event != null &&
        event.opponent_score_at_event != null,
    )
    .sort((a, b) => {
      if (a.period !== b.period) return a.period - b.period;

      if (a.clock_sec_remaining !== b.clock_sec_remaining) {
        return b.clock_sec_remaining - a.clock_sec_remaining;
      }

      return new Date(a.created_at) - new Date(b.created_at);
    })
    .map((event) => {
      const gameSecond = getGameSecond(event, quarterLengthSec);

      return {
        gameSecond,
        minute: +(gameSecond / 60).toFixed(1),
        scoreDiff: event.team_score_at_event - event.opponent_score_at_event,
      };
    });

  return [
    {
      gameSecond: 0,
      minute: 0,
      scoreDiff: 0,
    },
    ...points,
  ];
}

function MomentumAreaChart({ momentumPoints }) {
  const data = momentumPoints.map((p) => ({
    ...p,
    positiveDiff: p.scoreDiff > 0 ? p.scoreDiff : 0,
    negativeDiff: p.scoreDiff < 0 ? p.scoreDiff : 0,
  }));

  const maxAbs = Math.max(...data.map((d) => Math.abs(d.scoreDiff)));

  return (
    <div className="h-30 w-full rounded-2xl bg-[#2D2A2A]">
      <ResponsiveContainer width="100%" height="100%">
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
          <ReferenceLine y={0} stroke="#999" />
          <Area
            type="monotone"
            dataKey="positiveDiff"
            stroke="#2ECC71"
            fill="#2ECC71"
            fillOpacity={0.8}
            dot={false}
            connectNulls
            activeDot={false}
          />

          <Area
            type="monotone"
            dataKey="negativeDiff"
            stroke="#E74C3C"
            fill="#E74C3C"
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

const SCORING_EVENTS = new Set([
  "FT_MADE",
  "TWO_MADE",
  "THREE_MADE",
  "OPPONENT_FT_MADE",
  "OPPONENT_TWO_MADE",
  "OPPONENT_THREE_MADE",
]);

function getGameSecond(event, quarterLengthSec = 600) {
  return (
    (event.period - 1) * quarterLengthSec +
    (quarterLengthSec - event.clock_sec_remaining)
  );
}

function getPeriodScores(events, isHomeGame) {
  return [1, 2, 3, 4].map((period) => {
    const periodEvents = events.filter(
      (event) => Number(event.period) === period,
    );

    const teamScore = periodEvents.reduce(
      (sum, event) => sum + getPointsFromEventForTeam(event.type),
      0,
    );

    const opponentScore = periodEvents.reduce(
      (sum, event) => sum + getPointsFromEventForOpponent(event.type),
      0,
    );

    return {
      period,
      home: isHomeGame ? teamScore : opponentScore,
      away: isHomeGame ? opponentScore : teamScore,
    };
  });
}

function getPointsFromEventForTeam(type) {
  switch (type) {
    case "TWO_MADE":
      return 2;
    case "THREE_MADE":
      return 3;
    case "FT_MADE":
      return 1;
    default:
      return 0;
  }
}

function getPointsFromEventForOpponent(type) {
  switch (type) {
    case "OPP_TWO_MADE":
      return 2;
    case "OPP_THREE_MADE":
      return 3;
    case "OPP_FT_MADE":
      return 1;
    default:
      return 0;
  }
}

function getOnCourtPlayerIds(events) {
  const onCourt = new Set();

  const sortedEvents = [...events].sort((a, b) => {
    if (Number(a.period) !== Number(b.period)) {
      return Number(a.period) - Number(b.period);
    }

    if (Number(a.clock_sec_remaining) !== Number(b.clock_sec_remaining)) {
      return Number(b.clock_sec_remaining) - Number(a.clock_sec_remaining);
    }

    return new Date(a.created_at) - new Date(b.created_at);
  });

  sortedEvents.forEach((event) => {
    if (!event.player_id) return;

    if (event.type === "SUB_IN") {
      onCourt.add(String(event.player_id));
    }

    if (event.type === "SUB_OUT") {
      onCourt.delete(String(event.player_id));
    }
  });

  return onCourt;
}

function HeaderTeam({ name, align }) {
  return (
    <div
      className={`flex flex-col items-center ${
        align === "right" ? "justify-self-end" : "justify-self-start"
      }`}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#2D2A2A] text-4xl shadow-lg">
        🏀
      </div>

      <div className="mt-3 max-w-[120px] text-center text-lg font-black text-white">
        {name}
      </div>
    </div>
  );
}
