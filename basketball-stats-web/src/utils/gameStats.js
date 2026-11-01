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
  const points = events
    .filter((event) => scoringPoints[event.type] &&
      event.team_score_at_event != null && event.opponent_score_at_event != null)
    .sort((a, b) => Number(a.period) - Number(b.period) ||
      Number(b.clock_sec_remaining) - Number(a.clock_sec_remaining) ||
      new Date(a.created_at) - new Date(b.created_at))
    .map((event) => {
      const gameSecond = (Number(event.period) - 1) * length +
        length - Number(event.clock_sec_remaining);
      return {
        gameSecond,
        minute: +(gameSecond / 60).toFixed(1),
        scoreDiff: Number(event.team_score_at_event) - Number(event.opponent_score_at_event),
      };
    });
  return [{ gameSecond: 0, minute: 0, scoreDiff: 0 }, ...points];
}
