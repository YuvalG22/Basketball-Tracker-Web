import { readFileSync } from "node:fs";
﻿import test from "node:test";
import assert from "node:assert/strict";
import { calculatePlayingTime, formatMinutes } from "../src/utils/playingTime.js";
const players = Array.from({ length: 6 }, (_, index) => ({ player_id: String(index + 1) }));
const event = (type, id, period, clock) => ({ type, player_id: String(id), period, clock_sec_remaining: clock });
const starts = players.slice(0, 5).map(p => event('SUB_IN', p.player_id, 1, 600));
const game = { quarter_length_sec: 600, quarters_count: 4 };
const data = { game, players, lineupEvents: [...starts, event('SUB_OUT', 1, 1, 300), event('SUB_IN', 6, 1, 300)], events: [{ type: 'PERIOD_END', period: 4, clock_sec_remaining: 0 }] };
test('playing time identifies the opening five and integrates substitutions across periods', () => {
  const result = calculatePlayingTime(data);
  assert.deepEqual(result.starters, ['1','2','3','4','5']);
  assert.equal(result.seconds['1'], 300);
  assert.equal(result.seconds['6'], 2100);
  assert.equal(result.seconds['2'], 2400);
  assert.equal(Object.values(result.seconds).reduce((a,b) => a+b, 0), 5*2400);
  assert.equal(formatMinutes(result.seconds['6']), '35:00');
});
test('playing time uses the tracker period length for overtime and respects an early final marker', () => {
  assert.equal(calculatePlayingTime({ ...data, events: [{ type:'PERIOD_END', period:5, clock_sec_remaining:0 }] }).seconds['2'], 3000);
  assert.equal(calculatePlayingTime({ ...data, events: [{ type:'PERIOD_END', period:4, clock_sec_remaining:100 }] }).seconds['2'], 2300);
});
test('incomplete records affect only the player whose stint is unknown', () => {
  assert.deepEqual(calculatePlayingTime({ ...data, lineupEvents: [] }).seconds, {});
  const partialOpening = calculatePlayingTime({ ...data, lineupEvents: starts.slice(0,4) });
  assert.equal(partialOpening.starters, null);
  assert.equal(partialOpening.seconds['1'], 2400);
  const missingEnd = calculatePlayingTime({ ...data, events: [] });
  assert.equal(missingEnd.seconds['1'], 300);
  assert.equal(missingEnd.seconds['2'], undefined);
  assert.equal(formatMinutes(null), '—');
});

test('final closing substitutions establish the end without a period marker', () => {
  const closing = [2,3,4,5,6].map(id=>event('SUB_OUT',id,4,0));
  const result=calculatePlayingTime({...data, events:[],lineupEvents:[...data.lineupEvents,...closing]});
  assert.equal(result.seconds['6'],2100);
});

test('statistical activity without a recorded stint marks the minutes as incomplete', () => {
  const result=calculatePlayingTime({...data,lineupEvents:starts,players:players.map(player=>({...player,points:player.player_id==='6'?2:0}))});
  assert.equal(result.seconds['6'], undefined);
  assert.equal(result.seconds['1'], 2400);
  assert.equal(result.starters.length,5);
});

test('recorded opening taps after tipoff, sync duplicates and substitution gaps remain usable', () => {
  const fixture=JSON.parse(readFileSync(new URL('./fixtures/staggered-opening-lineup.json', import.meta.url)));
  const lineupEvents=fixture.substitutions.map(([type,period,clock,player,created_at])=>({type,period,clock_sec_remaining:clock,player_id:String(player),created_at}));
  const result=calculatePlayingTime({game,players:fixture.players,events:fixture.events,lineupEvents});
  assert.deepEqual(result.starters,['14','2','1','8','6']);
  assert.deepEqual(result.seconds,{'1':1688,'2':2096,'3':0,'4':1006,'6':2106,'8':996,'9':683,'10':1390,'11':534,'14':1425});
  assert.equal(formatMinutes(result.seconds['6']),'35:06');
});

test('a small gap between outgoing and incoming taps does not erase every player', () => {
  const lineupEvents=[...starts,event('SUB_OUT',1,1,300),event('SUB_IN',6,1,298)];
  const result=calculatePlayingTime({...data,lineupEvents});
  assert.equal(result.seconds['1'],300);
  assert.equal(result.seconds['6'],2098);
  assert.equal(result.seconds['2'],2400);
});

test('an orphan exit invalidates only that player while duplicate exits are harmless', () => {
  const result=calculatePlayingTime({...data,lineupEvents:[...data.lineupEvents,event('SUB_OUT',1,1,300),event('SUB_OUT',6,1,200),event('SUB_OUT',6,2,400)]});
  assert.equal(result.seconds['1'],300);
  assert.equal(result.seconds['6'],undefined);
  assert.equal(result.seconds['2'],2400);
});
