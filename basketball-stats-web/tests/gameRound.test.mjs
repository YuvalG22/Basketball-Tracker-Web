import test from "node:test";
import assert from "node:assert/strict";
import { formatGameRound } from "../src/utils/gameRound.js";
import { translate } from "../src/preferences/translations.js";

test("playoff labels use the stored stage and game number instead of round zero", () => {
  for (const [stage, name] of [["QUARTER_FINAL", "Quarterfinal"], ["SEMI_FINAL", "Semifinal"], ["FINAL", "Final"]]) {
    assert.equal(formatGameRound({ is_playoff: true, round_number: 0, playoff_stage: stage, playoff_game_number: "2" }), `${name} · Game 2`);
  }
  assert.equal(formatGameRound({ round_number: "3", is_playoff: false }), "Round 3");
  assert.equal(formatGameRound({ round_number: 0, playoff_stage: "SEMI_FINAL", playoff_game_number: 1 }), "Semifinal · Game 1");
});

test("missing playoff metadata never invents a round or game number", () => {
  assert.equal(formatGameRound({ is_playoff: true, round_number: 0 }), "Playoffs");
  assert.equal(formatGameRound({ is_playoff: true, playoff_stage: "FINAL", playoff_game_number: 0 }), "Final");
  assert.equal(formatGameRound({ is_playoff: true, playoff_stage: "Placement", playoff_game_number: 1 }), "Placement · Game 1");
  assert.equal(formatGameRound({ round_number: null }), "");
});

test("playoff labels translate the stage and game number caption", () => {
  const t = text => translate(text, "he");
  assert.equal(formatGameRound({ is_playoff: true, round_number: 0, playoff_stage: "SEMI_FINAL", playoff_game_number: 2 }, t), t("Semifinal") + " · " + t("Game") + " 2");
});
