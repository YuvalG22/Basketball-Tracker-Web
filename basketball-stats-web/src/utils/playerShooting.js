const fields = ['two_made', 'two_miss', 'three_made', 'three_miss', 'ft_made', 'ft_miss'];
export function sumShooting(games) {
  return Object.fromEntries(fields.map(key => [key, games.reduce((total, game) => total + Number(game[key] ?? 0), 0)]));
}
export function shootingStats(game) {
  const two = Number(game.two_made ?? 0), three = Number(game.three_made ?? 0), ft = Number(game.ft_made ?? 0);
  const twoA = two + Number(game.two_miss ?? 0), threeA = three + Number(game.three_miss ?? 0), ftA = ft + Number(game.ft_miss ?? 0);
  return [["Field goals", two + three, twoA + threeA], ["2 pointers", two, twoA], ["3 pointers", three, threeA], ["Free throws", ft, ftA]];
}
export function shootingValue(made, attempts, digits = 0) {
  return `${made}/${attempts} (${attempts ? Number((made / attempts * 100).toFixed(digits)) : 0}%)`;
}
