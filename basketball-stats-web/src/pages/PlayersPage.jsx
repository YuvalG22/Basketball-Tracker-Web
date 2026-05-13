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
    <section>
      <h1 className="mb-4 text-2xl font-bold">
        Players
      </h1>

      <div className="space-y-3">
        {data.map((player) => (
          <Link
            key={player.id}
            to={`/players/${player.id}`}
            className="block rounded-2xl bg-slate-900 p-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                #{player.number} {player.name}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}