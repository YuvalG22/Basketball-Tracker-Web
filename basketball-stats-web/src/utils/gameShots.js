const shotTypes = new Set(["TWO_MADE", "TWO_MISS", "THREE_MADE", "THREE_MISS", "OPP_TWO_MADE", "OPP_TWO_MISS", "OPP_THREE_MADE", "OPP_THREE_MISS"]);
export function gameShots(events = []) {
  return events.filter(shot => !shot.is_deleted && shotTypes.has(shot.type) && shot.shot_x != null && shot.shot_y != null &&
    Number.isFinite(Number(shot.shot_x)) && Number.isFinite(Number(shot.shot_y)) &&
    Number(shot.shot_x) >= 0 && Number(shot.shot_x) <= 15 && Number(shot.shot_y) >= 0 && Number(shot.shot_y) <= 14);
}
