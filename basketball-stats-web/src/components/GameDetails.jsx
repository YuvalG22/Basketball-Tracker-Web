import GameShotMap from "./GameShotMap";
import { useId, useState } from "react";
import TeamStats from "./TeamStats";
import { formatGameRound } from "../utils/gameRound";
import { usePreferences } from "../preferences/context";
import TeamLogo from "./TeamLogo";
import BoxScore from "./BoxScore";
import PlayByPlay from "./PlayByPlay";
import MomentumChart from "./MomentumChart";
import QuarterScores from "./QuarterScores";
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
  const { t } = usePreferences();
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
      <div className="min-w-0">
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
  const { t } = usePreferences();
  const regulationPeriods = Number(game.quarters_count) || 4;
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
      <div className="game-result rounded-2xl px-3 py-4" style={{
        "--result-left": game.is_home_game ? "var(--momentum-team)" : "var(--momentum-opponent)",
        "--result-right": game.is_home_game ? "var(--momentum-opponent)" : "var(--momentum-team)"
      }}>
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
      </div>
      <div className="mt-4">
          <MomentumChart momentumPoints={momentumPoints} opponentName={game.opponent_name} periodLength={game.quarter_length_sec} regulationPeriods={regulationPeriods} recordedPeriods={periodScores.length} />
        </div>
      <QuarterScores periodScores={periodScores} regulationPeriods={regulationPeriods} homeTeamName={homeTeamName} awayTeamName={awayTeamName} />
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
