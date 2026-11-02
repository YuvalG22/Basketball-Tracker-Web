import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
const renderClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
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
after(async () => { await act(async () => root.unmount()); await vite.close(); renderClient.clear(); dom.window.close(); });
const game = { id: "one", opponent_name: "Long opponent name", quarters_count: 4, quarter_length_sec: 600,
  game_date_epoch: 1, is_home_game: false, team_score: 101, opponent_score: 120 };
const events = [
  { id: "start", type: "PERIOD_START", period: 1 },
  { id: "a", type: "TWO_MADE", period: 1, clock_sec_remaining: 500, player_name: "First Player", assist_player_name: "Assistant" },
  { id: "b", type: "OPP_THREE_MADE", period: 5, clock_sec_remaining: 60 },
];
async function render(module, props, key = "one") {
  const { default: Component } = await vite.ssrLoadModule(module);
  try { await act(async () => root.render(React.createElement(QueryClientProvider, { client: renderClient }, React.createElement(Component, { ...props, key })))); } catch (error) { throw error.errors?.[0] ?? error; }
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
  assert.ok(document.activeElement === opener, "focus returns to the game row");
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


test("language and theme controls persist independent preferences and preserve the page", async () => {
  const { MemoryRouter } = await import("react-router-dom");
  const { default: Provider } = await vite.ssrLoadModule("/src/preferences/PreferencesProvider.jsx");
  const { default: Layout } = await vite.ssrLoadModule("/src/layout/MainLayout.jsx");
  globalThis.localStorage = window.localStorage;
  localStorage.clear();
  let systemDark = false, listener;
  window.matchMedia = () => ({ get matches() { return systemDark; }, addEventListener: (_, fn) => { listener = fn; }, removeEventListener: () => {} });
  const app = key => React.createElement(Provider, { key }, React.createElement(MemoryRouter, { initialEntries: ["/games"] }, React.createElement(Layout)));
  const select = async (index, value) => { await act(async () => { const el = container.querySelectorAll("select")[index]; el.value = value; el.dispatchEvent(new window.Event("change", { bubbles: true })); }); };
  try {
    await act(async () => root.render(app("initial")));
    assert.equal(document.documentElement.lang, "he");
    assert.equal(document.documentElement.dir, "rtl");
    assert.equal(document.documentElement.dataset.theme, "light");
    assert.match(container.textContent, /משחקים/);
    await select(1, "dark");
    await select(0, "en");
    assert.equal(document.documentElement.dir, "ltr");
    assert.equal(document.documentElement.dataset.theme, "dark");
    assert.match(container.textContent, /Games/);
    assert.equal(container.querySelector('[aria-current="page"]').getAttribute("href"), "/games");
    await act(async () => root.render(app("remount")));
    assert.equal(container.querySelectorAll("select")[0].value, "en");
    assert.equal(container.querySelectorAll("select")[1].value, "dark");
    await select(1, "system");
    await act(async () => { systemDark = true; listener(); });
    assert.equal(document.documentElement.dataset.theme, "dark");
    await act(async () => { systemDark = false; listener(); });
    assert.equal(document.documentElement.dataset.theme, "light");
  } finally { await act(async () => root.render(null)); localStorage.clear(); delete globalThis.localStorage; }
});

test("preferences safely default when browser storage is unavailable", async () => {
  const { default: Provider } = await vite.ssrLoadModule("/src/preferences/PreferencesProvider.jsx");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new Error("blocked"); } });
  try {
    await act(async () => root.render(React.createElement(Provider, null, "Content")));
    assert.equal(document.documentElement.lang, "he");
    assert.equal(document.documentElement.dataset.theme, "light");
    assert.equal(container.textContent, "Content");
  } finally { await act(async () => root.render(null)); delete globalThis.localStorage; }
});

test("player game log lists all stats and opens a centered performance dialog", async () => {
  const { QueryClient, QueryClientProvider } = await import("@tanstack/react-query");
  const { default: Log } = await vite.ssrLoadModule("/src/components/PlayerGameLog.jsx");
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  client.setQueryData(["games"], [{ id: "g1", team_score: "90", opponent_score: "100", is_home_game: false, is_playoff: true, playoff_stage: "QUARTER_FINAL", playoff_game_number: 1 }, { id: "g2", team_score: "100", opponent_score: "90" }]);
  const stats = { points: 19, rebounds: 8, defensive_rebounds: 6, offensive_rebounds: 2, assists: 4, steals: 2, blocks: 1, turnovers: 3, two_made: 5, two_miss: 2, three_made: 2, three_miss: 3, ft_made: 3, ft_miss: 1 };
  const games = [{ ...stats, game_id: "g1", opponent_name: "Visitors", round_number: 3, shots: [{ type: "TWO_MADE", shot_x: 5, shot_y: 6 }, { type: "THREE_MISS", shot_x: 7, shot_y: 9 }] }, { ...stats, game_id: "g2", opponent_name: "Others", round_number: 4 }];
  try {
    await act(async () => root.render(React.createElement(QueryClientProvider, { client }, React.createElement(Log, { games }))));
    assert.equal(container.querySelectorAll(".player-log-table tbody tr").length, 2);
    assert.equal(container.querySelectorAll('[aria-label="Loss"]').length, 1);
    assert.equal(container.querySelectorAll('[aria-label="Win"]').length, 1);
    const opener = container.querySelector('[aria-haspopup="dialog"]');
    for (const label of ["BLK", "TOV", "FG", "2PT", "3PT", "FT"]) assert.ok(container.querySelector("thead").textContent.includes(label), label);
    assert.match(opener.closest("tr").textContent, /L 90-100/);
    assert.ok(opener.closest("tr").textContent.includes("7/12 (58%)"));
    assert.doesNotMatch(container.querySelector("thead").textContent, /PIR|DREB|OREB|FG%/);
    opener.focus();
    await click(opener);
    let dialog = container.querySelector("dialog");
    assert.ok(dialog.classList.contains("stats-card-dialog"));
    assert.equal(dialog.classList.contains("stats-drawer"), false);
    assert.match(dialog.textContent, /Quarterfinal.*Game 1/);
    assert.match(opener.textContent, /Quarterfinal.*Game 1/);
    for (const label of ["Player statistics", "Shooting", "Shot map", "3/4 (75%)"]) assert.ok(dialog.textContent.includes(label), label);
    assert.equal(dialog.querySelectorAll('[style*="left:"]').length, 2);
    await click([...dialog.querySelectorAll("button")].find(el => el.textContent.trim() === "Makes"));
    assert.equal(dialog.querySelectorAll('[style*="left:"]').length, 1);
    await click([...dialog.querySelectorAll("button")].find(el => el.textContent.trim() === "Close"));
    assert.equal(container.querySelector("dialog"), null);
    assert.equal(document.activeElement, opener);
  } finally { await act(async () => root.render(null)); client.clear(); }
});

test("box score preserves column and roster order without sorting controls", async () => {
  const players = [
    { player_id:'a',player_name:'Alpha',points:10 }, { player_id:'b',player_name:'Beta',points:2 }, { player_id:'c',player_name:'Gamma',points:30 },
  ].map(player => ({ ...player, defensive_rebounds:2,offensive_rebounds:1,assists:1,steals:0,blocks:0,fouls:3,turnovers:2,two_made:2,two_miss:1,three_made:1,three_miss:2,ft_made:0,ft_miss:0 }));
  await render('/src/components/BoxScore.jsx', { game,players,events:[],lineupEvents:[] }, 'sort-cycle');
  assert.deepEqual([...container.querySelectorAll('thead th')].map(el=>el.textContent), ['Player','MIN','PTS','AST','DREB','OREB','STL','BLK','FG','3PT','FT','TO','PF']);
  const names=()=>[...container.querySelectorAll('tbody tr')].map(row=>row.cells[0].textContent.split('#')[0]);
  assert.deepEqual(names(),['Alpha','Beta','Gamma']);
  assert.equal(container.querySelectorAll('thead button').length,0);
  assert.equal(container.querySelectorAll('thead [aria-sort]').length,0);
  assert.ok(container.querySelector('tbody').textContent.includes('3/6'));
});

test("recorded starters and minutes are shared across box score, player cards and game dialog", async () => {
  const { default: Provider } = await vite.ssrLoadModule('/src/timing/MinutesProvider.jsx');
  const { default: Minutes } = await vite.ssrLoadModule('/src/components/PlayerMinutes.jsx');
  const { default: Log } = await vite.ssrLoadModule('/src/components/PlayerGameLog.jsx');
  const { default: Box } = await vite.ssrLoadModule('/src/components/BoxScore.jsx');
  const players=Array.from({length:6},(_,index)=>({player_id:String(index+1),player_name:'Player '+(index+1),defensive_rebounds:index<5?2:0,offensive_rebounds:index<5?1:0,fouls:index<5?3:0}));
  const detail={game:{...game,id:'timed'},players,events:[{type:'PERIOD_END',period:4,clock_sec_remaining:0}],lineupEvents:players.slice(0,5).map(player=>({type:'SUB_IN',player_id:player.player_id,period:1,clock_sec_remaining:600}))};
  const client=new QueryClient({defaultOptions:{queries:{staleTime:Infinity,retry:false}}});
  client.setQueryData(['games'],[detail.game]);client.setQueryData(['game-details','timed'],detail);
  try {
    await act(async()=>root.render(React.createElement(QueryClientProvider,{client},React.createElement(Provider,null,
      React.createElement(Minutes,{playerId:'1'}),React.createElement(Box,detail),React.createElement(Log,{playerId:'1',games:[{game_id:'timed',opponent_name:'Visitors'}]})
    ))));
    assert.match(container.textContent,/Minutes per game 40:00/);
    const groups=[...container.querySelectorAll('th[scope="rowgroup"]')].map(el=>el.textContent);
    assert.deepEqual(groups,['Bench']);
    assert.match(container.querySelector('tbody').textContent,/40:00/);
    const opener=container.querySelector('[aria-haspopup="dialog"]');
    assert.ok(opener.closest('tr').textContent.includes('40:00'));
    await click(opener);
    assert.match(container.querySelector('dialog').textContent,/Minutes40:00/);
    assert.match(container.querySelector('dialog').textContent,/Fouls3/);
  } finally { await act(async()=>root.render(null));client.clear(); }
});

test("season MPG has a dedicated ranking card with numeric time sorting", async () => {
  const { default: Page } = await vite.ssrLoadModule('/src/pages/SeasonStatsPage.jsx');
  const { MinutesContext } = await vite.ssrLoadModule('/src/timing/context.js');
  const client=new QueryClient({defaultOptions:{queries:{staleTime:Infinity,retry:false}}});
  client.setQueryData(['season-stats'],[
    {player_id:'low',player_name:'Low',gp:2}, {player_id:'high',player_name:'High',gp:2},
    {player_id:'unknown',player_name:'Unknown',gp:1}, {player_id:'third',player_name:'Third',gp:1},
  ]);
  try {
    await act(async()=>root.render(React.createElement(QueryClientProvider,{client},React.createElement(MinutesContext.Provider,{value:{games:{},averages:{low:2401,high:2459,third:600}}},React.createElement(Page)))));
    const heading=[...container.querySelectorAll('h2')].find(el=>el.textContent==='Minutes per game');
    const card=heading.parentElement.parentElement.parentElement;
    assert.ok(card.textContent.indexOf('High')<card.textContent.indexOf('Low'));
    assert.match(card.textContent,/40:59/);
    assert.match(card.textContent,/40:01/);
    assert.equal(card.textContent.includes('Unknown'),false);
    const points=[...container.querySelectorAll('h2')].find(el=>el.textContent==='Points').parentElement.parentElement.parentElement;
    assert.doesNotMatch(points.textContent,/MPG|Minutes per game|40:59/);
    await click(card.querySelector('button'));
    const dialog=container.querySelector('dialog');
    assert.ok(dialog.textContent.indexOf('High')<dialog.textContent.indexOf('Low'));
    assert.ok(dialog.textContent.indexOf('Third')<dialog.textContent.indexOf('Unknown'));
  } finally { await act(async()=>root.render(null));client.clear(); }
});
