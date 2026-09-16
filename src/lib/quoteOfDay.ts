const MS_PER_DAY = 86_400_000;

/** Picks the same quote for everyone all day, rotating to the next one at
 * midnight local time — deterministic from the calendar date and the list
 * itself, so it needs no persisted "last shown" state. */
export function quoteOfDayId(quoteIds: string[], now: Date = new Date()): string | null {
  if (quoteIds.length === 0) return null;
  const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayIndex = Math.floor(localMidnight / MS_PER_DAY);
  return quoteIds[dayIndex % quoteIds.length];
}
