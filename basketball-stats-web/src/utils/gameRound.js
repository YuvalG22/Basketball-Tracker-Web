const stages = {
  QUARTER_FINAL: "Quarterfinal",
  SEMI_FINAL: "Semifinal",
  FINAL: "Final",
};

export function isPlayoffGame(game) {
  return game.is_playoff === true || game.is_playoff === 1 || game.is_playoff === "true" || Boolean(game.playoff_stage?.trim());
}

export function formatGameRound(game, t = text => text) {
  if (isPlayoffGame(game)) {
    const stage = game.playoff_stage?.trim();
    const name = stage ? t(stages[stage.toUpperCase()] ?? stage.replaceAll("_", " ")) : t("Playoffs");
    const number = Number(game.playoff_game_number);
    return Number.isInteger(number) && number > 0 ? `${name} · ${t("Game")} ${number}` : name;
  }
  const round = Number(game.round_number);
  return Number.isInteger(round) && round > 0 ? `${t("Round")} ${round}` : "";
}
