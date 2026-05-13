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

  const { game, players } = data;

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

      <div>
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

                          {/* <div className="text-[8px] text-[#FFFFFF80]">
                            #{player.player_number}
                          </div> */}
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

                    <td className="px-2 py-3 text-center">
                      {player.turnovers}
                    </td>

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
    </section>
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
