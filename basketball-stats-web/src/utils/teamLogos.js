// Institutional assets; Ariel and Bar-Ilan via Commons, Colman and Shenkar via Hebrew Wikipedia.
// Hosted sources are used for logos that could not be downloaded locally.
// Afeka: official Hebrew artwork, lettering adapted to dark ink for white backgrounds.
export const teams = [
  { id: "colman", aliases: ["College of Management", "College of Management Academic Studies", "המסלול האקדמי המכללה למינהל", "המכללה למינהל"], imageUrl: "https://upload.wikimedia.org/wikipedia/he/4/44/Colman_logo_2023.png", source: "https://he.wikipedia.org/wiki/File:Colman_logo_2023.png" },
  { id: "shenkar", aliases: ["Shenkar", "Shenkar College", "שנקר"], imageUrl: "https://upload.wikimedia.org/wikipedia/he/6/68/Shenkar_logo_since_2015.svg", source: "https://he.wikipedia.org/wiki/%D7%A7%D7%95%D7%91%D7%A5:Shenkar_logo_since_2015.svg" },
  { id: "afeka", aliases: ["Afeka", "Afeka College", "אפקה", "מכללת אפקה", "Afeka – Tel Aviv Academic College of Engineering", "אפקה - המכללה האקדמית להנדסה בתל-אביב"], file: "afeka.svg", source: "https://www.afeka.ac.il/media/owsb1xq5/logo-1.svg" },
  { id: "ariel", aliases: ["אגודת הסטודנטים אריאל", "Ariel", "Ariel University", "אריאל", "אוניברסיטת אריאל"], file: "ariel.svg", source: "https://commons.wikimedia.org/wiki/File:Ariel_University_Logo.svg" },
  { id: "biu", aliases: ["Bar Ilan", "Bar-Ilan University", "Bar Ilan University", "BIU", "בר אילן", "אוניברסיטת בר אילן"], file: "biu.png", source: "https://commons.wikimedia.org/wiki/File:Bar_Ilan_logo.png" },
  { id: "hit", aliases: ["מכון טכנולוגי חולון", "HIT", "Holon Institute of Technology", "חולון", "המכון הטכנולוגי חולון"], file: "hit.png", source: "https://www.hit.ac.il/" },
  { id: "runi", aliases: ["Reichman", "Reichman University", "IDC", "רייכמן", "אוניברסיטת רייכמן", "הבינתחומי"], file: "runi.png", dark: true, source: "https://www.runi.ac.il/" },
  { id: "sce", aliases: ["Sami Shamoon College of Engineering - Ashdod", "המכללה האקדמית להנדסה עש סמי שמעון אשדוד", "SCE", "Sami Shamoon", "Sami Shamoon College of Engineering", "סמי שמעון"], file: "sce.png", source: "https://sce-net.en.aptoide.com/app" },
  { id: "tau", aliases: ["אוניברסיטת תל-אביב", "Tel Aviv University", "TAU", "אוניברסיטת תל אביב"], imageUrl: "https://finance.tau.ac.il/sites/finance.tau.ac.il/files/media_server/graphic-design/TAU%20NEW%20LOGO/Eng_BW.png", source: "https://finance.tau.ac.il/graphics/gellery-TAU_logo_download_2493_2811" },
  { id: "wingate", aliases: ["Levinsky-Wingate Academic Center", "המרכז האקדמי לוינסקי וינגייט", "Wingate", "Levinsky Wingate", "וינגייט", "לוינסקי וינגייט"], file: "wingate.svg", source: "https://www.l-w.ac.il/" },
];
const normalize = name => String(name ?? "").normalize("NFKC").toLowerCase().replace(/[־–—-]/g, " ").replace(/\s+/g, " ").trim();
export function findTeam(name) {
  return teams.find(team => team.aliases.some(alias => normalize(alias) === normalize(name)));
}
