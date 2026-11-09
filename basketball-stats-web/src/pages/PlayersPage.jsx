import { usePreferences } from "../preferences/context";
import PlayerAvatar from "../components/PlayerAvatar";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getPlayers } from "../api/playersApi";
export default function PlayersPage() {
  const {
    t, playerName
  } = usePreferences();
  const {
    data = [],
    isLoading,
    isError
  } = useQuery({
    queryKey: ["players"],
    queryFn: getPlayers
  });
  if (isLoading) return <p>{t("Loading...")}</p>;
  if (isError) return <p>{t("Unable to load data. Please try again.")}{/* error details are not user-facing */}</p>;
  return <section className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold">{t("Players")}</h1>
        <p className="mt-1 text-sm text-muted">
          {data.length}{" "}{t("players")}
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.map(player => <Link key={player.id} to={`/players/${player.id}`} className="block rounded-[20px] bg-surface p-4 active:scale-[0.98]">

            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
        <PlayerAvatar player={player} className="h-14 w-14" />

                <div className="min-w-0">
                  <h2 className="break-words text-lg font-bold text-ink">
                    {playerName(player.name)}
                  </h2>
                  <p dir="ltr" className="w-fit text-sm text-muted">#{player.number ?? "-"}</p>


                </div>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised text-lg text-muted">
                ›
              </div>
            </div>
          </Link>)}
      </div>
    </section>;
}
