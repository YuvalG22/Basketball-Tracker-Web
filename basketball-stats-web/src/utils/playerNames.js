const hebrewNames = new Map([
  ["Noam Groundland", "נועם גרונדלנד"],
  ["Ido David", "עידו דוד"],
  ["Itay Cohen", "איתי כהן"],
  ["Gal Ravid", "גל רביד"],
  ["Ido Cohen", "עידו כהן"],
  ["Yanai Dvorkin", "ינאי דבורקין"],
  ["Elad Cohen", "אלעד כהן"],
  ["Nir Englander", "ניר אנגלנדר"],
  ["Or Azulay", "אור אזולאי"],
  ["Noam Ofir", "נועם אופיר"],
  ["Adi Eckstein", "עדי אקשטיין"],
  ["Guy Shturman", "גיא שטורמן"],
].map(([name, hebrew]) => [normalizeName(name), hebrew]));

function normalizeName(name) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function localizedPlayerName(name, language) {
  if (language !== "he" || typeof name !== "string") return name;
  return hebrewNames.get(normalizeName(name)) ?? name;
}
