import { findTeam } from "./teamLogos";
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
  "afeka": "Afeka"
};
export function englishTeamName(name) {
  return /[\u0590-\u05ff]/.test(name ?? "") ? englishNames[findTeam(name)?.id] ?? name : name;
}
