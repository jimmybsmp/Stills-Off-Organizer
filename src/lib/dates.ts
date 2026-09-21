/** Local-calendar-day key (YYYY-MM-DD) — the unit Daily BP and the trash
 * expiry check both key off, so a "day" always means the viewer's own day. */
export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
