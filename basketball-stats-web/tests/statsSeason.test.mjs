import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveStatsSeason,hasSeasonStats} from '../src/utils/statsSeason.js';
import {aggregateTiming} from '../src/utils/seasonTiming.js';
const ready=data=>({data,isSuccess:true});
test('team-wide fallback prefers current stats and only falls back to recorded previous stats',()=>{
 const current=ready([{player_id:'one',gp:1}]), empty=ready([{gp:0}]), previous=ready([{gp:'2'}]);
 assert.equal(resolveStatsSeason(null,current,previous).season,'26/27');
 assert.equal(resolveStatsSeason(null,empty,previous).season,'25/26');
 assert.equal(resolveStatsSeason(null,empty,previous).fallback,true);
 assert.equal(resolveStatsSeason(null,empty,empty).season,'26/27');
 assert.equal(hasSeasonStats([{gp:0,pts:0}]),false);
});
test('explicit empty season wins; pending and failures never become automatic fallback',()=>{
 const empty=ready([]),previous=ready([{gp:2}]);
 assert.equal(resolveStatsSeason('26/27',empty,previous).season,'26/27');
 assert.equal(resolveStatsSeason('26/27',empty,previous).fallback,false);
 for(const status of [{isPending:true},{isError:true}]) {
  assert.equal(resolveStatsSeason(null,status,previous).query,status);
  assert.equal(resolveStatsSeason(null,status,previous).fallback,false);
  assert.equal(resolveStatsSeason(null,empty,status).fallback,false);
 }
});
test('timing aggregation respects missing data, weighted minutes and plus/minus',()=>{
 const player={player_id:'p'};
 const games={a:{seconds:{p:600},players:[player],plusMinus:{p:3}},b:{seconds:{p:1200},players:[player],plusMinus:{p:-1}}};
 assert.equal(aggregateTiming(games,true).averages.p,900);
 assert.equal(aggregateTiming(games,true).plusMinusTotals.p,2);
 assert.deepEqual(aggregateTiming(games,false).averages,{});
 assert.equal(aggregateTiming({...games,c:{seconds:{},players:[player],plusMinus:{}}},true).averages.p,undefined);
});
