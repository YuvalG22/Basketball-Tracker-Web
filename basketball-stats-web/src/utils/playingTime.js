// Use the tracker's recorded SUB_IN / SUB_OUT stints independently per player.
// Opening-lineup taps may be recorded after the game clock has started.
export function calculatePlayingTime({ game, players = [], events = [], lineupEvents = [] }) {
  const length = Number(game.quarter_length_sec);
  const result = { seconds: {}, starters: null };
  if (!(length > 0) || !lineupEvents.length) return result;
  const roster = new Set(players.map(player => String(player.player_id)));
  const elapsed = event => (Number(event.period) - 1) * length + length - Number(event.clock_sec_remaining);
  const valid = event => Number.isInteger(Number(event.period)) && Number(event.period) > 0 && event.clock_sec_remaining != null && Number(event.clock_sec_remaining) >= 0 && Number(event.clock_sec_remaining) <= length;
  const timestamp = event => Number(event.created_at) || Date.parse(event.created_at) || 0;
  const invalid = new Set();
  const seen = new Set();
  const ordered = lineupEvents.filter(event => {
    const id = String(event.player_id);
    if (!roster.has(id)) return false;
    if (!valid(event)) { invalid.add(id); return false; }
    if (event.created_at != null) {
      const key = [id, event.type, event.period, event.clock_sec_remaining, event.created_at].join('|');
      if (seen.has(key)) return false;
      seen.add(key);
    }
    return event.type === 'SUB_IN' || event.type === 'SUB_OUT';
  }).map((event, index) => ({ ...event, index })).sort((a, b) => elapsed(a) - elapsed(b) || timestamp(a) - timestamp(b) || a.index - b.index);
  if (!ordered.length) return result;

  // The five initial entries before the first exit identify the starting lineup.
  const opening = new Set();
  for (const event of ordered) {
    if (Number(event.period) !== 1 || event.type === 'SUB_OUT') break;
    opening.add(String(event.player_id));
    if (opening.size === 5) break;
  }
  if (opening.size === 5) result.starters = [...opening];

  const markers = events.filter(event => event.type === 'PERIOD_END' && valid(event));
  const periodEnds = new Map(markers.map(event => [Number(event.period), elapsed(event)]));
  const lastPeriod = Math.max(Number(game.quarters_count) || 4, ...events.map(event => Number(event.period) || 0), ...ordered.map(event => Number(event.period)));
  const end = periodEnds.get(lastPeriod) ?? (ordered.some(event => Number(event.period) === lastPeriod && event.type === 'SUB_OUT' && Number(event.clock_sec_remaining) === 0) ? lastPeriod * length : null);
  function duration(start, finish) {
    let seconds = Math.max(0, finish - start);
    // A manually shortened period must not add time during the break.
    for (const [period, actualEnd] of periodEnds) seconds -= Math.max(0, Math.min(finish, period * length) - Math.max(start, actualEnd));
    return Math.max(0, seconds);
  }
  const active = new Map(), totals = {}, lastExit = new Map();
  for (const event of ordered) {
    const id = String(event.player_id), time = elapsed(event);
    if (event.type === 'SUB_IN') {
      // Duplicate sync records must not reset an already open stint.
      if (!active.has(id)) active.set(id, time);
    } else if (active.has(id)) {
      totals[id] = (totals[id] ?? 0) + duration(active.get(id), time);
      active.delete(id);
      lastExit.set(id, time);
    } else if (lastExit.get(id) !== time) {
      invalid.add(id);
    }
  }
  for (const [id, start] of active) {
    if (end == null || end < start) invalid.add(id);
    else totals[id] = (totals[id] ?? 0) + duration(start, end);
  }
  const activity = ['points', 'rebounds', 'defensive_rebounds', 'offensive_rebounds', 'assists', 'steals', 'blocks', 'turnovers', 'fouls', 'two_miss', 'three_miss', 'ft_miss'];
  for (const player of players) {
    const id = String(player.player_id);
    if (invalid.has(id)) continue;
    const seconds = totals[id] ?? 0;
    if (seconds === 0 && activity.some(key => Number(player[key] ?? 0) > 0)) continue;
    result.seconds[id] = seconds;
  }
  return result;
}

export function formatMinutes(seconds) {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}
