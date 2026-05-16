import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getGameDetails } from "../api/gamesApi";

export default function GameDetailsPage() {
  const { gameId } = useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["game-details", gameId],
    queryFn: () => getGameDetails(gameId),
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>{error.message}</p>;

  const { game, players, events = [] } = data;

  const homeTeamName = game.is_home_game ? "Afeka" : game.opponent_name;
  const awayTeamName = game.is_home_game ? game.opponent_name : "Afeka";

  const homeScore = game.is_home_game ? game.team_score : game.opponent_score;
  const awayScore = game.is_home_game ? game.opponent_score : game.team_score;

  const periodScores = getPeriodScores(events, game.is_home_game);

  return (
    <section className="space-y-5">
      <GameHeader
        game={game}
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeScore={homeScore}
        awayScore={awayScore}
        periodScores={periodScores}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_420px]">
        <BoxScoreSection players={players} />

        <PlayByPlaySection events={events} opponentName={game.opponent_name} />
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
                    <div className="flex w-30 items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2D2A2A] text-[10px] font-bold text-[#2ECC71]">
                        {player.player_number}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-white">
                          {player.player_name}
                        </div>
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

function PlayByPlaySection({ events, opponentName }) {
  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold">Play by Play</h2>

        <span className="text-sm text-[#FFFFFF80]">{events.length} events</span>
      </div>

      <div className="rounded-3xl bg-[#1F1D1D] p-4 xl:max-h-155 xl:overflow-y-auto">
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

function GameHeader({
  game,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  periodScores,
}) {
  const homeWon = Number(homeScore) > Number(awayScore);
  const awayWon = Number(awayScore) > Number(homeScore);

  return (
    <div className="rounded-3xl bg-[#1F1D1D] p-5">
      <div className="mb-5 flex items-center justify-between">
        <div className="rounded-full bg-[#2D2A2A] px-3 py-1 text-xs font-bold text-[#FFFFFF80]">
          FT
        </div>

        <div className="text-xs text-[#FFFFFF80]">
          Round {game.round_number}
        </div>
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
            className={`font-bold ${awayScore < homeScore ? "text-[#2ECC71]" : ""}`}
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
            className={`${awayScore > homeScore ? "text-[#2ECC71] font-bold" : ""}`}
          >
            {awayScore}
          </div>
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
