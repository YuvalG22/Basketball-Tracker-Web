import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getPlayers } from "../api/playersApi";

export default function PlayersPage() {
  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ["players"],
    queryFn: getPlayers,
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>{error.message}</p>;

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Players</h1>
        <p className="mt-1 text-sm text-[#FFFFFF80]">
          {data.length} players
        </p>
      </div>

      <div className="space-y-3">
        {data.map((player) => (
          <Link
            key={player.id}
            to={`/players/${player.id}`}
            className="block rounded-3xl bg-[#1F1D1D] p-4 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2D2A2A] text-xl font-bold text-[#2ECC71]">
                  {player.number}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white">
                    {player.name}
                  </h2>

                  
                </div>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2D2A2A] text-lg text-[#FFFFFF80]">
                ›
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}