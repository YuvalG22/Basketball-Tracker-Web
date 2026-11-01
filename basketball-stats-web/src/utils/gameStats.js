export function completedGames(games) {
  return (games ?? [])
    .filter((game) => game.status === "FINISHED")
    .map((game) => ({
      ...game,
      team_score: Number(game.team_score ?? 0),
      opponent_score: Number(game.opponent_score ?? 0),
    }));
}

const scoringPoints = {
  TWO_MADE: 2, THREE_MADE: 3, FT_MADE: 1,
  OPP_TWO_MADE: 2, OPP_THREE_MADE: 3, OPP_FT_MADE: 1,
};

export function getPeriodScores(events, isHomeGame, quartersCount = 4) {
  const count = Math.max(
    Number(quartersCount) || 4,
    ...events.map((event) => Number(event.period) || 0),
  );
  return Array.from({ length: count }, (_, index) => {
    const period = index + 1;
    let team = 0;
    let opponent = 0;
    for (const event of events) {
      if (Number(event.period) !== period) continue;
      const points = scoringPoints[event.type] ?? 0;
      if (event.type?.startsWith("OPP_")) opponent += points;
      else team += points;
    }
    return {
      period,
      home: isHomeGame ? team : opponent,
      away: isHomeGame ? opponent : team,
    };
  });
}

export function buildMomentumPoints(events, quarterLengthSec = 600) {
  const length = Number(quarterLengthSec) || 600;
  let teamScore = 0;
  let opponentScore = 0;
  const points = events
    .filter(event => scoringPoints[event.type])
    .sort((a, b) => Number(a.period) - Number(b.period) ||
      Number(b.clock_sec_remaining) - Number(a.clock_sec_remaining))
    .map(event => {
      const value = scoringPoints[event.type];
      if (event.type.startsWith("OPP_")) opponentScore += value;
      else teamScore += value;
      const period = Number(event.period);
      const clockSecRemaining = Math.max(0, Math.min(length, Number(event.clock_sec_remaining) || 0));
      const gameSecond = (period - 1) * length + length - clockSecRemaining;
      return { gameSecond, period, clockSecRemaining, minute: +(gameSecond / 60).toFixed(1), teamScore, opponentScore,
        scoreDiff: teamScore - opponentScore };
    });
  return [{ gameSecond: 0, period: 1, clockSecRemaining: length, minute: 0, teamScore: 0, opponentScore: 0, scoreDiff: 0 }, ...points];
}

export function gameClockLabel(period, secondsRemaining, regulationPeriods = 4) {
  const seconds = Math.max(0, Math.floor(Number(secondsRemaining) || 0));
  const label = period <= regulationPeriods ? `Q${period}` : `OT${period - regulationPeriods}`;
  return `${label} ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function momentumAxisClock(elapsed, periodLength = 600, regulationPeriods = 4, lastPeriod = 4) {
  const length = Number(periodLength) || 600;
  const seconds = Math.max(0, Math.floor(Number(elapsed) || 0));
  const period = Math.min(lastPeriod, Math.floor(seconds / length) + 1);
  return gameClockLabel(period, length - (seconds - (period - 1) * length), regulationPeriods);
}
