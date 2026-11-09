import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createServer } from "vite";
import { availableSeasons, seasonGames } from "../src/utils/schedule.js";
import { completedGames } from "../src/utils/gameStats.js";
let vite;
before(async () => { vite = await createServer({server:{middlewareMode:true}, appType:"custom"}); });
after(async () => { await vite?.close(); });
const fixture = {id:"fixture", status:"SCHEDULED", season:"26/27", opponent_name:"Future opponent", round_number:1, is_home_game:true, game_date_epoch:Date.parse("2026-11-26T00:00:00+02:00")};
const legacy = {...fixture, id:"legacy", status:"FINISHED", season:undefined, opponent_name:"Legacy opponent", team_score:12, opponent_score:10};
const live = {...fixture, id:"live", status:"LIVE", opponent_name:"Live opponent", team_score:3, opponent_score:5, is_home_game:false};
const games = [fixture,legacy,live];
async function render(url, data=games) {
  const {default:Page} = await vite.ssrLoadModule("/src/pages/GamesPage.jsx");
  const client = new QueryClient(); client.setQueryData(["schedule-games"], data);
  try { return renderToStaticMarkup(React.createElement(QueryClientProvider,{client},React.createElement(MemoryRouter,{initialEntries:[url]},React.createElement(Page)))); }
  finally { client.clear(); }
}
test("seasons include current and legacy; filtering excludes deleted games and orders by date", () => {
  assert.deepEqual(availableSeasons(games), ["26/27","25/26"]);
  assert.deepEqual(seasonGames(games,"25/26").map(g=>g.id), ["legacy"]);
  assert.equal(seasonGames([...games,{...fixture,is_deleted:true}],"all").length,3);
  assert.deepEqual(seasonGames([fixture,{...live,game_date_epoch:fixture.game_date_epoch+1}],"26/27").map(g=>g.id),["fixture","live"]);
  assert.deepEqual(completedGames(games).map(g=>g.id),["legacy"]);
});
test("current season defaults to scheduled and live games without result links or win badges", async () => {
  const html = await render("/games");
  assert.match(html, /Scheduled/); assert.match(html, /Live opponent/); assert.match(html, /26[/.]11[/.]2026/);
  assert.match(html, /—/); assert.doesNotMatch(html, /Legacy opponent|href="\/games\/|aria-label="(?:Win|Loss|Draw)"/);
  assert.match(html, /value="26\/27" selected/);
});
test("URL selector restores legacy and all seasons; finished games keep summary links", async () => {
  const legacyHtml = await render("/games?season=25%2F26");
  assert.match(legacyHtml,/Legacy opponent/); assert.match(legacyHtml,/href="\/games\/legacy"/);
  assert.doesNotMatch(legacyHtml,/Future opponent/);
  const all = await render("/games?season=all");
  for (const text of ["Legacy opponent","Future opponent","Live opponent"]) assert.ok(all.includes(text));
  assert.match(await render("/games",[legacy]), /No games in this season/);
});
test("Games tab fetches all statuses independently of the completed game feed", async () => {
  const {apiClient} = await vite.ssrLoadModule("/src/api/apiClient.js");
  const {getScheduleGames} = await vite.ssrLoadModule("/src/api/gamesApi.js");
  const original = apiClient.defaults.adapter;
  apiClient.defaults.adapter = async config => {
    assert.equal(config.params?.status,undefined);
    return {data:[...games,{...fixture,is_deleted:true}],status:200,statusText:"OK",headers:{},config};
  };
  try { assert.equal((await getScheduleGames()).length,3); }
  finally { apiClient.defaults.adapter = original; }
});

test("scheduled fixtures appear first in ascending date and round order, completed results stay newest first", () => {
  const next = {...fixture,id:"next",round_number:2,game_date_epoch:fixture.game_date_epoch+86400000};
  const laterRound = {...fixture,id:"later-round",round_number:3};
  const recentResult = {...legacy,id:"recent-result",season:"26/27",game_date_epoch:fixture.game_date_epoch+1};
  assert.deepEqual(seasonGames([next,recentResult,laterRound,fixture,{...legacy,season:"26/27"}],"26/27").map(g=>g.id),
    ["fixture","later-round","next","recent-result","legacy"]);
});

test("already imported Hebrew opponents display in English on the English Games page", async () => {
  const html = await render("/games", [{...fixture,opponent_name:"המרכז האקדמי לוינסקי וינגייט"}]);
  assert.match(html, /Levinsky-Wingate Academic Center/);
  assert.doesNotMatch(html, /[\u0590-\u05ff]/);
});
