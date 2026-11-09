import { usePreferences } from "../preferences/context";
import { leagueStandings } from "../data/leagueStandings";
import TeamLogo from "../components/TeamLogo";

const columns = [
  ["GP", "Games played", "gamesPlayed"],
  ["W", "Wins", "wins"],
  ["L", "Losses", "losses"],
  ["+/-", "Point difference", "pointDifference"],
  ["Pts", "League points", "leaguePoints"],
];

export default function LeaguePage() {
  const { t, language } = usePreferences();
  return <section className="min-w-0 space-y-5" dir={language === "he" ? "rtl" : "ltr"}>
    <h1 className="text-3xl font-bold">{t("League standings")}</h1>
    <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
      <div className="overflow-x-auto" role="region" aria-label={t("League standings, scroll for more statistics")} tabIndex={0}>
        <table className="w-full min-w-[36rem] table-fixed border-collapse text-sm">
          <caption className="sr-only">{t("League standings")}</caption>
          <colgroup><col className="w-12" /><col className="w-48 sm:w-80" />{columns.map(([, , key]) => <col key={key} />)}</colgroup>
          <thead><tr className="border-b border-line text-xs text-muted">
            <th scope="col" className="px-2 py-4 text-center">#</th>
            <th scope="col" className="sticky start-0 z-10 bg-surface px-3 py-4 text-start">{t("Team")}</th>
            {columns.map(([label, full, key]) => <th key={key} scope="col" title={t(full)} className="px-2 py-4 text-center"><bdi dir={key === "pointDifference" ? "ltr" : undefined}>{t(label)}</bdi></th>)}
          </tr></thead>
          <tbody>{leagueStandings.map((team, index) => {
            const name = language === "he" ? team.nameHe : team.nameEn;
            return <tr key={team.id} className="border-b border-line last:border-b-0">
              <td dir="ltr" className="px-2 py-4 text-center font-semibold text-muted">{index + 1}</td>
              <th scope="row" className="sticky start-0 z-10 bg-surface px-3 py-4 text-start font-semibold">
                <div className="flex min-w-0 items-center gap-3"><TeamLogo name={team.logoName} className="h-9 w-9" /><span className="min-w-0 break-words">{name}</span></div>
              </th>
              {columns.map(([, , key]) => <td key={key} dir="ltr" className="px-2 py-4 text-center tabular-nums">{key === "pointDifference" && team[key] > 0 ? `+${team[key]}` : team[key]}</td>)}
            </tr>;
          })}</tbody>
        </table>
      </div>
    </div>
  </section>;
}
