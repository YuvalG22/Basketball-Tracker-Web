import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider, QueryObserver, focusManager, onlineManager } from "@tanstack/react-query";
import { createServer } from "vite";
import { completedGames, getPeriodScores, buildMomentumPoints } from "../src/utils/gameStats.js";
import { historicalQueryOptions } from "../src/api/queryOptions.js";

let vite;
before(async () => {
  vite = await createServer({ server: { middlewareMode: true }, appType: "custom" });
});
after(async () => { await vite?.close(); });

const game = {
  id: "finished", status: "FINISHED", is_home_game: false,
  opponent_name: "Opponents", team_score: "9", opponent_score: "10",
  round_number: 2, game_date_epoch: "1793484000000", quarters_count: 4,
  quarter_length_sec: 600,
};
const player = {
  player_id: "player", player_name: "Test Player", player_number: 7,
  points: "9", rebounds: "3", assists: "2", steals: "1", blocks: "1",
  turnovers: "2", fouls: "3", two_made: "3", two_miss: "1",
  three_made: "1", three_miss: "1", ft_made: null, ft_miss: null,
};

async function renderPage(module, route, url, key, data, extraQueries = []) {
  const { default: Page } = await vite.ssrLoadModule(module);
  const client = new QueryClient({ defaultOptions: { queries: historicalQueryOptions } });
  client.setQueryData(key, data);
  for (const [extraKey, extraData] of extraQueries) client.setQueryData(extraKey, extraData);
  try {
    return renderToStaticMarkup(React.createElement(QueryClientProvider, { client },
      React.createElement(MemoryRouter, { initialEntries: [url] },
        React.createElement(Routes, null,
          React.createElement(Route, { path: route, element: React.createElement(Page) })))));
  } finally { client.clear(); }
}

test("completed results exclude unfinished records and compare numeric scores correctly", () => {
  assert.deepEqual(completedGames(null), []);
  const results = completedGames([game, { ...game, id: "ongoing", status: "LIVE" }]);
  assert.equal(results.length, 1);
  assert.equal(results[0].team_score, 9);
  assert.equal(results[0].opponent_score, 10);
});

test("period scores preserve overtime, away orientation and empty regulation periods", () => {
  const scores = getPeriodScores([
    { period: "1", type: "TWO_MADE" },
    { period: 1, type: "OPP_THREE_MADE" },
    { period: 5, type: "FT_MADE" },
    { period: 5, type: "OPP_TWO_MADE" },
  ], false, 4);
  assert.equal(scores.length, 5);
  assert.deepEqual(scores[0], { period: 1, home: 3, away: 2 });
  assert.deepEqual(scores[4], { period: 5, home: 2, away: 1 });
  assert.deepEqual(getPeriodScores([], true, 2), [
    { period: 1, home: 0, away: 0 }, { period: 2, home: 0, away: 0 },
  ]);
});

test("momentum includes opponent scoring events from the actual API contract", () => {
  const events = [
    { type: "OPP_TWO_MADE", period: 1, clock_sec_remaining: "400", team_score_at_event: "3", opponent_score_at_event: "2" },
    { type: "THREE_MADE", period: 1, clock_sec_remaining: "500", team_score_at_event: "3", opponent_score_at_event: "0" },
    { type: "OPP_THREE_MADE", period: 2, clock_sec_remaining: "600", team_score_at_event: "3", opponent_score_at_event: "5" },
    { type: "OPP_FT_MADE", period: 2, clock_sec_remaining: "550", team_score_at_event: "3", opponent_score_at_event: "6" },
    { type: "THREE_MADE", period: 2, clock_sec_remaining: "500", team_score_at_event: null, opponent_score_at_event: null },
  ];
  const copy = [...events];
  const points = buildMomentumPoints(events, "600");
  assert.deepEqual(points.map(point => point.scoreDiff), [0, 3, 1, -2, -3, 0]);
  assert.deepEqual(points.map(point => point.gameSecond), [0, 100, 200, 600, 650, 700]);
  assert.deepEqual(events, copy);
});

test("home renders a historical away result with correct team name and winner", async () => {
  const html = await renderPage("/src/pages/HomePage.jsx", "/", "/", ["home-game"], { game });
  assert.match(html, /LAST GAME/);
  assert.match(html, /Afeka/);
  assert.match(html, /font-bold text-ink">Opponents/);
  assert.doesNotMatch(html, /LIVE|automatically|מתעדכן/);
  const empty = await renderPage("/src/pages/HomePage.jsx", "/", "/", ["home-game"], { game: null });
  assert.match(empty, /No completed games yet/);
});

test("games page renders numeric results and ties without a false loss", async () => {
  const html = await renderPage("/src/pages/GamesPage.jsx", "/games", "/games", ["games"], completedGames([
    game, { ...game, id: "tie", team_score: "10", opponent_score: "10" },
  ]));
  assert.match(html, />L<\/div>/);
  assert.match(html, />D<\/div>/);
  assert.doesNotMatch(html, />W<\/div>/);
});

test("game details preserve box score, assists, scoring progression and overtime", async () => {
  const data = { game, players: [player], events: [
    { id: "event", type: "THREE_MADE", period: 5, clock_sec_remaining: 90,
      team_score_at_event: 9, opponent_score_at_event: 10, player_name: "Test Player", assist_player_name: "Assist Player" },
  ], lineupEvents: [] };
  const html = await renderPage("/src/pages/GameDetailsPage.jsx", "/games/:gameId", "/games/finished", ["game-details", "finished"], data);
  for (const text of ["Box Score", "Play by Play", "Test Player", "Assist Player", "OT1", "FINAL", "1:30", "3/4", "1/2", "0/0"]) assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /NaN|undefined|ON COURT|LIVE/);
  const hidden = await renderPage("/src/pages/GameDetailsPage.jsx", "/games/:gameId", "/games/finished", ["game-details", "finished"], { ...data, game: { ...game, status: "LIVE" } });
  assert.match(hidden, /Completed game not found/);
});

test("player and season pages preserve historical averages and shooting percentages", async () => {
  const html = await renderPage("/src/pages/PlayerDetailsPage.jsx", "/players/:playerId", "/players/player", ["player-details", "player"], {
    player: { id: "player", name: "Test Player", number: 7 }, averages: { ppg: "9", rpg: "3", apg: "2" },
    games: [{ ...player, game_id: game.id, opponent_name: game.opponent_name, round_number: 2 }],
  });
  for (const text of ["Test Player", "1 games played", "PPG", "RPG", "APG", "vs Opponents"]) assert.ok(html.includes(text), text);
  const season = await renderPage("/src/pages/SeasonStatsPage.jsx", "/season", "/season", ["season-stats"], [{
    ...player, gp: 2, pts: 18, ast: 4, reb_total: 6, reb_def: 4, reb_off: 2,
    stl: 2, tov: 4, fgm: 4, fga: 6, threem: 1, threea: 2, ftm: 0, fta: 0,
  }]);
  for (const text of ["66.7%", "50.0%", "0%", "9.0", "2.0"]) assert.ok(season.includes(text), text);
});

test("games API requests completed games and normalizes database numeric strings", async () => {
  const { apiClient } = await vite.ssrLoadModule("/src/api/apiClient.js");
  const { getGames } = await vite.ssrLoadModule("/src/api/gamesApi.js");
  const adapter = apiClient.defaults.adapter;
  apiClient.defaults.adapter = async config => {
    assert.equal(config.url, "/games");
    assert.equal(config.params.status, "FINISHED");
    return { data: [game, { ...game, status: "LIVE" }], status: 200, statusText: "OK", headers: {}, config };
  };
  try { assert.equal((await getGames()).length, 1); }
  finally { apiClient.defaults.adapter = adapter; }
});

test("historical queries do not refresh on focus or reconnect", async () => {
  const client = new QueryClient({ defaultOptions: { queries: historicalQueryOptions } });
  let calls = 0;
  const options = { queryKey: ["history"], queryFn: async () => ++calls };
  client.mount();
  const observer = new QueryObserver(client, options);
  const unsubscribe = observer.subscribe(() => {});
  try {
    await client.fetchQuery(options);
    await client.invalidateQueries({ queryKey: ["history"], refetchType: "none" });
    focusManager.setFocused(false);
    focusManager.setFocused(true);
    onlineManager.setOnline(false);
    onlineManager.setOnline(true);
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(calls, 1);
  } finally { unsubscribe(); client.unmount(); client.clear(); }
});

test("player season shot map aggregates locations across games and handles missing shots", async () => {
  const html = await renderPage("/src/pages/PlayerDetailsPage.jsx", "/players/:playerId", "/players/player", ["player-details", "player"], {
    player: { id: "player", name: "Test Player" }, averages: { ppg: 12 },
    games: [
      { game_id: "a", opponent_name: "A", shots: [{ type: "TWO_MADE", shot_x: 3, shot_y: 7 }] },
      { game_id: "b", opponent_name: "B", shots: [{ type: "THREE_MISS", shot_x: 9, shot_y: 7 }] },
      { game_id: "c", opponent_name: "C" },
    ],
  });
  assert.match(html, /Season averages/);
  assert.match(html, /Season shot map/);
  assert.match(html, /left:20%;top:50%/);
  assert.match(html, /left:60%;top:50%/);
  assert.match(html, /All shots/);
  assert.doesNotMatch(html, /No shot locations recorded/);
});

test("home, games and game details show playoff stage and game number", async () => {
  const playoff = { ...game, round_number: 0, is_playoff: true, playoff_stage: "SEMI_FINAL", playoff_game_number: 2 };
  const pages = [
    ["/src/pages/HomePage.jsx", "/", "/", ["home-game"], { game: playoff }],
    ["/src/pages/GamesPage.jsx", "/games", "/games", ["games"], [playoff]],
    ["/src/pages/GameDetailsPage.jsx", "/games/:gameId", "/games/finished", ["game-details", "finished"], { game: playoff, players: [], events: [] }],
  ];
  for (const args of pages) {
    const html = await renderPage(...args);
    assert.match(html, /Semifinal.*Game 2/);
    assert.doesNotMatch(html, /Round 0|\{&quot; &quot;\}/);
  }
});

test("home overview uses numeric completed results and links to last-game leaders", async () => {
  const history = [
    {...game,id:'draw',team_score:'12',opponent_score:'12',game_date_epoch:'100'},
    {...game,id:'win1',team_score:'12',opponent_score:'9',game_date_epoch:'300'},
    game,
    {...game,id:'win2',team_score:'9',opponent_score:'8',game_date_epoch:'200'},
  ];
  const detail={game,players:[player,{...player,player_id:'leader',player_name:'Game Leader',points:'20',rebounds:'10',assists:'8'}],events:[],lineupEvents:[]};
  const html=await renderPage('/src/pages/HomePage.jsx','/','/',['home-game'],{game},[
    [['games'],history],[['game-details',game.id],detail],
  ]);
  for (const text of ['50%','10.5','9.8','Last game leaders','Recent games','Game Leader']) assert.ok(html.includes(text),text);
  assert.match(html,/href="\/players\/leader"/);
  assert.match(html,/href="\/games\/finished"/);
  assert.match(html,/href="\/season"/);
  assert.ok(html.indexOf('href="/games/win1"')<html.indexOf('href="/games/win2"'));
  assert.ok(html.indexOf('href="/games/win2"')<html.indexOf('href="/games/draw"'));
});
