import { isDesktop, desktop } from './desktop';
import type { AppData } from '@/state/schema';

let timer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 600;

export function scheduleAutosave(data: AppData): void {
  if (!isDesktop()) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    desktop()
      .writeData(JSON.stringify(data))
      .catch(() => {
        // A failed write must never surface mid-edit — the next successful
        // autosave (or an explicit save) will catch the data back up.
      });
  }, DEBOUNCE_MS);
}

export async function loadAppData(): Promise<string | null> {
  if (!isDesktop()) return null;
  return desktop().readData();
}
