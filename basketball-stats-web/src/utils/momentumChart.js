// Keep the event ledger intact; only the drawing collapses simultaneous scores.
export function prepareMomentumChart(points, periodLength = 600, regulationPeriods = 4, recordedPeriods = 0) {
  const length = Number(periodLength) || 600;
  const periods = Math.max(Number(regulationPeriods) || 4, Number(recordedPeriods) || 0,
    ...points.map(point => point.period));
  const duration = periods * length;
  const byTime = new Map();
  for (const point of points) byTime.set(point.gameSecond, { ...point, recordedPoint: point });
  const data = [...byTime.values()].sort((a, b) => a.gameSecond - b.gameSecond);
  const last = data.at(-1);
  if (last && last.gameSecond < duration) data.push({ ...last, gameSecond: duration });
  const limit = Math.max(5, Math.ceil(Math.max(0, ...points.map(point => Math.abs(point.scoreDiff))) / 5) * 5);
  return { data, duration, periods, limit, length, hasScores: points.length > 1 };
}
