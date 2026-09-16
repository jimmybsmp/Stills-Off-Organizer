export const SCHEMA_VERSION = 1;

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

  const base = emptyAppData();
  return {
    ...base,
    ...data,
    schemaVersion: SCHEMA_VERSION,
  } as AppData;
}
