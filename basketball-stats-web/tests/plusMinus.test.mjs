import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePlusMinus, formatPlusMinus, seasonPlusMinusTotals, formatAveragePlusMinus } from '../src/utils/plusMinus.js';

const event = (id, type, clock = 500, player = null, period = 1, created = id) => ({
  id: `remote-${String(id).padStart(3, '0')}`, local_id: String(id), type,
  clock_sec_remaining: String(clock), player_id: player,
  period: String(period), created_at: String(created),
});
const starter = (id = 1) => event(id, 'SUB_IN', 600, id);
function calculate(all, players = [1, 2, 3, 4, 5, 6]) {
  return calculatePlusMinus({ players: players.map(player_id => ({ player_id })),
    events: all.filter(e => !e.type.startsWith('SUB_')),
    lineupEvents: all.filter(e => e.type.startsWith('SUB_')) });
}

test('all made shots have the signed Android values; non-scoring events are ignored', () => {
  for (const [type, value] of Object.entries({ FT_MADE: 1, TWO_MADE: 2, THREE_MADE: 3,
    OPP_FT_MADE: -1, OPP_TWO_MADE: -2, OPP_THREE_MADE: -3 })) {
    assert.equal(calculate([starter(), event(10, type)])[1], value);
  }
  for (const type of ['FT_MISS', 'TWO_MISS', 'THREE_MISS', 'OPP_FT_MISS', 'OPP_TWO_MISS',
    'OPP_THREE_MISS', 'REB_OFF', 'REB_DEF', 'AST', 'STL', 'TOV', 'BLK', 'PF', 'OPP_PF', 'PERIOD_START', 'PERIOD_END']) {
    assert.equal(calculate([starter(), event(10, type)])[1], 0);
  }
});

test('teammate scoring applies to all active players and never to the bench', () => {
  const result = calculate([1, 2, 3, 4, 5].map(starter).concat(event(10, 'THREE_MADE', 500, 3)));
  assert.deepEqual(result, { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 0 });
});

test('multiple stints exclude scoring before entry, after exit and on the bench', () => {
  const events = [event(1, 'THREE_MADE', 590), event(2, 'SUB_IN', 550, 1),
    event(3, 'TWO_MADE', 500), event(4, 'SUB_OUT', 450, 1),
    event(5, 'OPP_THREE_MADE', 400), event(6, 'SUB_IN', 350, 1),
    event(7, 'OPP_FT_MADE', 300)];
  assert.equal(calculate(events)[1], 1);
  assert.equal(calculate(events.filter(e => e.local_id !== '7'))[1], 2);
});

test('duplicates, unmatched exits and null player substitutions preserve the active set', () => {
  assert.equal(calculate([event(1, 'SUB_OUT', 600, 1), event(2, 'SUB_IN', 580, 1),
    event(3, 'SUB_IN', 550, '1'), event(4, 'SUB_OUT', 540), event(5, 'SUB_IN', 530),
    event(6, 'TWO_MADE', 500), event(7, 'SUB_OUT', 450, 1),
    event(8, 'SUB_OUT', 400, 1), event(9, 'OPP_THREE_MADE', 350)])[1], 2);
});

test('shuffled events merge by creation time then numeric source ID, then remote ID', () => {
  const events = [starter(), event(10, 'FT_MADE'), event(11, 'SUB_OUT', 500, 1),
    event(12, 'SUB_IN', 500, 2), event(13, 'FT_MADE')];
  const tied = events.map(e => ({ ...e, created_at: '0' })).reverse();
  assert.deepEqual([calculate(tied)[1], calculate(tied)[2]], [1, 1]);
  const byCreation = events.map(e => ({ ...e, local_id: String(100 - Number(e.local_id)) })).reverse();
  assert.deepEqual([calculate(byCreation)[1], calculate(byCreation)[2]], [1, 1]);
  const byRemote = events.map(e => ({ ...e, local_id: null, created_at: '0' })).reverse();
  assert.deepEqual([calculate(byRemote)[1], calculate(byRemote)[2]], [1, 1]);
  const copy = structuredClone(tied);
  calculate(tied);
  assert.deepEqual(tied, copy);
});

test('lineups carry through periods and boundary substitutions into overtime', () => {
  const events = [starter(), event(10, 'TWO_MADE', 550),
    event(11, 'OPP_THREE_MADE', 550, null, 2), event(12, 'TWO_MADE', 0, null, 4),
    event(13, 'SUB_OUT', 0, 1, 4), event(14, 'SUB_IN', 300, 2, 5),
    event(15, 'OPP_THREE_MADE', 250, null, 5)];
  assert.equal(calculate(events)[1], 1);
  assert.equal(calculate(events)[2], -3);
});

test('zero creation timestamps precede positive values, and bigint IDs retain precision', () => {
  const entry = event(1, 'SUB_IN', 500, 1, 1, 0);
  assert.equal(calculate([event(2, 'TWO_MADE', 500, null, 1, 1), entry])[1], 2);
  const exit = { ...event(2, 'SUB_OUT', 500, 1, 1, 0), local_id: '9007199254740993', id: 'a' };
  const score = { ...event(3, 'TWO_MADE', 500, null, 1, 0), local_id: '9007199254740992', id: 'z' };
  assert.equal(calculate([exit, score, entry])[1], 2);
});

test('five-player totals equal five times the scoring margin after substitutions', () => {
  const events = [1, 2, 3, 4, 5].map(starter).concat([
    event(10, 'THREE_MADE', 550), event(11, 'SUB_OUT', 500, 1),
    event(12, 'SUB_IN', 500, 6), event(13, 'OPP_TWO_MADE', 450),
    event(14, 'FT_MADE', 550, null, 2), event(15, 'OPP_THREE_MADE', 500, null, 2)]);
  assert.deepEqual(calculate(events), { 1: 3, 2: -1, 3: -1, 4: -1, 5: -1, 6: -4 });
  assert.equal(Object.values(calculate(events)).reduce((a, b) => a + b), 5 * (4 - 5));
});

test('unavailable lineup history differs from recorded zero; signed formatting', () => {
  assert.deepEqual(calculate([]), {});
  assert.deepEqual(calculate([event(10, 'TWO_MADE')]), {});
  assert.deepEqual(calculate([event(10, 'SUB_IN')]), {});
  assert.equal(calculate([starter()])[6], 0);
  assert.deepEqual([undefined, null, NaN, 0, 3, -2].map(formatPlusMinus), ['—', '—', '—', '0', '+3', '-2']);
});

test('season totals combine completed games without turning missing history into zero', () => {
  const players = [1, 2, 3].map(player_id => ({ player_id }));
  const games = { a: { players, plusMinus: { 1: 3, 2: -4, 3: 0 } },
    b: { players: players.slice(0, 2), plusMinus: { 1: 2 } } };
  assert.deepEqual(seasonPlusMinusTotals(games, false), {});
  assert.deepEqual(seasonPlusMinusTotals(games, true), { 1: 5, 3: 0 });
  assert.deepEqual([2.5, -3.25, 0, -0.01, null].map(formatAveragePlusMinus), ['+2.5', '-3.3', '0.0', '0.0', '—']);
});
