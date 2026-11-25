import test from "node:test";
import assert from "node:assert/strict";
import { getScoringTeamStats } from "../src/utils/gameStats.js";

const eventsFor = types => types.map((type, index) => ({
  id: String(index), type, period: "1", clock_sec_remaining: String(600 - index),
}));
const game = { team_score: "8", opponent_score: "7", is_home_game: false };
const events = eventsFor(["OPP_THREE_MADE", "TWO_MADE", "THREE_MADE", "OPP_TWO_MADE", "OPP_TWO_MADE", "THREE_MADE"]);
const expected = {
  afeka: { largest_lead: 2, max_scoring_run: 5 },
  opponent: { largest_lead: 3, max_scoring_run: 4 },
};
const unavailable = {
  afeka: { largest_lead: null, max_scoring_run: null },
  opponent: { largest_lead: null, max_scoring_run: null },
};

test("largest leads and unanswered points follow game chronology for either home/away orientation", () => {
  const shuffled = [events[5], ...events.slice(0, 5).reverse()].map(event => Object.freeze({ ...event }));
  Object.freeze(shuffled);
  assert.deepEqual(getScoringTeamStats(game, shuffled), expected);
  assert.deepEqual(getScoringTeamStats({ ...game, is_home_game: true }, shuffled), expected);
  assert.equal(shuffled[0].id, "5", "the shared event list remains unchanged");
});

test("all six made shot types count; missed shots, fouls, markers and deleted scores do not affect runs", () => {
  const plays = eventsFor(["TWO_MADE", "FT_MISS", "THREE_MADE", "PF", "FT_MADE", "OPP_TWO_MADE", "PERIOD_END", "OPP_THREE_MADE", "OPP_FT_MADE"]);
  plays.push({ type: "OPP_THREE_MADE", is_deleted: true });
  assert.deepEqual(getScoringTeamStats({ team_score: 6, opponent_score: 6 }, plays), {
    afeka: { largest_lead: 6, max_scoring_run: 6 },
    opponent: { largest_lead: 0, max_scoring_run: 6 },
  });
});

test("unanswered runs continue across period breaks and overtime", () => {
  const plays = [
    { type: "TWO_MADE", period: 4, clock_sec_remaining: 10 },
    { type: "PERIOD_END", period: 4, clock_sec_remaining: 0 },
    { type: "PERIOD_START", period: 5, clock_sec_remaining: 300 },
    { type: "FT_MADE", period: 5, clock_sec_remaining: 280 },
    { type: "FT_MADE", period: 5, clock_sec_remaining: 280 },
    { type: "THREE_MADE", period: 5, clock_sec_remaining: 120 },
    { type: "OPP_TWO_MADE", period: 5, clock_sec_remaining: 0 },
  ];
  assert.deepEqual(getScoringTeamStats({ team_score: 7, opponent_score: 2 }, plays), {
    afeka: { largest_lead: 7, max_scoring_run: 7 },
    opponent: { largest_lead: 0, max_scoring_run: 2 },
  });
});

test("same-clock baskets use recording time and precision-safe local IDs to retain scoring order", () => {
  const plays = eventsFor(["TWO_MADE", "THREE_MADE", "OPP_TWO_MADE", "TWO_MADE"]).map((event, index) => ({
    ...event, clock_sec_remaining: 300, created_at: "100", local_id: String(9007199254740992n + BigInt(index)),
  }));
  const result = {
    afeka: { largest_lead: 5, max_scoring_run: 5 },
    opponent: { largest_lead: 0, max_scoring_run: 2 },
  };
  assert.deepEqual(getScoringTeamStats({ team_score: 7, opponent_score: 2 }, [...plays].reverse()), result);
  const timestamps = plays.map((event, index) => ({ ...event, local_id: String(10 - index), created_at: new Date(1000 + index).toISOString() }));
  assert.deepEqual(getScoringTeamStats({ team_score: 7, opponent_score: 2 }, timestamps.reverse()), result);
});

test("missing opponent scoring, partial feeds and unknown final scores stay unavailable", () => {
  for (const detail of [
    { game, events: events.filter(event => !event.type.startsWith("OPP_")) },
    { game, events: events.slice(1) },
    { game, events: [] },
    { game: {}, events },
    { game: { ...game, team_score: "" }, events },
    { game: { ...game, opponent_score: null }, events },
    { game: { ...game, team_score: -1 }, events },
  ]) assert.deepEqual(getScoringTeamStats(detail.game, detail.events), unavailable);
});

test("missing or invalid scoring clocks cannot establish the event sequence", () => {
  for (const change of [
    { period: null }, { period: 0 }, { period: "invalid" },
    { clock_sec_remaining: null }, { clock_sec_remaining: "" },
    { clock_sec_remaining: "invalid" }, { clock_sec_remaining: -1 },
  ]) assert.deepEqual(getScoringTeamStats(game, [{ ...events[0], ...change }, ...events.slice(1)]), unavailable);
});

test("recorded shutouts and teams that never led have valid zero values", () => {
  assert.deepEqual(getScoringTeamStats({ team_score: 0, opponent_score: 3 }, eventsFor(["OPP_THREE_MADE"])), {
    afeka: { largest_lead: 0, max_scoring_run: 0 },
    opponent: { largest_lead: 3, max_scoring_run: 3 },
  });
  assert.deepEqual(getScoringTeamStats({ team_score: 0, opponent_score: 0 }, []), {
    afeka: { largest_lead: 0, max_scoring_run: 0 },
    opponent: { largest_lead: 0, max_scoring_run: 0 },
  });
});

test("stale score snapshots do not replace scores reconstructed from complete scoring events", () => {
  assert.deepEqual(getScoringTeamStats(game, events.map(event => ({
    ...event, team_score_at_event: 100, opponent_score_at_event: 200,
  }))), expected);
});
