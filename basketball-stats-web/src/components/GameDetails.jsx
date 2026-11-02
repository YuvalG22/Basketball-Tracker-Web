import { formatGameRound } from "../utils/gameRound";
import { usePreferences } from "../preferences/context";
import { Area, YAxis, XAxis, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart } from "recharts";
import TeamLogo from "./TeamLogo";
import BoxScore from "./BoxScore";
import PlayByPlay from "./PlayByPlay";
import MomentumTooltip from "./MomentumTooltip";
import { getPeriodScores, buildMomentumPoints, momentumAxisClock } from "../utils/gameStats";
export default function GameStatsView({
  game,
  players = [],
  events = [],
  lineupEvents = []
}) {
  const {
    t
  } = usePreferences();
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
      <div className="game-panels">
        <div className="game-panel" role="region" aria-label={t("Box Score")}>
          <BoxScore game={game} players={players} events={events} lineupEvents={lineupEvents} />
        </div>
        <div className="game-panel" role="region" aria-label={t("Play by Play timeline")}>
          <PlayByPlay events={events} game={game} players={players} />
        </div>
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
  const canShowMomentum = momentumPoints.length > 0 && momentumPoints.some(p => p.scoreDiff !== 0);
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
      <div dir="ltr" className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-6">
        <HeaderTeam name={homeTeamName} align="left" />

        <div className="text-center">
          <div dir="ltr" className="whitespace-nowrap text-2xl font-black tracking-tight text-ink sm:text-4xl">

            {homeScore} - {awayScore}
          </div>

          <div className="mt-2 text-sm font-bold text-muted">{t("FINAL")}


          </div>
        </div>

        <HeaderTeam name={awayTeamName} align="right" />
      </div>
      {canShowMomentum && <div className="mt-4">
          <MomentumAreaChart momentumPoints={momentumPoints} opponentName={game.opponent_name} periodLength={game.quarter_length_sec} regulationPeriods={regulationPeriods} />
        </div>}
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
function MomentumAreaChart({
  momentumPoints,
  opponentName,
  periodLength = 600,
  regulationPeriods = 4
}) {
  const {
    t,
    teamName
  } = usePreferences();
  const data = momentumPoints.map(p => ({
    ...p,
    positiveDiff: p.scoreDiff > 0 ? p.scoreDiff : 0,
    negativeDiff: p.scoreDiff < 0 ? p.scoreDiff : 0
  }));
  const maxAbs = Math.max(1, ...data.map(d => Math.abs(d.scoreDiff)));
  return <div className="w-full rounded-2xl bg-raised p-3">
      <p className="mb-2 text-xs text-muted">{t("Lead from recorded scoring events")}</p>
      <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs font-semibold"><span className="text-accent">{t("Afeka lead")}</span><span className="text-orange">{teamName(opponentName)}{" "}{t("lead")}</span></div>
      <div dir="ltr" className="h-44" role="img" aria-label={t("Scoring momentum: Afeka score minus opponent score by period and game clock")}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{
        width: 320,
        height: 176
      }}>
        <AreaChart data={data}>
          <XAxis dataKey="gameSecond" type="number" domain={[0, "dataMax"]} tickFormatter={value => t(momentumAxisClock(value, periodLength, regulationPeriods, Math.max(...data.map(point => point.period))))} tick={{
            fontSize: 10
          }} minTickGap={32} />
          <Tooltip content={<MomentumTooltip opponentName={opponentName} regulationPeriods={regulationPeriods} />} />
          <YAxis width={24} domain={[-maxAbs, maxAbs]} ticks={[-maxAbs, 0, maxAbs]} axisLine={false} tickLine={false} padding={{
            top: 10,
            bottom: 10
          }} tickFormatter={value => Math.abs(value)} />

          <ReferenceLine y={0} stroke="var(--color-muted)" />
          <Area type="stepAfter" isAnimationActive={false} dataKey="positiveDiff" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.8} dot={false} connectNulls activeDot={false} />


          <Area type="stepAfter" isAnimationActive={false} dataKey="negativeDiff" stroke="var(--color-orange)" fill="var(--color-orange)" fillOpacity={0.8} dot={false} connectNulls activeDot={false} />

        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>;
}
function HeaderTeam({
  name,
  align
}) {
  const {
    teamName
  } = usePreferences();
  return <div className={`flex flex-col items-center ${align === "right" ? "justify-self-end" : "justify-self-start"}`}>

      <TeamLogo name={name} className="h-14 w-20 sm:h-20 sm:w-32" />

      <div className="mt-3 max-w-full break-words text-center text-sm sm:text-lg font-black text-ink">
        {teamName(name)}
      </div>
    </div>;
}
