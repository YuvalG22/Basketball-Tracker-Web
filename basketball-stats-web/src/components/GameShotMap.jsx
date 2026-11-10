import { useState } from "react";
import { usePreferences } from "../preferences/context";
import { gameShots } from "../utils/gameShots";
import ShotMap from "./ShotMap";
export default function GameShotMap({ shots = [], opponentName }) {
  const { t, teamName } = usePreferences();
  const [team, setTeam] = useState("afeka");
  const valid = gameShots(shots);
  const opponent = valid.filter(shot => shot.type.startsWith("OPP_"));
  const selectedTeam = team === "opponent" && opponent.length ? "opponent" : "afeka";
  const visible = selectedTeam === "opponent" ? opponent.map(shot => ({ ...shot, type: shot.type.replace(/^OPP_/, "") })) : valid.filter(shot => !shot.type.startsWith("OPP_"));
  return <section className="rounded-2xl bg-surface p-4 sm:p-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-bold">{t("Shot map")}</h2>
      {opponent.length > 0 && <div className="flex flex-wrap gap-2" role="group" aria-label={t("Team")}>
        {[["afeka", teamName("Afeka")], ["opponent", teamName(opponentName)]].map(([value, label]) => <button type="button" key={value} aria-pressed={selectedTeam === value} onClick={() => setTeam(value)} className={`rounded-full px-3 py-1 text-sm font-semibold ${selectedTeam === value ? "bg-accent text-white" : "bg-raised text-muted"}`}>{label}</button>)}
      </div>}
    </div>
    <p className="mb-4 text-center text-sm text-muted">{selectedTeam === "opponent" ? teamName(opponentName) : teamName("Afeka")}</p>
    <ShotMap key={selectedTeam} shots={visible} />
  </section>;
}
