import test from "node:test";
import assert from "node:assert/strict";
import { localizedPlayerName } from "../src/utils/playerNames.js";

test("all supplied Hebrew player names follow the selected language", () => {
  const names = [
    ["Noam Groundland", "נועם גרונדלנד"], ["Ido David", "עידו דוד"],
    ["Itay Cohen", "איתי כהן"], ["Gal Ravid", "גל רביד"],
    ["Ido Cohen", "עידו כהן"], ["Yanai Dvorkin", "ינאי דבורקין"],
    ["Elad Cohen", "אלעד כהן"], ["Nir Englander", "ניר אנגלנדר"],
    ["Or Azulay", "אור אזולאי"], ["Noam Ofir", "נועם אופיר"],
    ["Adi Eckstein", "עדי אקשטיין"], ["Guy Shturman", "גיא שטורמן"],
  ];
  for (const [english, hebrew] of names) {
    assert.equal(localizedPlayerName(english, "he"), hebrew);
    assert.equal(localizedPlayerName(english, "en"), english);
    assert.equal(localizedPlayerName(`  ${english.toUpperCase().replace(' ', '   ')}  `, "he"), hebrew);
  }
});

test("missing mappings and absent names preserve their original values", () => {
  for (const name of ["Unknown Player", "  Unknown   Player  ", "נועם אופיר", "", null, undefined]) {
    assert.equal(localizedPlayerName(name, "he"), name);
    assert.equal(localizedPlayerName(name, "en"), name);
  }
  assert.equal(localizedPlayerName("  NOAM   OFIR  ", "en"), "  NOAM   OFIR  ");
});
