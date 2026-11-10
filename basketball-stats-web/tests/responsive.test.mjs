import { MemoryRouter } from "react-router-dom";
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

let vite, dom, root, container, PreferencesContext;
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
  ({ PreferencesContext } = await vite.ssrLoadModule("/src/preferences/context.js"));
});
after(async () => { await act(async () => root.unmount()); await vite.close(); renderClient.clear(); dom.window.close(); });
const game = { id: "one", opponent_name: "Long opponent name", quarters_count: 4, quarter_length_sec: 600,
  game_date_epoch: 1, is_home_game: false, team_score: 101, opponent_score: 120 };
const events = [
  { id: "start", type: "PERIOD_START", period: 1 },
  { id: "a", type: "TWO_MADE", period: 1, clock_sec_remaining: 500, player_name: "First Player", assist_player_name: "Assistant" },
  { id: "b", type: "OPP_THREE_MADE", period: 5, clock_sec_remaining: 60 },
];
// Existing component fixtures assert English labels explicitly.
function renderInEnglish(element) {
  root.render(React.createElement(PreferencesContext.Provider, { value: { language: "en", theme: "light" } }, element));
}
async function render(module, props, key = "one") {
  const { default: Component } = await vite.ssrLoadModule(module);
  try { await act(async () => renderInEnglish(React.createElement(QueryClientProvider, { client: renderClient }, React.createElement(Component, { ...props, key })))); } catch (error) { throw error.errors?.[0] ?? error; }
}
async function click(element) { await act(async () => element.click()); }

test("league route shows ten initial teams and a fifth navigation tab in both languages", async () => {
  const { MemoryRouter } = await import('react-router-dom');
  const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
  const { PreferencesContext } = await vite.ssrLoadModule('/src/preferences/context.js');
  const { leagueStandings } = await vite.ssrLoadModule('/src/data/leagueStandings.js');
  const hebrewTeams = ['אוניברסיטת רייכמן', 'המסלול האקדמי המכללה למינהל', 'אוניברסיטת תל-אביב', 'מכללת אפקה', 'מכון טכנולוגי חולון', 'אגודת הסטודנטים אריאל', 'המרכז האקדמי לוינסקי וינגייט', 'שנקר', 'אוניברסיטת בר אילן', 'המכללה האקדמית להנדסה עש סמי שמעון אשדוד'];
  try {
    for (const language of ['en', 'he']) {
      await act(async () => renderInEnglish(React.createElement(PreferencesContext.Provider, { value: { language, theme: 'light' } },
        React.createElement(MemoryRouter, { initialEntries: ['/league'] }, React.createElement(App)))));
      assert.equal(container.querySelector('h1').textContent, language === 'he' ? 'טבלת הליגה' : 'League standings');
      assert.deepEqual([...container.querySelectorAll('thead th')].map(cell => cell.textContent), language === 'he' ? ['#', 'קבוצה', 'מש׳', 'נ׳', 'ה׳', '+/-', 'נק׳'] : ['#', 'Team', 'GP', 'W', 'L', '+/-', 'Pts']);
      const rows = [...container.querySelectorAll('tbody tr')];
      assert.equal(rows.length, 10);
      assert.deepEqual(rows.map(row => row.querySelector('th').textContent), language === 'he' ? hebrewTeams : leagueStandings.map(team => team.nameEn));
      rows.forEach((row, index) => {
        assert.equal(row.cells[0].textContent, String(index + 1));
        assert.deepEqual([...row.cells].slice(2).map(cell => cell.textContent), ['0', '0', '0', '0', '0']);
      });
      assert.equal(container.querySelectorAll('tbody img').length, 10);
      assert.equal(container.querySelectorAll('tbody svg[role="img"]').length, 0);
      const region = container.querySelector('[role="region"]');
      assert.equal(region.tabIndex, 0);
      assert.ok(region.classList.contains('overflow-x-auto'));
      assert.equal(container.querySelector('section').dir, language === 'he' ? 'rtl' : 'ltr');
      assert.equal(container.querySelectorAll('nav a').length, 5);
      const active = container.querySelector('nav a[aria-current="page"]');
      assert.equal(active.getAttribute('href'), '/league');
      assert.equal(active.textContent.trim(), language === 'he' ? 'ליגה' : 'League');
    }
  } finally { await act(async () => root.render(null)); }
});

test("summary defaults to box score and supports click and keyboard tab selection", async () => {
  await render("/src/components/GameDetails.jsx", { game, players: [], events });
  const tabs = [...container.querySelectorAll('[role="tab"]')];
  const panels = [...container.querySelectorAll('[role="tabpanel"]')];
  assert.deepEqual(tabs.map(tab => tab.textContent), ["Box Score", "Play by Play", "Team Stats", "Shot map"]);
  assert.equal(tabs[0].getAttribute("aria-selected"), "true");
  assert.deepEqual(panels.map(panel => panel.hidden), [false, true, true, true]);
  await click(tabs[1]);
  assert.deepEqual(panels.map(panel => panel.hidden), [true, false, true, true]);
  assert.match(panels[1].textContent, /First Player/);
  document.documentElement.dir = "ltr";
  await act(async () => tabs[1].dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })));
  assert.equal(tabs[2].getAttribute("aria-selected"), "true");
  assert.equal(document.activeElement, tabs[2]);
  await act(async () => tabs[2].dispatchEvent(new window.KeyboardEvent("keydown", { key: "Home", bubbles: true })));
  assert.equal(tabs[0].getAttribute("aria-selected"), "true");
  document.documentElement.dir = "rtl";
  await act(async () => tabs[0].dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true })));
  assert.equal(tabs[1].getAttribute("aria-selected"), "true");
  await render("/src/components/GameDetails.jsx", { game: {...game, team_score:102}, players: [], events });
  assert.equal(container.querySelectorAll('[role="tab"]')[1].getAttribute("aria-selected"), "true");
  await render("/src/components/GameDetails.jsx", { game: {...game,id:"different"}, players: [], events });
  assert.equal(container.querySelectorAll('[role="tab"]')[0].getAttribute("aria-selected"), "true");
});

test("Hebrew player labels and an open performance dialog switch language without changing source data", async () => {
  const { PreferencesContext } = await vite.ssrLoadModule('/src/preferences/context.js');
  const { default: GameDetails } = await vite.ssrLoadModule('/src/components/GameDetails.jsx');
  const players = [
    { player_id: 'he-noam', player_name: 'Noam Groundland', points: 2 },
    { player_id: 'he-guy', player_name: 'Guy Shturman', points: 0 },
    { player_id: 'he-unknown', player_name: 'Unknown Player', points: 0 },
  ].map(player => Object.freeze({ ...player, defensive_rebounds: 0, offensive_rebounds: 0 }));
  const plays = [
    { id: 'he-score', type: 'TWO_MADE', period: 1, clock_sec_remaining: 500, player_name: 'Noam Groundland', assist_player_name: 'Ido David' },
    { id: 'he-assist', type: 'TWO_MADE', period: 1, clock_sec_remaining: 400, player_name: 'Unknown Player', assisted_by_player_remote_id: 'he-guy' },
  ].map(Object.freeze);
  const source = JSON.stringify({ players, plays });
  renderClient.setQueryData(['player-details', 'he-noam'], { games: [] });
  const showLanguage = async language => act(async () => renderInEnglish(
    React.createElement(QueryClientProvider, { client: renderClient },
      React.createElement(PreferencesContext.Provider, { value: { language, theme: 'light' } },
        React.createElement(GameDetails, { game, players, events: plays, lineupEvents: [] })))
  ));
  try {
    await showLanguage('he');
    const box = container.querySelector('[role="tabpanel"]');
    assert.match(box.textContent, /נועם גרונדלנד/);
    assert.match(box.textContent, /גיא שטורמן/);
    assert.match(box.textContent, /Unknown Player/);
    assert.match(container.querySelector('.play-table').textContent, /עידו דוד/);
    assert.match(container.querySelector('.play-table').textContent, /גיא שטורמן/);
    assert.match(box.querySelector('svg[aria-label]').getAttribute('aria-label'), /נועם גרונדלנד/);
    await click(box.querySelector('button[aria-haspopup="dialog"]'));
    const dialog = container.querySelector('dialog[open]');
    assert.match(dialog.textContent, /נועם גרונדלנד/);
    for (const language of ['en', 'he']) {
      await showLanguage(language);
      assert.equal(container.querySelector('dialog[open]'), dialog);
      assert.ok(dialog.textContent.includes(language === 'he' ? 'נועם גרונדלנד' : 'Noam Groundland'));
      assert.ok(container.querySelector('.play-table').textContent.includes(language === 'he' ? 'עידו דוד' : 'Ido David'));
      assert.ok(container.querySelector('.play-table').textContent.includes(language === 'he' ? 'גיא שטורמן' : 'Guy Shturman'));
    }
    assert.equal(JSON.stringify({ players, plays }), source);
  } finally {
    await act(async () => root.render(null));
    renderClient.removeQueries({ queryKey: ['player-details', 'he-noam'] });
  }
});

test("timeline filters periods and overtime and shows an empty period", async () => {
  await render("/src/components/PlayByPlay.jsx", { game, events });
  const button = text => [...container.querySelectorAll("button")].find(element => element.textContent === text);
  assert.match(container.textContent, /First Player/);
  assert.match(container.textContent, /Assist: Assistant/);
  assert.ok(container.querySelector("table.play-table"));
  assert.deepEqual([...container.querySelectorAll("thead th")].map(cell => cell.textContent), [game.opponent_name, "", "Afeka College"]);
  assert.equal(container.querySelector(".play-card"), null);
  assert.equal(container.querySelector("img"), null);
  assert.ok(container.querySelector('[data-team-side="home"] .play-home'));
  assert.ok(container.querySelector('[data-team-side="away"] .play-away'));
  assert.equal(container.querySelectorAll(".play-clock").length, 2);
  const center = container.querySelector("tbody td.play-score");
  assert.equal(center.children[0].getAttribute("aria-label"), "Score");
  assert.ok(center.children[1].classList.contains("play-clock"));
  assert.match(center.children[1].textContent, /Q1.*8:20/);
  assert.equal(container.querySelector('[data-team-side="away"]').textContent.includes("First Player"), true);
  assert.equal(container.querySelector('[data-team-side="home"]').textContent.includes("3 pointer"), true);
  await click(button("OT1"));
  assert.doesNotMatch(container.textContent, /First Player/);
  assert.match(container.textContent, /3 pointer/);
  assert.equal(button("OT1").getAttribute("aria-pressed"), "true");
  await click(button("Q2"));
  assert.match(container.textContent, /No recorded events/);
  await click(button("All periods"));
  assert.match(container.textContent, /START Q1/);
  assert.match(container.textContent, /First Player/);
});

test("all teams have logo sources, aliases match and unknown teams fall back", async () => {
  for (const name of ["Afeka", "Ariel", "Bar Ilan", "HIT", "Reichman", "SCE", "Tel Aviv University", "Wingate"]) {
    assert.ok(findTeam(name), name);
  }
  assert.equal(findTeam("  BAR-ILAN  ").id, "biu");
  assert.equal(findTeam("אפקה").id, "afeka");
  assert.equal(findTeam("Not a real college"), undefined);
  for (const team of teams) {
    if (team.imageUrl) assert.equal(new URL(team.imageUrl).protocol, 'https:');
    else assert.ok(existsSync(`public/teams/${team.file}`));
  }
  for (const name of ['College of Management', 'Shenkar', 'TAU']) {
    await render('/src/components/TeamLogo.jsx', { name });
    const logo = container.querySelector('img');
    assert.equal(logo.getAttribute('src'), findTeam(name).imageUrl);
    assert.ok(logo.parentElement.classList.contains('bg-white'));
    assert.ok(logo.parentElement.classList.contains('rounded-full'));
  }
  assert.equal(findTeam('שנקר').id, 'shenkar');
  assert.equal(findTeam('המסלול האקדמי המכללה למינהל').id, 'colman');
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
  assert.match(container.textContent, /Afeka College 60 - 58 Visitors/);
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
    await act(async () => renderInEnglish(React.createElement(QueryClientProvider, { client }, React.createElement(Log, { games }))));
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
  assert.deepEqual([...container.querySelectorAll('thead th')].map(el=>el.textContent), ['Player','MIN','PTS','REB','AST','DREB','OREB','STL','BLK','FG','3PT','FT','TO','PF','+/-']);
  assert.equal(container.querySelector('tbody tr').lastElementChild.textContent, '—');
  const names=()=>[...container.querySelectorAll('tbody tr')].map(row=>row.cells[0].textContent.split('#')[0]);
  assert.deepEqual(names(),['Alpha','Beta','Gamma']);
  assert.equal(container.querySelectorAll('thead button').length,0);
  assert.equal(container.querySelectorAll('thead [aria-sort]').length,0);
  assert.ok(container.querySelector('tbody').textContent.includes('3/6'));
});

test("box score rows open the selected player's current game statistics and shot map", async () => {
  const players = [
    { player_id: 81, player_name: 'Box Starter', player_number: 8, points: 9, rebounds: 3, assists: 2, fouls: 1, two_made: 3, two_miss: 1, three_made: 1 },
    { player_id: 82, player_name: 'Box Bench', player_number: 12, points: 0, rebounds: 0, assists: 0, fouls: 0, defensive_rebounds: 0, offensive_rebounds: 0 },
  ];
  renderClient.setQueryData(['player-details', '81'], { games: [
    { game_id: 'different-game', points: 99, shots: [{ type: 'THREE_MADE', shot_x: 1, shot_y: 1 }] },
    { game_id: game.id, defensive_rebounds: 2, offensive_rebounds: 1, shots: [
      { type: 'TWO_MADE', shot_x: 6, shot_y: 4 }, { type: 'TWO_MISS', shot_x: 8, shot_y: 5 },
    ] },
  ] });
  renderClient.setQueryData(['player-details', '82'], { games: [{ game_id: game.id, shots: [] }] });
  try {
    await render('/src/components/GameDetails.jsx', {
      game: { ...game, opponent_score: 0 }, players,
      events: [{ type: 'THREE_MADE', period: 1, clock_sec_remaining: 500 }, { type: 'PERIOD_END', period: 4, clock_sec_remaining: 0 }],
      lineupEvents: [{ type: 'SUB_IN', player_id: 81, period: 1, clock_sec_remaining: 600 }],
    }, 'clickable-box-score');
    const rows = container.querySelectorAll('table tbody tr');
    // A statistic cell opens the dialog just like the player name does.
    await click(rows[0].cells[2]);
    let dialog = container.querySelector('dialog[open]');
    assert.ok(dialog);
    assert.match(dialog.textContent, /Box Starter/);
    assert.match(dialog.textContent, /Points9/);
    assert.match(dialog.textContent, /Defensive Rebounds2/);
    assert.match(dialog.textContent, /Offensive Rebounds1/);
    assert.match(dialog.textContent, /Minutes40:00/);
    assert.match(dialog.textContent, /\+\/-\+3/);
    assert.deepEqual([...dialog.querySelector('dl').querySelectorAll('dt')].slice(-2).map(label => label.textContent), ['Fouls', '+/-']);
    assert.match(dialog.textContent, /Field goals4\/5 \(80%\)/);
    assert.equal(dialog.querySelectorAll('[style*="left:"]').length, 2);
    await act(async () => dialog.dispatchEvent(new window.Event('cancel', { cancelable: true })));
    assert.equal(container.querySelector('dialog'), null);
    const opener = rows[1].querySelector('button[aria-haspopup="dialog"]');
    opener.focus();
    await click(opener);
    dialog = container.querySelector('dialog[open]');
    assert.match(dialog.textContent, /Box Bench/);
    assert.match(dialog.textContent, /Points0/);
    assert.match(dialog.textContent, /Minutes0:00/);
    assert.equal(dialog.querySelectorAll('[style*="left:"]').length, 0);
    await click([...dialog.querySelectorAll('button')].find(button => button.textContent === 'Close'));
    assert.equal(container.querySelector('dialog'), null);
    assert.equal(document.activeElement, opener);
  } finally {
    await act(async () => root.render(null));
    for (const id of ['81', '82']) renderClient.removeQueries({ queryKey: ['player-details', id] });
  }
});

test("recorded starters and minutes are shared across box score, player cards and game dialog", async () => {
  const { default: Provider } = await vite.ssrLoadModule('/src/timing/MinutesProvider.jsx');
  const { default: Minutes } = await vite.ssrLoadModule('/src/components/PlayerMinutes.jsx');
  const { default: Log } = await vite.ssrLoadModule('/src/components/PlayerGameLog.jsx');
  const { default: Box } = await vite.ssrLoadModule('/src/components/BoxScore.jsx');
  const players=Array.from({length:6},(_,index)=>({player_id:String(index+1),player_name:'Player '+(index+1),defensive_rebounds:index<5?2:0,offensive_rebounds:index<5?1:0,fouls:index<5?3:0}));
  const detail={game:{...game,id:'timed',opponent_score:0},players,events:[{type:'PERIOD_END',period:4,clock_sec_remaining:0}],lineupEvents:players.slice(0,5).map(player=>({type:'SUB_IN',player_id:player.player_id,period:1,clock_sec_remaining:600}))};
  detail.events.push({id:'score',local_id:10,type:'THREE_MADE',period:1,clock_sec_remaining:500,created_at:10});
  const client=new QueryClient({defaultOptions:{queries:{staleTime:Infinity,retry:false}}});
  client.setQueryData(['games'],[detail.game]);client.setQueryData(['game-details','timed'],detail);
  try {
    await act(async()=>renderInEnglish(React.createElement(QueryClientProvider,{client},React.createElement(Provider,null,
      React.createElement(Minutes,{playerId:'1'}),React.createElement(Box,detail),React.createElement(Log,{playerId:'1',games:[{game_id:'timed',opponent_name:'Visitors'}]})
    ))));
    assert.match(container.textContent,/Minutes per game 40:00/);
    const groups=[...container.querySelectorAll('th[scope="rowgroup"]')].map(el=>el.textContent);
    assert.deepEqual(groups,['Bench']);
    assert.match(container.querySelector('tbody').textContent,/40:00/);
    assert.equal(container.querySelector('tbody tr').lastElementChild.textContent, '+3');
    assert.equal(container.querySelectorAll('tbody')[1].querySelector('tr:last-child').lastElementChild.textContent, '0');
    const opener=container.querySelector('.player-log-table [aria-haspopup="dialog"]');
    assert.ok(opener.closest('tr').textContent.includes('40:00'));
    assert.equal(opener.closest('tr').querySelector('[data-compact-label="+/-"]').textContent, '+3');
    await click(opener);
    assert.match(container.querySelector('dialog').textContent,/Minutes40:00/);
    assert.match(container.querySelector('dialog').textContent,/Fouls3/);
    assert.match(container.querySelector('dialog').textContent,/\+\/-\+3/);
  } finally { await act(async()=>root.render(null));client.clear(); }
});

test("untracked opponent scoring stays unavailable per game and contributes zero to season totals", async () => {
  const { default: Provider } = await vite.ssrLoadModule('/src/timing/MinutesProvider.jsx');
  const { default: Box } = await vite.ssrLoadModule('/src/components/BoxScore.jsx');
  const { default: Log } = await vite.ssrLoadModule('/src/components/PlayerGameLog.jsx');
  const { MinutesContext } = await vite.ssrLoadModule('/src/timing/context.js');
  const { useContext } = React;
  function Totals() {
    const { plusMinusTotals } = useContext(MinutesContext);
    return React.createElement('output', null, JSON.stringify(plusMinusTotals));
  }
  const player = { player_id: 'untracked', player_name: 'Player', points: 3, defensive_rebounds: 0, offensive_rebounds: 0, fouls: 0 };
  const detail = { game: { ...game, id: 'untracked-game', opponent_score: 59 }, players: [player],
    events: [{ type: 'THREE_MADE', period: 1, clock_sec_remaining: 500 }, { type: 'PERIOD_END', period: 4, clock_sec_remaining: 0 }],
    lineupEvents: [{ type: 'SUB_IN', player_id: player.player_id, period: 1, clock_sec_remaining: 600 }] };
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  client.setQueryData(['games'], [detail.game]);
  client.setQueryData(['game-details', detail.game.id], detail);
  client.setQueryData(['player-details', player.player_id], { games: [] });
  try {
    await act(async () => renderInEnglish(React.createElement(QueryClientProvider, { client }, React.createElement(Provider, null,
      React.createElement(Box, detail), React.createElement(Log, { playerId: player.player_id, player, playerName: player.player_name, games: [{ game_id: detail.game.id }] }), React.createElement(Totals)
    ))));
    assert.equal(container.querySelector('tbody tr').lastElementChild.textContent, '—');
    assert.equal(container.querySelector('.player-log-table [data-compact-label="+/-"]').textContent, '—');
    assert.equal(container.querySelector('output').textContent, '{"untracked":0}');
    for (const opener of container.querySelectorAll('button[aria-haspopup="dialog"]')) {
      await click(opener);
      const dialog = container.querySelector('dialog');
      const label = [...dialog.querySelectorAll('dt')].find(element => element.textContent === '+/-');
      assert.equal(label.nextElementSibling.textContent, '—');
      await act(async () => dialog.dispatchEvent(new window.Event('cancel', { cancelable: true })));
    }
  } finally { await act(async () => root.render(null)); client.clear(); }
});

test("season MPG has a dedicated ranking card with numeric time sorting", async () => {
  const { default: Page } = await vite.ssrLoadModule('/src/pages/SeasonStatsPage.jsx');
  const { MinutesContext } = await vite.ssrLoadModule('/src/timing/context.js');
  const client=new QueryClient({defaultOptions:{queries:{staleTime:Infinity,retry:false}}});
  client.setQueryData(['season-stats','26/27'],[
    {player_id:'low',player_name:'Low',gp:2}, {player_id:'high',player_name:'High',gp:2},
    {player_id:'unknown',player_name:'Unknown',gp:1}, {player_id:'third',player_name:'Third',gp:1},
  ]);
  try {
    await act(async()=>renderInEnglish(React.createElement(QueryClientProvider,{client},React.createElement(MinutesContext.Provider,{value:{games:{},averages:{},seasons:{"26/27":{averages:{low:2401,high:2459,third:600}}}}},React.createElement(MemoryRouter,null,React.createElement(Page))))));
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

test("season plus/minus ranks per-game averages and lists unknown values last", async () => {
  const { default: Page } = await vite.ssrLoadModule('/src/pages/SeasonStatsPage.jsx');
  const { MinutesContext } = await vite.ssrLoadModule('/src/timing/context.js');
  const client = new QueryClient({defaultOptions:{queries:{staleTime:Infinity,retry:false}}});
  client.setQueryData(['season-stats','26/27'], [
    {player_id:'positive',player_name:'Positive',gp:2},
    {player_id:'negative',player_name:'Negative',gp:2},
    {player_id:'zero',player_name:'Zero',gp:1},
    {player_id:'unknown',player_name:'Unknown',gp:1},
  ]);
  try {
    await act(async()=>renderInEnglish(React.createElement(QueryClientProvider,{client},
      React.createElement(MinutesContext.Provider,{value:{games:{},averages:{},seasons:{"26/27":{averages:{},plusMinusTotals:{positive:5,negative:-7,zero:0}}}}},React.createElement(MemoryRouter,null,React.createElement(Page))))));
    const heading = [...container.querySelectorAll('h2')].find(el=>el.textContent==='+/-');
    const card = heading.parentElement.parentElement.parentElement;
    assert.match(card.textContent,/\+2\.5/);
    assert.match(card.textContent,/-3\.5/);
    assert.match(card.textContent,/0\.0/);
    assert.doesNotMatch(card.textContent,/Unknown/);
    assert.ok(card.textContent.indexOf('Positive') < card.textContent.indexOf('Zero'));
    assert.ok(card.textContent.indexOf('Zero') < card.textContent.indexOf('Negative'));
    await click(card.querySelector('button'));
    const dialog = container.querySelector('dialog');
    assert.ok(dialog.textContent.indexOf('Negative') < dialog.textContent.indexOf('Unknown'));
    assert.match(dialog.textContent,/—/);
  } finally { await act(async()=>root.render(null)); client.clear(); }
});

test("player game dialog filters recorded quarters and overtime across stats, shooting and shot map", async () => {
  const full = {game_id:"quarters",opponent_name:"Quarter opponent",points:5,two_made:1,three_made:1,
    two_miss:1,shots:[{type:"TWO_MADE",shot_x:1,shot_y:2},{type:"THREE_MADE",shot_x:3,shot_y:4}],
    periods:[
      {period:1,points:2,rebounds:1,assists:0,two_made:1,two_miss:0,shots:[{type:"TWO_MADE",shot_x:1,shot_y:2}]},
      {period:2,points:0,rebounds:0,assists:1,two_made:0,two_miss:1,shots:[]},
      {period:5,points:3,rebounds:0,assists:0,three_made:1,shots:[{type:"THREE_MADE",shot_x:3,shot_y:4}]},
    ]};
  renderClient.setQueryData(['games'],[]);
  try {
    await render('/src/components/PlayerGameLog.jsx',{playerId:'quarter-player',playerName:'Shooter',games:[full]},'quarter-log');
    await click(container.querySelector('button[aria-haspopup="dialog"]'));
    const dialog = container.querySelector('dialog');
    const controls = dialog.querySelector('[aria-label="Filter by period"]');
    assert.ok(controls);
    assert.deepEqual([...controls.querySelectorAll('button')].map(b=>b.textContent),['All periods','Q1','Q2','OT1']);
    const choose=async label=>click([...controls.querySelectorAll('button')].find(b=>b.textContent===label));
    await choose('Q1');
    assert.match(dialog.textContent,/Points2/);
    assert.match(dialog.textContent,/Field goals1\/1 \(100%\)/);
    assert.equal(dialog.querySelectorAll('[style*="left:"]').length,1);
    assert.equal([...controls.querySelectorAll('[aria-pressed="true"]')][0].textContent,'Q1');
    await choose('Q2');
    assert.match(dialog.textContent,/Points0/); assert.match(dialog.textContent,/Assists1/);
    assert.match(dialog.textContent,/Field goals0\/1 \(0%\)/);
    assert.equal(dialog.querySelectorAll('[style*="left:"]').length,0);
    await choose('OT1'); assert.match(dialog.textContent,/Points3/);
    await choose('All periods'); assert.match(dialog.textContent,/Points5/);
    assert.equal(dialog.querySelectorAll('[style*="left:"]').length,2);
  } finally { await act(async()=>root.render(null)); }
});

test("player game dialog hides quarter filtering when no recorded period breakdown exists", async () => {
  renderClient.setQueryData(['games'],[]);
  try {
    await render('/src/components/PlayerGameLog.jsx',{playerId:'legacy-player',playerName:'Shooter',games:[{game_id:'legacy-quarter',opponent_name:'Legacy',points:8,periods:[]}]},'legacy-quarter-log');
    await click(container.querySelector('button[aria-haspopup="dialog"]'));
    const dialog=container.querySelector('dialog');
    assert.equal(dialog.querySelector('[aria-label="Filter by period"]'),null);
    assert.match(dialog.textContent,/Points8/);
  } finally { await act(async()=>root.render(null)); }
});

test("season stats fallback is explicit, manual empty season persists and ranking dialogs close on change",async()=>{
  const {default:Page}=await vite.ssrLoadModule('/src/pages/SeasonStatsPage.jsx');
  const client=new QueryClient({defaultOptions:{queries:{staleTime:Infinity,retry:false}}});
  client.setQueryData(['season-stats','26/27'],[{player_id:'zero',gp:0}]);
  client.setQueryData(['season-stats','25/26'],[{player_id:'old',player_name:'Previous Player',gp:2,pts:30}]);
  try {
    await act(async()=>renderInEnglish(React.createElement(QueryClientProvider,{client},React.createElement(MemoryRouter,null,React.createElement(Page)))));
    assert.match(container.textContent,/No stats available for 26\/27. Showing 25\/26/);
    assert.match(container.textContent,/Previous Player/);
    assert.equal(container.querySelector('select').value,'25/26');
    await click([...container.querySelectorAll('button')].find(b=>b.textContent==='See all'));
    assert.ok(container.querySelector('dialog'));
    await act(async()=>{const select=container.querySelector('select');select.value='26/27';select.dispatchEvent(new window.Event('change',{bubbles:true}));});
    assert.equal(container.querySelector('dialog'),null);
    assert.match(container.textContent,/No stats available for this season/);
    assert.doesNotMatch(container.textContent,/Previous Player|Showing 25\/26/);
    assert.equal(container.querySelector('select').value,'26/27');
  } finally {await act(async()=>root.render(null));client.clear();}
});

test("player page follows team-wide season, filters all summaries and games, and preserves player identity when empty",async()=>{
  const {MemoryRouter,Routes,Route}=await import('react-router-dom');
  const {default:Page}=await vite.ssrLoadModule('/src/pages/PlayerDetailsPage.jsx');
  const {MinutesContext}=await vite.ssrLoadModule('/src/timing/context.js');
  const client=new QueryClient({defaultOptions:{queries:{staleTime:Infinity,retry:false}}});
  client.setQueryData(['season-stats','26/27'],[{player_id:'teammate',gp:1}]);
  client.setQueryData(['season-stats','25/26'],[{player_id:'p',gp:2}]);
  client.setQueryData(['games'],[]);
  client.setQueryData(['player-details','p','26/27'],{player:{id:'p',name:'Identity'},averages:{},games:[]});
  client.setQueryData(['player-details','p','25/26'],{player:{id:'p',name:'Identity'},averages:{ppg:12},games:[{game_id:'old',opponent_name:'Past Opponent',two_made:6,two_miss:2,shots:[{type:'TWO_MADE',shot_x:2,shot_y:3}]}]});
  const timing={games:{},averages:{p:9999},seasons:{'26/27':{averages:{}},'25/26':{averages:{p:600}}}};
  try {
    await act(async()=>renderInEnglish(React.createElement(QueryClientProvider,{client},React.createElement(MinutesContext.Provider,{value:timing},React.createElement(MemoryRouter,{initialEntries:['/players/p']},React.createElement(Routes,null,React.createElement(Route,{path:'/players/:playerId',element:React.createElement(Page)})))))));
    assert.match(container.textContent,/Showing season 26\/27/);
    assert.match(container.textContent,/No player stats available for this season/);
    assert.match(container.textContent,/Identity/);assert.doesNotMatch(container.textContent,/Past Opponent|166:39/);
    await act(async()=>{const select=container.querySelector('select');select.value='25/26';select.dispatchEvent(new window.Event('change',{bubbles:true}));});
    assert.match(container.textContent,/Showing season 25\/26/);
    assert.match(container.textContent,/Past Opponent/);assert.match(container.textContent,/6\/8 \(75%\)/);
    assert.match(container.textContent,/10:00/);assert.doesNotMatch(container.textContent,/166:39/);
    assert.equal(container.querySelectorAll('[style*="left:"]').length,1);
    await click(container.querySelector('button[aria-haspopup="dialog"]'));
    assert.ok(container.querySelector('dialog'));
    await act(async()=>{const select=container.querySelector('select');select.value='26/27';select.dispatchEvent(new window.Event('change',{bubbles:true}));});
    assert.equal(container.querySelector('dialog'),null);assert.equal(container.querySelectorAll('[style*="left:"]').length,0);
  } finally {await act(async()=>root.render(null));client.clear();}
});

test("season MPG and plus/minus ignore unavailable timing in another season",async()=>{
  const {default:Provider}=await vite.ssrLoadModule('/src/timing/MinutesProvider.jsx');
  const {useMinutes}=await vite.ssrLoadModule('/src/timing/context.js');
  function Probe(){const timing=useMinutes('26/27');return React.createElement('output',null,JSON.stringify({minutes:timing.averages.p,plusMinus:timing.plusMinusTotals.p}));}
  const client=new QueryClient({defaultOptions:{queries:{staleTime:Infinity,retry:false}}});
  const player={player_id:'p',points:3};
  const current={...game,id:'timing-current',season:'26/27',opponent_score:0};
  const previous={...game,id:'timing-previous',season:'25/26'};
  client.setQueryData(['games'],[current,previous]);
  client.setQueryData(['game-details',current.id],{game:current,players:[player],events:[{type:'THREE_MADE',period:1,clock_sec_remaining:500},{type:'PERIOD_END',period:4,clock_sec_remaining:0}],lineupEvents:[{player_id:'p',type:'SUB_IN',period:1,clock_sec_remaining:600}]});
  client.setQueryData(['game-details',previous.id],{game:previous,players:[player],events:[],lineupEvents:[]});
  try {
    await act(async()=>renderInEnglish(React.createElement(QueryClientProvider,{client},React.createElement(Provider,null,React.createElement(Probe)))));
    assert.deepEqual(JSON.parse(container.querySelector('output').textContent),{minutes:2400,plusMinus:3});
  } finally {await act(async()=>root.render(null));client.clear();}
});


test("rebuilt momentum renders one smooth curve, aligned green/orange gradients, and localized periods", async () => {
  const points = buildMomentumPoints([
    { type: "THREE_MADE", period: 1, clock_sec_remaining: 500 },
    { type: "OPP_TWO_MADE", period: 2, clock_sec_remaining: 400 },
    { type: "OPP_THREE_MADE", period: 3, clock_sec_remaining: 300 },
    { type: "TWO_MADE", period: 5, clock_sec_remaining: 20 },
  ]);
  await render("/src/components/MomentumChart.jsx", { momentumPoints: points, opponentName: "Visitors" });
  assert.match(container.textContent, /Scoring momentum/);
  assert.match(container.textContent, /Afeka College/);
  assert.match(container.textContent, /OT1/);
  const curves = container.querySelectorAll(".recharts-area-curve");
  assert.equal(curves.length, 1);
  assert.match(curves[0].getAttribute("d"), /C/);
  assert.doesNotMatch(curves[0].getAttribute("d"), /NaN|Infinity/);
  const gradients = container.querySelectorAll("linearGradient");
  assert.equal(gradients.length, 2);
  for (const gradient of gradients) {
    assert.equal(gradient.getAttribute("gradientUnits"), "userSpaceOnUse");
    assert.ok(gradient.querySelector('stop[stop-color="var(--momentum-team)"]'));
    assert.ok(gradient.querySelector('stop[stop-color="var(--momentum-opponent)"]'));
  }
  assert.ok(container.querySelector('[role="application"]'));
});

test("momentum shows an empty state without scoring and retains tied finishes", async () => {
  await render("/src/components/MomentumChart.jsx", { momentumPoints: buildMomentumPoints([]), opponentName: "Visitors" });
  assert.match(container.textContent, /No scoring events recorded/);
  assert.equal(container.querySelector(".recharts-area-curve"), null);
  await render("/src/components/GameDetails.jsx", { game, players: [], events: [
    { type: "TWO_MADE", period: 1, clock_sec_remaining: 500 },
    { type: "OPP_TWO_MADE", period: 1, clock_sec_remaining: 400 },
  ] });
  assert.ok(container.querySelector(".momentum-plot"));
});

test("carried chart endpoint tooltip shows the real scoring clock and Hebrew college name", async () => {
  const recordedPoint = { period: 4, clockSecRemaining: 14, teamScore: 60, opponentScore: 58, scoreDiff: 2 };
  const { default: Tooltip } = await vite.ssrLoadModule("/src/components/MomentumTooltip.jsx");
  await act(async () => root.render(React.createElement(PreferencesContext.Provider, { value: { language: "he", theme: "dark" } },
    React.createElement(Tooltip, { active: true, opponentName: "Visitors", payload: [{ payload: { ...recordedPoint, clockSecRemaining: 0, recordedPoint } }] }))));
  assert.match(container.textContent, /0:14/);
  assert.match(container.textContent, /מכללת אפקה/);
  assert.equal(container.querySelector(".momentum-tooltip").dir, "rtl");
});

test("team stats show comparison bars only for available pairs and preserve recorded zero", async () => {
  await render("/src/components/TeamStats.jsx", {opponentName:"Visitors",stats:{afeka:{points:60,assists:3,rebounds:0,two:{made:5,attempts:10,percentage:50}},opponent:{points:50,assists:2,rebounds:null,two:{made:4,attempts:null,percentage:null}}}});
  assert.equal(container.querySelector('[data-stat="points"]'),null);
  const comparison=container.querySelector('[data-stat="assists"]');
  assert.equal(comparison.querySelectorAll('[aria-hidden="true"] span').length,2);
  const rebounds=container.querySelector('[data-stat="rebounds"]');
  assert.match(rebounds.textContent,/0/); assert.match(rebounds.textContent,/—/);
  assert.equal(rebounds.querySelector('[aria-hidden="true"]'),null);
  assert.equal(rebounds.querySelector('[title="Not recorded"]').textContent,"—");
  const shooting = container.querySelector('[data-stat="two"]');
  assert.match(shooting.textContent,/5\/10/);
  assert.match(shooting.textContent,/4\/—/);
  assert.equal(shooting.querySelectorAll('[role="img"]').length,2);
  assert.equal(shooting.querySelector('circle[pathLength]').getAttribute("stroke-dasharray"),"50 50");
  assert.equal(shooting.querySelectorAll('circle[pathLength]').length,1,"unknown opponent percentage has no filled ring");
  assert.equal(container.querySelector('[data-stat="two.attempts"]'),null);
  assert.ok(comparison.querySelector('.h-2\\.5'),"comparison bars use thicker sizing");
});

test("game shot map combines player shots, filters makes and misses, and normalizes opponent shots", async () => {
  const shots=[
    {type:"TWO_MADE",shot_x:0,shot_y:0,player_remote_id:"one"},
    {type:"THREE_MISS",shot_x:10,shot_y:5,player_remote_id:"two"},
    {type:"OPP_THREE_MADE",shot_x:9,shot_y:4},
    {type:"TWO_MADE",shot_x:null,shot_y:2},
    {type:"THREE_MADE",shot_x:40,shot_y:5},
    {type:"FT_MADE",shot_x:7,shot_y:4},
  ];
  await render("/src/components/GameShotMap.jsx", {shots,opponentName:"Visitors"});
  const count=()=>container.querySelectorAll('[style*="left:"]').length;
  assert.equal(count(),2);
  const button=label=>[...container.querySelectorAll("button")].find(button=>button.textContent===label);
  await click(button("Makes"));assert.equal(count(),1);
  await click(button("Misses"));assert.equal(count(),1);
  await click(button("Visitors"));assert.equal(count(),1);
  await click(button("Makes"));assert.equal(count(),1,"opponent makes are drawn as makes");
  await click(button("Misses"));assert.equal(count(),0);
  await render("/src/components/GameShotMap.jsx", {shots:[],opponentName:"Visitors"},"no-locations");
  assert.match(container.textContent,/No shot locations recorded/);
});
