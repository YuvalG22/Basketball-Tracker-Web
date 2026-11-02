import PlayerMinutes from "../components/PlayerMinutes";
import ShotMap from "../components/ShotMap";
import { usePreferences } from "../preferences/context";
import PlayerAvatar from "../components/PlayerAvatar";
import PlayerGameLog from "../components/PlayerGameLog";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getPlayerDetails } from "../api/playersApi";
export default function PlayerDetailsPage() {
  const {
    t
  } = usePreferences();
  const {
    playerId
  } = useParams();
  const {
    data,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["player-details", playerId],
    queryFn: () => getPlayerDetails(playerId)
  });
  if (isLoading) return <p>{t("Loading...")}</p>;
  if (isError) return <p>{t("Unable to load data. Please try again.")}{/* error details are not user-facing */}</p>;
  const {
    player,
    averages = {},
    games = []
  } = data;
  return <section className="space-y-5">
      <PlayerHeader player={player} averages={averages} gamesCount={games.length} shots={games.flatMap(game => game.shots ?? [])} />


      <PlayerGameLog games={games} playerId={playerId} />
    </section>;
}
function PlayerHeader({
  player,
  averages,
  gamesCount,
  shots
}) {
  const {
    t
  } = usePreferences();
  return <div className="rounded-[20px] bg-surface p-5">
      <div className="flex items-center gap-4">
        <PlayerAvatar player={player} className="h-16 w-16" />

        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold sm:text-3xl">{player.name}</h1>
          <p className="text-sm text-muted">{gamesCount}{" "}{t("games played")}</p>
        </div>
      </div>

      <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
        <section className="min-w-0" aria-label={t("Season averages")}>
          <h2 className="mb-4 text-lg font-bold">{t("Season averages")}</h2>
          <div className="grid grid-cols-3 gap-3">
            <MainStat label={t("PPG")} value={averages.ppg} />
            <MainStat label={t("RPG")} value={averages.rpg} />
            <MainStat label={t("APG")} value={averages.apg} />
            <MainStat label={t("SPG")} value={averages.spg} />
            <MainStat label={t("BPG")} value={averages.bpg} />
            <MainStat label={t("TPG")} value={averages.tpg} />
            <div className="col-span-3 rounded-2xl bg-raised p-3 text-center"><PlayerMinutes playerId={player.id ?? player.player_id} /></div>
          </div>
        </section>
        <section className="min-w-0 rounded-2xl bg-raised p-4" aria-label={t("Season shot map")}>
          <h2 className="mb-4 text-lg font-bold">{t("Season shot map")}</h2>
          <ShotMap shots={shots} />
        </section>
      </div>
    </div>;
}
function MainStat({
  label,
  value
}) {
  const {
    t
  } = usePreferences();
  return <div className="rounded-2xl bg-raised p-3 text-center">
      <div dir="ltr" className="text-2xl font-bold text-accent">
        {Number(value ?? 0)}
      </div>
      <div className="mt-1 text-xs text-muted">{t(label)}</div>
    </div>;
}
