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

  return (
    <section className="space-y-5">
      <GameHeader
        game={game}
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeScore={homeScore}
        awayScore={awayScore}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_420px]">
        <BoxScoreSection players={players} />

        <PlayByPlaySection events={events} opponentName={game.opponent_name} />
      </div>
    </section>
  );
}

function BoxScoreSection({ players }) {
  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold">Box Score</h2>
        <span className="text-sm text-[#FFFFFF80]">
          {players.length} players
        </span>
      </div>

      <div className="overflow-x-auto rounded-3xl bg-[#1F1D1D]">
        <table className="w-full min-w-[620px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#2D2A2A] text-[#FFFFFF80]">
              <th className="sticky left-0 bg-[#1F1D1D] px-3 py-3 text-left font-semibold">
                Player
              </th>

              <th className="px-2 py-3 text-center">PTS</th>
              <th className="px-2 py-3 text-center">REB</th>
              <th className="px-2 py-3 text-center">AST</th>
              <th className="px-2 py-3 text-center">STL</th>
              <th className="px-2 py-3 text-center">BLK</th>
              <th className="px-2 py-3 text-center">TOV</th>
              <th className="px-2 py-3 text-center">2PT</th>
              <th className="px-2 py-3 text-center">3PT</th>
              <th className="px-2 py-3 text-center">FT</th>
            </tr>
          </thead>

          <tbody>
            {players.map((player) => {
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
                    <div className="flex w-[120px] items-center gap-2">
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

      <div className="rounded-3xl bg-[#1F1D1D] p-4 xl:max-h-[620px] xl:overflow-y-auto">
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

      <div className="space-y-4">
        <TeamScoreRow
          name={homeTeamName}
          score={homeScore}
          isWinner={homeWon}
        />

        <TeamScoreRow
          name={awayTeamName}
          score={awayScore}
          isWinner={awayWon}
        />
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
