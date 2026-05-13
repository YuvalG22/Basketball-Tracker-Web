import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPlayerDetails } from "../api/playersApi";

export default function PlayerDetailsPage() {
  const { playerId } = useParams();
  const [selectedGame, setSelectedGame] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["player-details", playerId],
    queryFn: () => getPlayerDetails(playerId),
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>{error.message}</p>;

  const { player, averages, games } = data;

  return (
    <section className="space-y-5">
      <PlayerHeader player={player} averages={averages} gamesCount={games.length} />

      <div>
        <h2 className="mb-3 text-xl font-bold">Games</h2>

        <div className="space-y-3">
          {games.map((game) => (
            <button
              key={game.game_id}
              onClick={() => setSelectedGame(game)}
              className="w-full rounded-2xl bg-[#1F1D1D] p-4 text-right"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">
                    נגד {game.opponent_name}
                  </div>

                  <div className="mt-1 text-xs text-[#FFFFFF80]">
                    מחזור {game.round_number}
                  </div>
                </div>

                <div className="text-left">
                  <div className="text-xl font-bold text-[#2ECC71]">
                    {game.points}
                  </div>
                  <div className="text-xs text-[#FFFFFF80]">PTS</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <MiniStat label="REB" value={game.rebounds} />
                <MiniStat label="AST" value={game.assists} />
                <MiniStat label="STL" value={game.steals} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedGame && (
        <GameStatsBottomSheet
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </section>
  );
}

function PlayerHeader({ player, averages, gamesCount }) {
  return (
    <div className="rounded-3xl bg-[#1F1D1D] p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2D2A2A] text-2xl font-bold text-[#2ECC71]">
          {player.number}
        </div>

        <div>
          <h1 className="text-3xl font-bold">{player.name}</h1>
          <p className="text-sm text-[#FFFFFF80]">{gamesCount} games played</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <MainStat label="PPG" value={averages.ppg} />
        <MainStat label="RPG" value={averages.rpg} />
        <MainStat label="APG" value={averages.apg} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <MainStat label="SPG" value={averages.spg} />
        <MainStat label="BPG" value={averages.bpg} />
        <MainStat label="TPG" value={averages.tpg} />
      </div>
    </div>
  );
}

function MainStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#2D2A2A] p-3 text-center">
      <div className="text-2xl font-bold text-[#2ECC71]">
        {Number(value ?? 0)}
      </div>
      <div className="mt-1 text-xs text-[#FFFFFF80]">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-[#2D2A2A] p-2">
      <div className="font-bold text-white">{value}</div>
      <div className="text-xs text-[#FFFFFF80]">{label}</div>
    </div>
  );
}

function GameStatsBottomSheet({ game, onClose }) {
  const twoAttempts = Number(game.two_made) + Number(game.two_miss);
  const threeAttempts = Number(game.three_made) + Number(game.three_miss);
  const ftAttempts = Number(game.ft_made) + Number(game.ft_miss);

  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <button className="absolute inset-0 h-full w-full" onClick={onClose} />

      <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#1F1D1D] p-5">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[#FFFFFF40]" />

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">נגד {game.opponent_name}</h2>
            <p className="text-sm text-[#FFFFFF80]">מחזור {game.round_number}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-[#2D2A2A] px-4 py-2 text-sm"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MainStat label="PTS" value={game.points} />
          <MainStat label="REB" value={game.rebounds} />
          <MainStat label="AST" value={game.assists} />
          <MainStat label="STL" value={game.steals} />
          <MainStat label="BLK" value={game.blocks} />
          <MainStat label="TOV" value={game.turnovers} />
        </div>

        <div className="mt-5 rounded-2xl bg-[#2D2A2A] p-4">
          <h3 className="mb-3 font-bold">Shooting</h3>

          <div className="space-y-3 text-sm">
            <ShotRow label="2PT" made={game.two_made} attempts={twoAttempts} />
            <ShotRow label="3PT" made={game.three_made} attempts={threeAttempts} />
            <ShotRow label="FT" made={game.ft_made} attempts={ftAttempts} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ShotRow({ label, made, attempts }) {
  const percentage =
    attempts === 0 ? 0 : ((Number(made) / attempts) * 100).toFixed(1);

  return (
    <div className="flex items-center justify-between">
      <span className="text-[#FFFFFF80]">{label}</span>

      <span className="font-semibold text-white">
        {made}/{attempts} · {percentage}%
      </span>
    </div>
  );
}