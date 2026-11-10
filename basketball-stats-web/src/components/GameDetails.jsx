import GameShotMap from "./GameShotMap";
import { useId, useState } from "react";
import TeamStats from "./TeamStats";
import { formatGameRound } from "../utils/gameRound";
import { usePreferences } from "../preferences/context";
import TeamLogo from "./TeamLogo";
import BoxScore from "./BoxScore";
import PlayByPlay from "./PlayByPlay";
import MomentumChart from "./MomentumChart";
import { getPeriodScores, buildMomentumPoints } from "../utils/gameStats";
export default function GameStatsView(props) {
  return <GameStatsContent key={props.game.id} {...props} />;
}
function GameStatsContent({
  game,
  players = [],
  events = [],
  teamStats,
  shots = [],
  lineupEvents = []
}) {
  const {
    t
  } = usePreferences();
  const [activeTab, setActiveTab] = useState("box");
  const tabId = useId();
  const tabs = [["box", "Box Score"], ["pbp", "Play by Play"], ["team", "Team Stats"], ["shots", "Shot map"]];
  const momentumPoints = buildMomentumPoints(events, game.quarter_length_sec);
  const teamScore = Number(game.team_score ?? 0);
  const opponentScore = Number(game.opponent_score ?? 0);
  const homeTeamName = game.is_home_game ? "Afeka" : game.opponent_name;
  const awayTeamName = game.is_home_game ? game.opponent_name : "Afeka";
  const homeScore = game.is_home_game ? teamScore : opponentScore;
  const awayScore = game.is_home_game ? opponentScore : teamScore;
  const periodScores = getPeriodScores(events, game.is_home_game, game.quarters_count);
  return <section className="space-y-5">
      <GameHeader game={game} homeTeamName={homeTeamName} awayTeamName={awayTeamName} homeScore={homeScore} awayScore={awayScore} periodScores={periodScores} momentumPoints={momentumPoints} />
      <div>
        <div role="tablist" aria-label={t("Game statistics")} className="mb-4 flex gap-1 overflow-x-auto border-b border-line sm:gap-2" onKeyDown={event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const direction = document.documentElement.dir === "rtl" ? -1 : 1;
          const index = tabs.findIndex(([key]) => key === activeTab);
          const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? direction : -direction) + tabs.length) % tabs.length;
          setActiveTab(tabs[next][0]);
          document.getElementById(`${tabId}-${tabs[next][0]}`)?.focus();
        }}>
          {tabs.map(([key, label]) => <button key={key} id={`${tabId}-${key}`} role="tab" aria-selected={activeTab === key} aria-controls={`${tabId}-${key}-panel`} tabIndex={activeTab === key ? 0 : -1} onClick={() => setActiveTab(key)} className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-semibold ${activeTab === key ? "border-accent text-accent" : "border-transparent text-muted"}`}>{t(label)}</button>)}
        </div>
        {tabs.map(([key]) => <div key={key} id={`${tabId}-${key}-panel`} role="tabpanel" aria-labelledby={`${tabId}-${key}`} hidden={activeTab !== key} tabIndex={0}>
          {key === "box" ? <BoxScore game={game} players={players} events={events} lineupEvents={lineupEvents} /> : key === "pbp" ? <PlayByPlay events={events} game={game} players={players} /> : key === "team" ? <TeamStats stats={teamStats} opponentName={game.opponent_name} /> : <GameShotMap shots={shots} opponentName={game.opponent_name} />}
        </div>)}
      </div>
    </section>;
}
function GameHeader({
  game,
  homeTeamName,
  awayTeamName,
  homeScore,
  awayScore,
  periodScores,
  momentumPoints
}) {
  const {
    t,
    teamName
  } = usePreferences();
  const regulationPeriods = Number(game.quarters_count) || 4;
  const scoreColumns = {
    gridTemplateColumns: `minmax(5rem, 1.5fr) repeat(${periodScores.length + 1}, minmax(2.5rem, 1fr))`
  };
  return <div className="rounded-[20px] bg-surface p-4">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div className="rounded-full bg-raised px-3 py-1 text-xs font-bold text-muted">{t("FINAL")}


        </div>

        <div className="text-xs bg-raised text-muted rounded-full px-3 py-1">
          {`${formatGameRound(game, t)} • ${new Date(Number(game.game_date_epoch)).toLocaleDateString("he-IL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        })}`}
        </div>
      </div>
      <div dir="ltr" className="mx-auto grid w-full max-w-xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 sm:gap-4">
        <HeaderTeam name={homeTeamName} />

        <div className="text-center">
          <div dir="ltr" className="whitespace-nowrap text-2xl font-black tracking-tight text-ink sm:text-4xl">

            {homeScore} - {awayScore}
          </div>

          <div className="mt-2 text-sm font-bold text-muted">{t("FINAL")}


          </div>
        </div>

        <HeaderTeam name={awayTeamName} />
      </div>
      <div className="mt-4">
          <MomentumChart momentumPoints={momentumPoints} opponentName={game.opponent_name} periodLength={game.quarter_length_sec} regulationPeriods={regulationPeriods} recordedPeriods={periodScores.length} />
        </div>
      <div className="mt-6 overflow-x-auto rounded-2xl bg-raised p-3">
        <div className="grid gap-2 text-center text-xs text-muted" style={scoreColumns}>
          <div></div>

          {periodScores.map(p => <div key={p.period}>{t(p.period <= regulationPeriods ? `Q${p.period}` : `OT${p.period - regulationPeriods}`)}</div>)}

          <div>{t("FINAL")}</div>
        </div>

        <div className="mt-2 grid gap-2 text-center text-sm" style={scoreColumns}>
          <div className="truncate text-start text-muted">
            {teamName(homeTeamName)}
          </div>

          {periodScores.map(p => <div className={`font-bold ${p.away < p.home ? "text-ink" : "text-muted"}`} key={p.period}>

              {p.home}
            </div>)}

          <div className={`font-bold ${awayScore < homeScore ? "text-accent" : "text-muted"}`}>

            {homeScore}
          </div>
        </div>

        <div className="mt-2 grid gap-2 text-center text-sm" style={scoreColumns}>
          <div className="truncate text-start text-muted">
            {teamName(awayTeamName)}
          </div>

          {periodScores.map(p => <div className={`font-bold ${p.away > p.home ? "text-ink" : "text-muted"}`} key={p.period}>

              {p.away}
            </div>)}

          <div className={`${awayScore > homeScore ? "text-accent font-bold" : "text-muted"}`}>

            {awayScore}
          </div>
        </div>
      </div>
    </div>;
}
function HeaderTeam({
  name
}) {
  const {
    teamName
  } = usePreferences();
  return <div className="flex min-w-0 flex-col items-center justify-self-center">

      <TeamLogo name={name} className="h-14 w-14 sm:h-20 sm:w-20" />

      <div className="mt-3 max-w-full break-words text-center text-sm sm:text-lg font-black text-ink">
        {teamName(name)}
      </div>
    </div>;
}
