export function periodLabel(period, regulation = 4) {
  return period <= regulation ? `Q${period}` : `OT${period - regulation}`;
}

export function filterPlays(events, period) {
  return period === "all" ? events : events.filter(event => Number(event.period) === Number(period));
}

export function scoreLabel(event, isHomeGame) {
  if (event.team_score_at_event == null || event.opponent_score_at_event == null) return "—";
  const team = Number(event.team_score_at_event);
  const opponent = Number(event.opponent_score_at_event);
  return isHomeGame ? `${team} – ${opponent}` : `${opponent} – ${team}`;
}

export function scoringAction(type) {
  if (type.endsWith("THREE_MADE")) return "3-point basket";
  if (type.endsWith("TWO_MADE")) return "2-point basket";
  if (type.endsWith("FT_MADE")) return "Free throw";
  return type.replaceAll("_", " ").toLowerCase();
}

export function assistingPlayer(event, players = []) {
  if (event.assist_player_name?.trim()) return event.assist_player_name;
  const id = event.assisted_by_player_remote_id;
  if (id == null) return null;
  const player = players.find(player => String(player.player_id ?? player.id) === String(id));
  return player?.player_name ?? player?.name ?? null;
}
