import { useState } from "react";
import { filterPlays, periodLabel, scoreLabel, scoringAction, assistingPlayer } from "../utils/playByPlay";

export default function PlayByPlay({ events, game, players = [] }) {
  const [period, setPeriod] = useState("all");
  const regulation = Number(game.quarters_count) || 4;
  const periods = [...new Set([
    ...Array.from({ length: regulation }, (_, index) => index + 1),
    ...events.map(event => Number(event.period)).filter(value => value > 0),
  ])].sort((a, b) => a - b);
  const visible = filterPlays(events, period);
  return (
    <section className="overflow-hidden rounded-[20px] bg-surface" aria-label="Play by Play">
      <header className="border-b border-line p-4">
        <h2 className="text-xl font-bold">Play by Play</h2>
        <p className="mt-1 text-xs text-muted">Scores shown as home – away</p>
        <div className="mt-3 flex flex-wrap gap-1" role="group" aria-label="Filter by period">
          {["all", ...periods].map(value => (
            <button key={value} aria-pressed={period === value} onClick={() => setPeriod(value)}
              className={`min-h-11 border-b-2 px-3 text-sm font-semibold ${period === value ? "border-accent text-accent" : "border-transparent text-muted"}`}>
              {value === "all" ? "All periods" : periodLabel(value, regulation)}
            </button>
          ))}
        </div>
      </header>
      <div className="play-list" role="region" aria-label="Recorded plays" tabIndex={0}>
        {visible.length === 0 ? <p className="p-4 text-sm text-muted">No recorded events for this period.</p> : (
          <table className="play-table">
            <caption className="sr-only">Recorded plays, home team on the left and away team on the right</caption>
            <colgroup><col /><col className="play-score-column" /><col /></colgroup>
            <thead><tr>
              <th scope="col">{game.is_home_game ? "Afeka" : game.opponent_name}</th>
              <th scope="col" className="play-score">Score / Time</th>
              <th scope="col" className="play-away-heading">{game.is_home_game ? game.opponent_name : "Afeka"}</th>
            </tr></thead>
            <tbody>
              {visible.map((event, index) => {
                const label = periodLabel(Number(event.period), regulation);
                const marker = event.type === "PERIOD_START" || event.type === "PERIOD_END";
                const opponent = event.type.startsWith("OPP_");
                const homeSide = opponent ? !game.is_home_game : game.is_home_game;
                const seconds = Math.max(0, Number(event.clock_sec_remaining) || 0);
                const assistName = assistingPlayer(event, players);
                const action = <>
                  <span className="font-semibold">{event.player_name ?? (opponent ? game.opponent_name : "Afeka")}</span>{" "}
                  <span>{scoringAction(event.type)}</span>
                  <span className="play-assist">{assistName ? <>Assist: <span className="font-medium">{assistName}</span></> : "\u00a0"}</span>
                </>;
                return marker ? (
                  <tr key={event.id ?? index} className="play-period"><td colSpan={3}>{event.type === "PERIOD_START" ? "START" : "END"} {label}</td></tr>
                ) : (
                  <tr key={event.id ?? index} data-team-side={homeSide ? "home" : "away"}>
                    <td className="play-home">{homeSide ? action : null}</td>
                    <td className="play-score">
                      <span aria-label="Score">{scoreLabel(event, game.is_home_game)}</span>
                      <span className="play-clock">{label} · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>
                    </td>
                    <td className="play-away">{!homeSide ? action : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
