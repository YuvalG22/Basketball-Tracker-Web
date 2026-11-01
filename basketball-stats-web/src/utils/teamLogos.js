// Official institutional assets; Ariel (public domain) and Bar-Ilan (CC0) via Commons.
export const teams = [
  { id: "afeka", aliases: ["Afeka", "אפקה", "מכללת אפקה"], file: "afeka.svg", source: "https://www.afeka.ac.il/" },
  { id: "ariel", aliases: ["Ariel", "Ariel University", "אריאל", "אוניברסיטת אריאל"], file: "ariel.svg", source: "https://commons.wikimedia.org/wiki/File:Ariel_University_Logo.svg" },
  { id: "biu", aliases: ["Bar Ilan", "Bar-Ilan University", "Bar Ilan University", "BIU", "בר אילן", "אוניברסיטת בר אילן"], file: "biu.png", source: "https://commons.wikimedia.org/wiki/File:Bar_Ilan_logo.png" },
  { id: "hit", aliases: ["HIT", "Holon Institute of Technology", "חולון", "המכון הטכנולוגי חולון"], file: "hit.png", source: "https://www.hit.ac.il/" },
  { id: "runi", aliases: ["Reichman", "Reichman University", "IDC", "רייכמן", "אוניברסיטת רייכמן", "הבינתחומי"], file: "runi.png", dark: true, source: "https://www.runi.ac.il/" },
  { id: "sce", aliases: ["SCE", "Sami Shamoon", "Sami Shamoon College of Engineering", "סמי שמעון"], file: "sce.png", source: "https://sce-net.en.aptoide.com/app" },
  { id: "tau", aliases: ["Tel Aviv University", "TAU", "אוניברסיטת תל אביב"], file: "tau.png", dark: true, source: "https://www.tau.ac.il/" },
  { id: "wingate", aliases: ["Wingate", "Levinsky Wingate", "וינגייט", "לוינסקי וינגייט"], file: "wingate.svg", source: "https://www.l-w.ac.il/" },
];
const normalize = name => String(name ?? "").normalize("NFKC").toLowerCase().replace(/[־–—-]/g, " ").replace(/\s+/g, " ").trim();
export function findTeam(name) {
  return teams.find(team => team.aliases.some(alias => normalize(alias) === normalize(name)));
}
