import { useState } from "react";
import { usePreferences } from "../preferences/context";

export default function ShotMap({ shots = [] }) {
  const { t } = usePreferences();
  const [filter, setFilter] = useState("all");
  return <>
    <ShotChart shots={shots} filter={filter} />
    <div className="mt-3 flex flex-wrap justify-center gap-2" role="group" aria-label={t("Filter shots")}>
      <FilterButton label={t("All shots")} active={filter === "all"} onClick={() => setFilter("all")} />
      <FilterButton label={t("Makes")} active={filter === "makes"} onClick={() => setFilter("makes")} />
      <FilterButton label={t("Misses")} active={filter === "misses"} onClick={() => setFilter("misses")} />
    </div>
    {shots.length === 0 && <p className="mt-3 text-center text-sm text-muted">{t("No shot locations recorded.")}</p>}
  </>;
}

function ShotChart({
  shots,
  filter
}) {
  const {
    t
  } = usePreferences();
  const filteredShots = shots.filter(shot => {
    const isMade = shot.type === "TWO_MADE" || shot.type === "THREE_MADE";
    if (filter === "makes") {
      return isMade;
    }
    if (filter === "misses") {
      return !isMade;
    }
    return true;
  });
  return <div dir="ltr" className="relative mx-auto bg-white aspect-[15/14] w-full max-w-[320px] overflow-hidden border border-line">
      <img src="/court_full.svg" alt={t("Basketball court")} className="absolute inset-0 h-full w-full object-fill" />

      {filteredShots.map((shot, index) => {
      const x = Number(shot.shot_x);
      const y = Number(shot.shot_y);
      const isMade = shot.type === "TWO_MADE" || shot.type === "THREE_MADE";
      return <div key={index} className="absolute -translate-x-1/2 -translate-y-1/2" style={{
        left: `${x / 15 * 100}%`,
        top: `${y / 14 * 100}%`
      }}>

            {isMade ? <div className="h-3 w-3 rounded-full border-[3px] border-success" /> : <div className="relative h-3 w-3">
                <div className="absolute left-1/2 top-1/2 h-3 w-[3px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-danger" />
                <div className="absolute left-1/2 top-1/2 h-3 w-[3px] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-danger" />
              </div>}
          </div>;
    })}
    </div>;
}
function FilterButton({
  label,
  active,
  onClick
}) {
  const {
    t
  } = usePreferences();
  return <button type="button" aria-pressed={active} onClick={onClick} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${active ? "bg-accent text-white" : "bg-surface text-muted"}`}>

      {t(label)}
    </button>;
}
