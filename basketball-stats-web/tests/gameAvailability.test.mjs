import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

test("legacy API availability uses real events, shares the fallback feed, and never mistakes lookup failure for no stats", async () => {
  const vite = await createServer({server:{middlewareMode:true},appType:"custom"});
  try {
    const {apiClient} = await vite.ssrLoadModule("/src/api/apiClient.js");
    const {getGames,getScheduleGames,getGameDetails} = await vite.ssrLoadModule("/src/api/gamesApi.js");
    const {canOpenSummary} = await vite.ssrLoadModule("/src/components/GameSummaryLink.jsx");
    const games=[{id:"recorded",status:"FINISHED",team_score:2,opponent_score:0},{id:"empty",status:"FINISHED"},{id:"subs",status:"FINISHED"}];
    const events=[{game_remote_id:"recorded",type:"TWO_MADE",shot_x:7,shot_y:4},{game_remote_id:"recorded",type:"TWO_MISS"},{game_remote_id:"empty",type:"TWO_MADE",is_deleted:true},{game_remote_id:"subs",type:"SUB_IN"}];
    let fail=true, feedRequests=0;
    apiClient.defaults.adapter = async config => {
      let data;
      if(config.url==="/events") { feedRequests++; if(fail) throw new Error("Offline"); data=events; }
      else if(config.url==="/games") data=games;
      else data={game:games.find(game=>config.url.endsWith(game.id)),events:[],players:[],lineupEvents:[]};
      return {data,status:200,statusText:"OK",headers:{},config};
    };
    const unknown=await getGames();
    assert.equal(unknown[0].has_events,undefined);
    assert.equal(canOpenSummary(unknown[0]),true);
    fail=false;
    const recorded=await getGames();
    assert.deepEqual(recorded.map(game=>game.has_events),[true,false,true]);
    assert.equal(canOpenSummary(recorded[0]),true);
    assert.equal(canOpenSummary(recorded[1]),false);
    assert.equal(canOpenSummary(recorded[2]),true);
    await getScheduleGames();
    const details=await getGameDetails("recorded");
    assert.equal(details.game.has_events,true);
    assert.equal(details.shots.length,1);
    assert.equal(details.shots[0].shot_x,7);
    assert.equal(details.teamStats.afeka.two.attempts,2);
    assert.equal((await getGameDetails("empty")).game.has_events,false);
    assert.equal(feedRequests,2,"one failed request followed by one shared successful fallback");
    apiClient.defaults.adapter=async config=>({data:[{...games[0],has_events:false}],status:200,statusText:"OK",headers:{},config});
    assert.equal((await getGames())[0].has_events,false,"explicit server metadata remains authoritative");
    assert.equal(canOpenSummary({status:"LIVE",has_events:true}),false);
  } finally { await vite.close(); }
});
