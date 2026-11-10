import test from "node:test";
import assert from "node:assert/strict";
import { buildMomentumPoints } from "../src/utils/gameStats.js";
import { prepareMomentumChart } from "../src/utils/momentumChart.js";
import { englishTeamName, AFEKA_NAME_HE } from "../src/utils/teamNames.js";
import { findTeam } from "../src/utils/teamLogos.js";
import { translate } from "../src/preferences/translations.js";

test("chart collapses simultaneous scoring only for drawing and retains the exact event for tooltips", () => {
  const points = buildMomentumPoints([
    { type: "TWO_MADE", period: 1, clock_sec_remaining: 500 },
    { type: "OPP_THREE_MADE", period: 1, clock_sec_remaining: 500 },
    { type: "FT_MADE", period: 1, clock_sec_remaining: 400 },
  ]);
  const original = structuredClone(points);
  const chart = prepareMomentumChart(points);
  assert.deepEqual(chart.data.map(p => [p.gameSecond, p.scoreDiff]), [[0, 0], [100, -1], [200, 0], [2400, 0]]);
  assert.deepEqual(chart.data[1].recordedPoint, points[2]);
  assert.deepEqual(chart.data.at(-1).recordedPoint, points.at(-1));
  assert.equal(chart.data.at(-1).recordedPoint.clockSecRemaining, 400);
  assert.deepEqual(points, original);
  assert.equal(chart.hasScores, true);
});

test("chart includes non-scoring overtime periods and rounds symmetric lead limits", () => {
  const points = buildMomentumPoints(Array.from({ length: 4 }, (_, i) => ({ type: "THREE_MADE", period: 1, clock_sec_remaining: 500 - i })));
  const chart = prepareMomentumChart(points, "600", 4, 6);
  assert.equal(chart.duration, 3600);
  assert.equal(chart.periods, 6);
  assert.equal(chart.limit, 15);
  assert.equal(chart.data.at(-1).scoreDiff, 12);
  const overtime = prepareMomentumChart(buildMomentumPoints([{ type: "OPP_TWO_MADE", period: 5, clock_sec_remaining: 20 }]));
  assert.equal(overtime.periods, 5);
  assert.equal(overtime.duration, 3000);
  assert.equal(overtime.limit, 5);
  assert.equal(prepareMomentumChart(buildMomentumPoints([])).hasScores, false);
});

test("old and new college aliases share canonical localized names and the same logo identity", () => {
  for (const alias of ["Afeka", "Afeka College", "אפקה", "מכללת אפקה", "Afeka – Tel Aviv Academic College of Engineering"]) {
    assert.equal(findTeam(alias).id, "afeka");
    assert.equal(englishTeamName(alias), "Afeka College");
  }
  assert.equal(translate("Afeka", "en"), "Afeka College");
  assert.equal(translate("Afeka", "he"), AFEKA_NAME_HE);
  assert.equal(translate("Afeka College", "he"), "מכללת אפקה");
});
