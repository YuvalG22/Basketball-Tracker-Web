import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { createServer } from "vite";
import { filterPlays, periodLabel, scoreLabel, assistingPlayer } from "../src/utils/playByPlay.js";
import { findTeam, teams } from "../src/utils/teamLogos.js";
import { buildMomentumPoints, gameClockLabel, momentumAxisClock } from "../src/utils/gameStats.js";
import { existsSync, readFileSync } from "node:fs";

let vite, dom, root, container;
before(async () => {
  dom = new JSDOM('<!doctype html><button id="opener">Open</button><div id="root"></div>', { url: "http://localhost" });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.HTMLElement.prototype.getBoundingClientRect = function () { return { x: 0, y: 0, top: 0, left: 0, right: 320, bottom: 176, width: 320, height: 176 }; };
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  // jsdom does not implement the browser's native modal methods.
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  dom.window.HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  container = document.getElementById("root");
  root = createRoot(container);
  vite = await createServer({ server: { middlewareMode: true }, appType: "custom" });
});
after(async () => { await act(async () => root.unmount()); await vite.close(); dom.window.close(); });
const game = { id: "one", opponent_name: "Long opponent name", quarters_count: 4, quarter_length_sec: 600,
  game_date_epoch: 1, is_home_game: false, team_score: 101, opponent_score: 120 };
const events = [
  { id: "start", type: "PERIOD_START", period: 1 },
  { id: "a", type: "TWO_MADE", period: 1, clock_sec_remaining: 500, player_name: "First Player", assist_player_name: "Assistant" },
  { id: "b", type: "OPP_THREE_MADE", period: 5, clock_sec_remaining: 60 },
];
async function render(module, props, key = "one") {
  const { default: Component } = await vite.ssrLoadModule(module);
  try { await act(async () => root.render(React.createElement(Component, { ...props, key }))); } catch (error) { throw error.errors?.[0] ?? error; }
}
async function click(element) { await act(async () => element.click()); }

test("box score and play by play are both available in document order without tabs", async () => {
  await render("/src/components/GameDetails.jsx", { game, players: [], events });
  assert.equal(container.querySelector('[role="tablist"]'), null);
  const panels = container.querySelectorAll('.game-panel');
  assert.equal(panels.length, 2);
  assert.equal(panels[0].getAttribute('aria-label'), 'Box Score');
  assert.equal(panels[1].getAttribute('aria-label'), 'Play by Play timeline');
  assert.ok(panels[0].textContent.includes('Box Score'));
  assert.ok(panels[1].textContent.includes('First Player'));
  const css = readFileSync("src/index.css", "utf8");
  const layoutRules = [...css.matchAll(/\.game-panels\s*\{([^}]+)\}/g)];
  assert.equal(layoutRules.length, 1, "no breakpoint may override the stacked layout");
  assert.match(layoutRules[0][1], /grid-template-columns:\s*minmax\(0, 1fr\)\s*;/);
});

test("timeline filters periods and overtime and shows an empty period", async () => {
  await render("/src/components/PlayByPlay.jsx", { game, events });
  const button = text => [...container.querySelectorAll("button")].find(element => element.textContent === text);
  assert.match(container.textContent, /First Player/);
  assert.match(container.textContent, /Assist: Assistant/);
  assert.ok(container.querySelector("table.play-table"));
  assert.deepEqual([...container.querySelectorAll("thead th")].map(cell => cell.textContent), [game.opponent_name, "Score / Time", "Afeka"]);
  assert.equal(container.querySelector(".play-card"), null);
  assert.equal(container.querySelector("img"), null);
  assert.ok(container.querySelector('[data-team-side="home"] .play-home'));
  assert.ok(container.querySelector('[data-team-side="away"] .play-away'));
  assert.equal(container.querySelectorAll(".play-clock").length, 2);
  const center = container.querySelector(".play-score[aria-label]") ?? container.querySelector("tbody td.play-score");
  assert.equal(center.children[0].getAttribute("aria-label"), "Score");
  assert.ok(center.children[1].classList.contains("play-clock"));
  assert.match(center.children[1].textContent, /Q1.*8:20/);
  assert.equal(container.querySelector('[data-team-side="away"]').textContent.includes("First Player"), true);
  assert.equal(container.querySelector('[data-team-side="home"]').textContent.includes("3-point basket"), true);
  await click(button("OT1"));
  assert.doesNotMatch(container.textContent, /First Player/);
  assert.match(container.textContent, /3-point basket/);
  assert.equal(button("OT1").getAttribute("aria-pressed"), "true");
  await click(button("Q2"));
  assert.match(container.textContent, /No recorded events/);
  await click(button("All periods"));
  assert.match(container.textContent, /START Q1/);
  assert.match(container.textContent, /First Player/);
});

test("all database teams have local logo assets, aliases match and unknown teams fall back", async () => {
  for (const name of ["Afeka", "Ariel", "Bar Ilan", "HIT", "Reichman", "SCE", "Tel Aviv University", "Wingate"]) {
    assert.ok(findTeam(name), name);
  }
  assert.equal(findTeam("  BAR-ILAN  ").id, "biu");
  assert.equal(findTeam("אפקה").id, "afeka");
  assert.equal(findTeam("Not a real college"), undefined);
  for (const team of teams) assert.ok(existsSync(`public/teams/${team.file}`));
  await render("/src/components/TeamLogo.jsx", { name: "Afeka" });
  assert.equal(container.querySelector("img").getAttribute("src"), "/teams/afeka.svg");
  await act(async () => container.querySelector("img").dispatchEvent(new window.Event("error")));
  assert.match(container.querySelector("svg").getAttribute("aria-label"), /unavailable/);
});

test("player portraits fall back when absent, broken or Android-local", async () => {
  await render("/src/components/PlayerAvatar.jsx", { player: { name: "Player", number: 12, photo_url: "https://example.com/photo.png" } });
  assert.ok(container.querySelector("img"));
  await act(async () => container.querySelector("img").dispatchEvent(new window.Event("error")));
  assert.ok(container.querySelector("svg"));
  await render("/src/components/PlayerAvatar.jsx", { player: { name: "Player", photo_url: "content://android/photo/1" } });
  assert.equal(container.querySelector("img"), null);
  assert.match(container.querySelector("svg").getAttribute("aria-label"), /Player/);
});

test("momentum ignores non-scoring events and stale snapshots and retains same-clock scoring order", () => {
  const input = [
    { type: "FT_MADE", period: 1, clock_sec_remaining: 500, team_score_at_event: 99 },
    { type: "OPP_THREE_MADE", period: 1, clock_sec_remaining: 500 },
    { type: "AST", period: 1, clock_sec_remaining: 500 },
    { type: "TWO_MISS", period: 1, clock_sec_remaining: 400 },
  ];
  const points = buildMomentumPoints(input);
  assert.deepEqual(points.map(point => point.scoreDiff), [0, 1, -2]);
  assert.equal(points.at(-1).teamScore, 1);
  assert.equal(points.at(-1).opponentScore, 3);
});

test("score labels respect home and away orientation and missing snapshots", () => {
  const event = { team_score_at_event: "9", opponent_score_at_event: "12" };
  assert.equal(scoreLabel(event, true), "9 – 12");
  assert.equal(scoreLabel(event, false), "12 – 9");
  assert.equal(scoreLabel({ ...event, team_score_at_event: null }, false), "—");
  assert.equal(periodLabel(5, 4), "OT1");
  assert.deepEqual(filterPlays(events, 1).map(event => event.id), ["start", "a"]);
});

test("dialog opens, locks page scrolling, handles Escape and restores focus", async () => {
  const opener = document.getElementById("opener");
  opener.focus();
  let closed = false;
  await render("/src/components/Dialog.jsx", { title: "Statistics", children: React.createElement("button", null, "Close"), onClose: () => { closed = true; } });
  const dialog = container.querySelector("dialog");
  assert.ok(dialog.hasAttribute("open"));
  assert.equal(document.body.style.overflow, "hidden");
  await act(async () => dialog.dispatchEvent(new window.Event("cancel", { cancelable: true })));
  assert.ok(closed);
  await act(async () => root.render(null));
  assert.equal(document.body.style.overflow, "");
  assert.equal(document.activeElement, opener);
});


test("assisting player resolves from the recorded name or roster identity", () => {
  assert.equal(assistingPlayer({ assist_player_name: "Named Assistant" }), "Named Assistant");
  assert.equal(assistingPlayer({ assisted_by_player_remote_id: "p2" }, [{ player_id: "p2", player_name: "Roster Assistant" }]), "Roster Assistant");
  assert.equal(assistingPlayer({ assisted_by_player_remote_id: "unknown" }, []), null);
  assert.equal(assistingPlayer({}), null);
});

test("momentum labels show countdown clocks, period boundaries and overtime", () => {
  assert.equal(gameClockLabel(2, 484), "Q2 8:04");
  assert.equal(gameClockLabel(5, 59), "OT1 0:59");
  assert.equal(momentumAxisClock(0, 600, 4, 4), "Q1 10:00");
  assert.equal(momentumAxisClock(600, 600, 4, 4), "Q2 10:00");
  assert.equal(momentumAxisClock(2400, 600, 4, 4), "Q4 0:00");
  const point = buildMomentumPoints([{ type: "TWO_MADE", period: 2, clock_sec_remaining: 484 }]).at(-1);
  assert.equal(gameClockLabel(point.period, point.clockSecRemaining), "Q2 8:04");
});

test("momentum tooltip renders the recorded game clock and a plain score dash", async () => {
  await render("/src/components/MomentumTooltip.jsx", {
    active: true, opponentName: "Visitors", payload: [{ payload: {
      period: 3, clockSecRemaining: 125, teamScore: 60, opponentScore: 58, scoreDiff: 2,
    } }],
  });
  assert.match(container.textContent, /Q3 2:05/);
  assert.match(container.textContent, /Afeka 60 - 58 Visitors/);
  assert.doesNotMatch(container.textContent, /\?|elapsed/);
});
