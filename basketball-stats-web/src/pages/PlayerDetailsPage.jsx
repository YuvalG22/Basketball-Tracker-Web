import { useStatsSeason } from "../hooks/useStatsSeason";
import StatsSeasonSelector from "../components/StatsSeasonSelector";
import { sumShooting, shootingStats, shootingValue } from "../utils/playerShooting";
import { useMinutes } from "../timing/context";
import { formatMinutes } from "../utils/playingTime";
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
  const selection = useStatsSeason();
  const {
    data,
    isLoading,
    isError
  } = useQuery({
    queryKey: ["player-details", playerId, selection.season],
    queryFn: () => getPlayerDetails(playerId, selection.season),
    enabled: selection.ready
  });
  const selector = <StatsSeasonSelector selection={selection} />;
  if (selection.query.isError || isError) return <section className="space-y-5">{selector}<p role="alert">{t("Unable to load data. Please try again.")}</p></section>;
  if (!selection.ready || isLoading || !data) return <section className="space-y-5">{selector}<p role="status">{t("Loading...")}</p></section>;
  const {
    player,
    averages = {},
    games = []
  } = data;
  return <section className="space-y-5">
      {selector}
      {games.length === 0 && <p role="status" className="rounded-xl bg-raised p-3 text-muted">{t("No player stats available for this season.")}</p>}
      <PlayerHeader season={selection.season} player={player} averages={averages} games={games} gamesCount={games.length} shots={games.flatMap(game => game.shots ?? [])} />
      <PlayerGameLog key={selection.season} games={games} playerId={playerId} player={player} playerName={player.name} />
    </section>;
}
function PlayerHeader({
  season,
  player,
  averages,
  gamesCount,
  games,
  shots
}) {
  const {
    t, playerName
  } = usePreferences();
  const timing = useMinutes(season);
  return <div className="rounded-[20px] bg-surface p-5">
      <div className="flex items-center gap-4">
        <PlayerAvatar player={player} className="h-16 w-16" />

        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold sm:text-3xl">{playerName(player.name)}</h1>
          <p className="text-sm text-muted">{gamesCount}{" "}{t("games played")}</p>
        </div>
      </div>

      <section className="mt-6 min-w-0" aria-label={t("Season averages")}>
        <h2 className="mb-4 text-lg font-bold">{t("Season averages")}</h2>
        <div className="overflow-x-auto" tabIndex={0}>
          <div className="grid min-w-[560px] grid-cols-7 gap-3">
            <MainStat label={t("MPG")} value={formatMinutes(timing.averages[String(player.id ?? player.player_id)])} />
            <MainStat label={t("PPG")} value={averages.ppg} />
            <MainStat label={t("RPG")} value={averages.rpg} />
            <MainStat label={t("APG")} value={averages.apg} />
            <MainStat label={t("SPG")} value={averages.spg} />
            <MainStat label={t("BPG")} value={averages.bpg} />
            <MainStat label={t("TPG")} value={averages.tpg} />
          </div>
        </div>
      </section>
      <section className="mt-6 border-t border-line pt-5" aria-label={t("Season shooting")}>
        <h2 className="mb-4 text-lg font-bold">{t("Season shooting")}</h2>
        <div className="grid min-w-0 items-stretch gap-4 md:grid-cols-2">
          <SeasonShooting games={games} />
          <div className="min-w-0 rounded-2xl bg-raised p-4 sm:p-5" aria-label={t("Season shot map")}>
            <h3 className="mb-4 font-bold">{t("Season shot map")}</h3>
            <ShotMap shots={shots} />
          </div>
        </div>
      </section>
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
        {value ?? 0}
      </div>
      <div className="mt-1 text-xs text-muted">{t(label)}</div>
    </div>;
}

function SeasonShooting({ games }) {
  const { t } = usePreferences();
  return <div className="flex min-w-0 flex-col rounded-2xl bg-raised p-4 sm:p-5">
    <h3 className="mb-4 font-bold">{t("Shooting")}</h3>
    <dl className="grid flex-1 grid-rows-4 divide-y divide-line">
      {shootingStats(sumShooting(games)).map(([label, made, attempts]) => <div key={label} className="flex min-h-16 items-center justify-between gap-4 py-4">
        <dt className="text-sm text-muted">{t(label)}</dt>
        <dd dir="ltr" className="shrink-0 text-lg font-bold tabular-nums text-accent">{shootingValue(made, attempts, 1)}</dd>
      </div>)}
    </dl>
  </div>;
}
