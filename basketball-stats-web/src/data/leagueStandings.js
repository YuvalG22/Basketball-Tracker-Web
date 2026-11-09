// Initial league order supplied for the standings. Results will be added later.
export const leagueStandings = [
  { id: "runi", nameEn: "Reichman University", nameHe: "אוניברסיטת רייכמן", logoName: "Reichman" },
  { id: "colman", nameEn: "College of Management Academic Studies", nameHe: "המסלול האקדמי המכללה למינהל", logoName: "College of Management" },
  { id: "tau", nameEn: "Tel Aviv University", nameHe: "אוניברסיטת תל-אביב", logoName: "Tel Aviv University" },
  { id: "afeka", nameEn: "Afeka – Tel Aviv Academic College of Engineering", nameHe: "אפקה - המכללה האקדמית להנדסה בתל-אביב", logoName: "Afeka" },
  { id: "hit", nameEn: "Holon Institute of Technology", nameHe: "מכון טכנולוגי חולון", logoName: "HIT" },
  { id: "ariel", nameEn: "Ariel Student Association", nameHe: "אגודת הסטודנטים אריאל", logoName: "Ariel" },
  { id: "wingate", nameEn: "Levinsky–Wingate Academic Center", nameHe: "המרכז האקדמי לוינסקי וינגייט", logoName: "Wingate" },
  { id: "shenkar", nameEn: "Shenkar", nameHe: "שנקר", logoName: "Shenkar" },
  { id: "biu", nameEn: "Bar Ilan University", nameHe: "אוניברסיטת בר אילן", logoName: "Bar Ilan" },
  { id: "sce", nameEn: "Sami Shamoon College of Engineering – Ashdod", nameHe: "המכללה האקדמית להנדסה עש סמי שמעון אשדוד", logoName: "SCE" },
].map(team => ({ ...team, gamesPlayed: 0, wins: 0, losses: 0, pointDifference: 0, leaguePoints: 0 }));
