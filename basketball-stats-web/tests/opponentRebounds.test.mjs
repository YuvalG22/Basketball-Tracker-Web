import test from 'node:test';
import assert from 'node:assert/strict';
import { teamStatsFromEvents } from '../src/utils/teamStats.js';

test('opponent rebounds count independently of player rebounds and exclude deleted events', () => {
  const stats = teamStatsFromEvents({}, [
    { type: 'REB_OFF' }, { type: 'REB_DEF' },
    { type: 'OPP_REB_O' }, { type: 'OPP_REB_D' }, { type: 'OPP_REB_D' },
    { type: 'OPP_REB_O', is_deleted: true },
  ]);
  assert.equal(stats.afeka.rebounds, 2);
  assert.equal(stats.opponent.rebounds, 3);
  assert.equal(stats.opponent.offensive_rebounds, 1);
  assert.equal(stats.opponent.defensive_rebounds, 2);
  assert.equal(stats.opponent.points, 0);
  assert.equal(teamStatsFromEvents({}, []).opponent.rebounds, null);
  assert.equal(teamStatsFromEvents({}, [{ type: 'OPP_REB_O' }]).opponent.defensive_rebounds, 0);
});
