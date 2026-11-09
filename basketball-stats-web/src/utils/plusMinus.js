import { findTeam } from './teamLogos.js';

const points = {
  FT_MADE: 1, TWO_MADE: 2, THREE_MADE: 3,
  OPP_FT_MADE: -1, OPP_TWO_MADE: -2, OPP_THREE_MADE: -3,
};
const timestamp = value => Number.isFinite(Number(value)) ? Number(value) : Date.parse(value) || 0;
const compareId = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const gameDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' });

function hasExcludedPlusMinus(game) {
  if (findTeam(game?.opponent_name)?.id !== 'runi') return false;
  const date = new Date(Number(game.game_date_epoch));
  // The first Reichman game's +/- is explicitly marked unavailable.
  return !Number.isNaN(date.getTime()) && gameDate.format(date) === '2026-05-08';
}

// Replay the same event order and on-court set as Android. Source IDs are
// bigint strings over the API, so retain their precision when timestamps tie.
export function calculatePlusMinus({ game, players = [], events = [], lineupEvents = [] }) {
  if (hasExcludedPlusMinus(game)) return {};
  // A nonzero opponent score without scoring events cannot be assigned to stints.
  // An explicitly recorded shutout can still have valid zero opponent points.
  const opponentScoringTracked = events.some(event => points[event.type] < 0);
  const shutout = game?.opponent_score != null && game.opponent_score !== '' && Number(game.opponent_score) === 0;
  if (!opponentScoringTracked && !shutout) return {};
  if (!lineupEvents.some(event => event.type === 'SUB_IN' && event.player_id != null)) return {};
  const totals = Object.fromEntries(players.map(player => [String(player.player_id), 0]));
  const active = new Set();
  const ordered = [...events, ...lineupEvents].sort((a, b) =>
    Number(a.period) - Number(b.period) ||
    Number(b.clock_sec_remaining) - Number(a.clock_sec_remaining) ||
    timestamp(a.created_at) - timestamp(b.created_at) ||
    compareId(BigInt(a.local_id ?? 0), BigInt(b.local_id ?? 0)) ||
    compareId(String(a.id), String(b.id)));
  for (const event of ordered) {
    const id = event.player_id == null ? null : String(event.player_id);
    if (event.type === 'SUB_IN') {
      if (id != null) { active.add(id); totals[id] ??= 0; }
    } else if (event.type === 'SUB_OUT') {
      if (id != null) active.delete(id);
    } else {
      const delta = points[event.type] ?? 0;
      if (delta) for (const player of active) totals[player] += delta;
    }
  }
  return totals;
}

export function formatPlusMinus(value) {
  return value == null || !Number.isFinite(value) ? '—' : value > 0 ? `+${value}` : String(value);
}

export function seasonPlusMinusTotals(games, complete) {
  if (!complete) return {};
  const totals = {};
  for (const game of Object.values(games)) {
    for (const player of game.players ?? []) {
      const id = String(player.player_id);
      const value = game.plusMinus?.[id];
      totals[id] = (totals[id] ?? 0) + (value ?? 0);
    }
  }
  return totals;
}

export function formatAveragePlusMinus(value) {
  if (value == null || !Number.isFinite(value)) return '—';
  const rounded = Number(value.toFixed(1));
  return `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}`;
}
