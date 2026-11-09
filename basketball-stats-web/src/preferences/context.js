import { createContext, useContext } from "react";
import { translate } from "./translations";
import { findTeam } from "../utils/teamLogos";
import { englishTeamName } from "../utils/teamNames";
import { localizedPlayerName } from "../utils/playerNames";
const names = { afeka:"אפקה", ariel:"אוניברסיטת אריאל", biu:"אוניברסיטת בר־אילן", hit:"המכון הטכנולוגי חולון", runi:"אוניברסיטת רייכמן", sce:"סמי שמעון", tau:"אוניברסיטת תל אביב", wingate:"לוינסקי־וינגייט" };
export const PreferencesContext = createContext({ language:"en", theme:"light" });
export function usePreferences() {
  const preferences = useContext(PreferencesContext);
  return { ...preferences, t: text => translate(text, preferences.language), teamName: name => preferences.language === "he" ? names[findTeam(name)?.id] ?? name : englishTeamName(name), playerName: name => localizedPlayerName(name, preferences.language) };
}
