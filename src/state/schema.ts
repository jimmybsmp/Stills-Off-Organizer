export const SCHEMA_VERSION = 4;

export interface DocType {
  id: string;
  label: string;
  destinationFolder: string;
  dateSubfolder: boolean;
}

export interface TemplateDef {
  id: string;
  label: string;
  icon: string;
  sourcePath: string;
  extension: string;
  defaultDocTypeId: string | null;
}

export interface ShortcutDef {
  id: string;
  label: string;
  icon: string;
  targetPath: string;
}

export interface DriveDef {
  id: string;
  label: string;
  icon: string;
  /** Either a mounted volume path (/Volumes/Name) or a share URL (smb://host/share). */
  path: string;
}

export interface CheatSheetDef {
  id: string;
  title: string;
  category: string;
  body: string;
  updatedAt: number;
}

export interface BoardItem {
  id: string;
  assetId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  z: number;
}

export interface BoardDef {
  id: string;
  name: string;
  itemIds: string[];
  items: Record<string, BoardItem>;
  updatedAt: number;
}

export interface AssetDef {
  id: string;
  fileName: string;
  thumbFileName: string;
  originalName: string;
  width: number;
  height: number;
  addedAt: number;
}

export interface QuoteDef {
  id: string;
  text: string;
  author: string;
}

export interface ContactDef {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  notes: string;
  updatedAt: number;
}

export interface VaultEntryDef {
  id: string;
  label: string;
  username: string;
  /** Base64 ciphertext from Electron's safeStorage — only readable on this Mac, under this login. */
  passwordCipher: string;
  notes: string;
  updatedAt: number;
}

export interface RecentFileEntry {
  id: string;
  label: string;
  path: string;
  openedAt: number;
}

/** One line of the day's battle plan: a goal to accomplish, assigned to
 * whoever's doing it, checked off as it gets done. Always has a person —
 * that's the difference between this and the quota above it. */
export interface DailyBPTarget {
  id: string;
  description: string;
  person: string;
  done: boolean;
}

export interface DailyBPDay {
  date: string; // YYYY-MM-DD, local
  shotsAchieved: number;
  packagesAchieved: number;
  targets: DailyBPTarget[];
}

export interface DailyBPSettings {
  shotsQuota: number;
  packagesQuota: number;
}

/** What a trashed item was, so it can be rebuilt on restore and described in the Trash list. */
export type TrashKind =
  | 'docType'
  | 'template'
  | 'shortcut'
  | 'drive'
  | 'cheatSheet'
  | 'quote'
  | 'board'
  | 'contact'
  | 'vaultEntry';

export interface TrashEntry {
  id: string;
  kind: TrashKind;
  /** What to show in the Trash list — the item's own label/title/name. */
  label: string;
  payload: unknown;
  deletedAt: number;
}

export interface AppData {
  schemaVersion: number;
  docTypeIds: string[];
  docTypes: Record<string, DocType>;
  templateIds: string[];
  templates: Record<string, TemplateDef>;
  shortcutIds: string[];
  shortcuts: Record<string, ShortcutDef>;
  driveIds: string[];
  drives: Record<string, DriveDef>;
  cheatSheetIds: string[];
  cheatSheets: Record<string, CheatSheetDef>;
  boardIds: string[];
  boards: Record<string, BoardDef>;
  assetIds: string[];
  assets: Record<string, AssetDef>;
  quoteIds: string[];
  quotes: Record<string, QuoteDef>;
  contactIds: string[];
  contacts: Record<string, ContactDef>;
  vaultEntryIds: string[];
  vaultEntries: Record<string, VaultEntryDef>;
  recentFileIds: string[];
  recentFiles: Record<string, RecentFileEntry>;
  dailyBPSettings: DailyBPSettings;
  dailyBPDays: Record<string, DailyBPDay>;
  trashIds: string[];
  trash: Record<string, TrashEntry>;
}

export function emptyAppData(): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    docTypeIds: [],
    docTypes: {},
    templateIds: [],
    templates: {},
    shortcutIds: [],
    shortcuts: {},
    driveIds: [],
    drives: {},
    cheatSheetIds: [],
    cheatSheets: {},
    boardIds: [],
    boards: {},
    assetIds: [],
    assets: {},
    quoteIds: [],
    quotes: {},
    contactIds: [],
    contacts: {},
    vaultEntryIds: [],
    vaultEntries: {},
    recentFileIds: [],
    recentFiles: {},
    dailyBPSettings: { shotsQuota: 0, packagesQuota: 0 },
    dailyBPDays: {},
    trashIds: [],
    trash: {},
  };
}

/**
 * Every schema bump gets its own branch here; never edit an existing one —
 * data saved by an older build still has to enter through its original step.
 */
export function migrate(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') return emptyAppData();
  let data = raw as Partial<AppData> & { schemaVersion?: number };

  if (!data.schemaVersion || data.schemaVersion < 1) {
    data = { ...emptyAppData(), ...data, schemaVersion: 1 };
  }

  if ((data.schemaVersion ?? 0) < 2) {
    data = {
      ...data,
      quoteIds: data.quoteIds ?? [],
      quotes: data.quotes ?? {},
      schemaVersion: 2,
    };
  }

  if ((data.schemaVersion ?? 0) < 3) {
    data = {
      ...data,
      contactIds: data.contactIds ?? [],
      contacts: data.contacts ?? {},
      vaultEntryIds: data.vaultEntryIds ?? [],
      vaultEntries: data.vaultEntries ?? {},
      recentFileIds: data.recentFileIds ?? [],
      recentFiles: data.recentFiles ?? {},
      dailyBPSettings: data.dailyBPSettings ?? { shotsQuota: 0, packagesQuota: 0 },
      dailyBPDays: data.dailyBPDays ?? {},
      trashIds: data.trashIds ?? [],
      trash: data.trash ?? {},
      schemaVersion: 3,
    };
  }

  if ((data.schemaVersion ?? 0) < 4) {
    type LegacyTarget = { id: string; person: string; target: number };
    type LegacyDay = {
      date: string;
      shotsAchieved?: number;
      packagesAchieved?: number;
      shotsTargets?: LegacyTarget[];
      packagesTargets?: LegacyTarget[];
    };
    const legacyDays = (data.dailyBPDays ?? {}) as Record<string, LegacyDay>;
    const dailyBPDays: Record<string, DailyBPDay> = {};
    for (const [date, day] of Object.entries(legacyDays)) {
      const fromLegacy = (label: string, legacy: LegacyTarget[] | undefined): DailyBPTarget[] =>
        (legacy ?? []).map((t) => ({
          id: t.id,
          description: `${label} — ${t.target}`,
          person: t.person,
          done: false,
        }));
      dailyBPDays[date] = {
        date,
        shotsAchieved: day.shotsAchieved ?? 0,
        packagesAchieved: day.packagesAchieved ?? 0,
        targets: [
          ...fromLegacy('Shots in the Can', day.shotsTargets),
          ...fromLegacy('Photo Packages', day.packagesTargets),
        ],
      };
    }
    data = { ...data, dailyBPDays, schemaVersion: 4 };
  }

  const base = emptyAppData();
  return {
    ...base,
    ...data,
    schemaVersion: SCHEMA_VERSION,
  } as AppData;
}
