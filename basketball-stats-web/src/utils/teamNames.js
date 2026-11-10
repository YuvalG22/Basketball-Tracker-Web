import { findTeam } from "./teamLogos.js";
export const AFEKA_NAME_EN = "Afeka College";
export const AFEKA_NAME_HE = "מכללת אפקה";
const englishNames = {
  "wingate": "Levinsky-Wingate Academic Center",
  "biu": "Bar-Ilan University",
  "colman": "College of Management",
  "sce": "Sami Shamoon College of Engineering - Ashdod",
  "ariel": "Ariel University",
  "shenkar": "Shenkar",
  "runi": "Reichman University",
  "tau": "Tel Aviv University",
  "hit": "Holon Institute of Technology",
  "afeka": AFEKA_NAME_EN
};
export function englishTeamName(name) {
  if (findTeam(name)?.id === "afeka") return AFEKA_NAME_EN;
  return /[\u0590-\u05ff]/.test(name ?? "") ? englishNames[findTeam(name)?.id] ?? name : name;
}
