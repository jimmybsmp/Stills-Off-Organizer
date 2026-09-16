import { create } from 'zustand';
import { makeId } from '@/lib/id';
import { loadAppData, scheduleAutosave } from '@/lib/autosave';
import {
  emptyAppData,
  migrate,
  type AppData,
  type AssetDef,
  type BoardItem,
  type CheatSheetDef,
  type DocType,
  type DriveDef,
  type ShortcutDef,
  type TemplateDef,
} from './schema';

interface AppStore {
  data: AppData;
  ready: boolean;
  init: () => Promise<void>;

  addDocType: (docType: Omit<DocType, 'id'>) => string;
  updateDocType: (id: string, patch: Partial<Omit<DocType, 'id'>>) => void;
  removeDocType: (id: string) => void;

  addTemplate: (tpl: Omit<TemplateDef, 'id'>) => string;
  updateTemplate: (id: string, patch: Partial<Omit<TemplateDef, 'id'>>) => void;
  removeTemplate: (id: string) => void;

  addShortcut: (s: Omit<ShortcutDef, 'id'>) => string;
  updateShortcut: (id: string, patch: Partial<Omit<ShortcutDef, 'id'>>) => void;
  removeShortcut: (id: string) => void;

  addDrive: (d: Omit<DriveDef, 'id'>) => string;
  updateDrive: (id: string, patch: Partial<Omit<DriveDef, 'id'>>) => void;
  removeDrive: (id: string) => void;

  addCheatSheet: (c: Omit<CheatSheetDef, 'id' | 'updatedAt'>) => string;
  updateCheatSheet: (id: string, patch: Partial<Omit<CheatSheetDef, 'id'>>) => void;
  removeCheatSheet: (id: string) => void;

  addBoard: (name: string) => string;
  renameBoard: (id: string, name: string) => void;
  removeBoard: (id: string) => void;
  addBoardItem: (boardId: string, item: Omit<BoardItem, 'id' | 'z'>) => string;
  updateBoardItem: (boardId: string, itemId: string, patch: Partial<Omit<BoardItem, 'id'>>) => void;
  removeBoardItem: (boardId: string, itemId: string) => void;

  registerAsset: (asset: Omit<AssetDef, 'id'>, id: string) => void;
}

function persist(data: AppData) {
  scheduleAutosave(data);
}

export const useAppStore = create<AppStore>((set) => ({
  data: emptyAppData(),
  ready: false,

  init: async () => {
    const raw = await loadAppData();
    const data = migrate(raw ? JSON.parse(raw) : null);
    set({ data, ready: true });
  },

  addDocType: (docType) => {
    const id = makeId();
    set((s) => {
      const data: AppData = {
        ...s.data,
        docTypeIds: [...s.data.docTypeIds, id],
        docTypes: { ...s.data.docTypes, [id]: { ...docType, id } },
      };
      persist(data);
      return { data };
    });
    return id;
  },

  updateDocType: (id, patch) => {
    set((s) => {
      const existing = s.data.docTypes[id];
      if (!existing) return s;
      const data: AppData = {
        ...s.data,
        docTypes: { ...s.data.docTypes, [id]: { ...existing, ...patch } },
      };
      persist(data);
      return { data };
    });
  },

  removeDocType: (id) => {
    set((s) => {
      const docTypes = { ...s.data.docTypes };
      delete docTypes[id];
      const data: AppData = {
        ...s.data,
        docTypeIds: s.data.docTypeIds.filter((x) => x !== id),
        docTypes,
      };
      persist(data);
      return { data };
    });
  },

  addTemplate: (tpl) => {
    const id = makeId();
    set((s) => {
      const data: AppData = {
        ...s.data,
        templateIds: [...s.data.templateIds, id],
        templates: { ...s.data.templates, [id]: { ...tpl, id } },
      };
      persist(data);
      return { data };
    });
    return id;
  },

  updateTemplate: (id, patch) => {
    set((s) => {
      const existing = s.data.templates[id];
      if (!existing) return s;
      const data: AppData = {
        ...s.data,
        templates: { ...s.data.templates, [id]: { ...existing, ...patch } },
      };
      persist(data);
      return { data };
    });
  },

  removeTemplate: (id) => {
    set((s) => {
      const templates = { ...s.data.templates };
      delete templates[id];
      const data: AppData = {
        ...s.data,
        templateIds: s.data.templateIds.filter((x) => x !== id),
        templates,
      };
      persist(data);
      return { data };
    });
  },

  addShortcut: (sc) => {
    const id = makeId();
    set((s) => {
      const data: AppData = {
        ...s.data,
        shortcutIds: [...s.data.shortcutIds, id],
        shortcuts: { ...s.data.shortcuts, [id]: { ...sc, id } },
      };
      persist(data);
      return { data };
    });
    return id;
  },

  updateShortcut: (id, patch) => {
    set((s) => {
      const existing = s.data.shortcuts[id];
      if (!existing) return s;
      const data: AppData = {
        ...s.data,
        shortcuts: { ...s.data.shortcuts, [id]: { ...existing, ...patch } },
      };
      persist(data);
      return { data };
    });
  },

  removeShortcut: (id) => {
    set((s) => {
      const shortcuts = { ...s.data.shortcuts };
      delete shortcuts[id];
      const data: AppData = {
        ...s.data,
        shortcutIds: s.data.shortcutIds.filter((x) => x !== id),
        shortcuts,
      };
      persist(data);
      return { data };
    });
  },

  addDrive: (d) => {
    const id = makeId();
    set((s) => {
      const data: AppData = {
        ...s.data,
        driveIds: [...s.data.driveIds, id],
        drives: { ...s.data.drives, [id]: { ...d, id } },
      };
      persist(data);
      return { data };
    });
    return id;
  },

  updateDrive: (id, patch) => {
    set((s) => {
      const existing = s.data.drives[id];
      if (!existing) return s;
      const data: AppData = {
        ...s.data,
        drives: { ...s.data.drives, [id]: { ...existing, ...patch } },
      };
      persist(data);
      return { data };
    });
  },

  removeDrive: (id) => {
    set((s) => {
      const drives = { ...s.data.drives };
      delete drives[id];
      const data: AppData = {
        ...s.data,
        driveIds: s.data.driveIds.filter((x) => x !== id),
        drives,
      };
      persist(data);
      return { data };
    });
  },

  addCheatSheet: (c) => {
    const id = makeId();
    set((s) => {
      const data: AppData = {
        ...s.data,
        cheatSheetIds: [...s.data.cheatSheetIds, id],
        cheatSheets: { ...s.data.cheatSheets, [id]: { ...c, id, updatedAt: Date.now() } },
      };
      persist(data);
      return { data };
    });
    return id;
  },

  updateCheatSheet: (id, patch) => {
    set((s) => {
      const existing = s.data.cheatSheets[id];
      if (!existing) return s;
      const data: AppData = {
        ...s.data,
        cheatSheets: {
          ...s.data.cheatSheets,
          [id]: { ...existing, ...patch, updatedAt: Date.now() },
        },
      };
      persist(data);
      return { data };
    });
  },

  removeCheatSheet: (id) => {
    set((s) => {
      const cheatSheets = { ...s.data.cheatSheets };
      delete cheatSheets[id];
      const data: AppData = {
        ...s.data,
        cheatSheetIds: s.data.cheatSheetIds.filter((x) => x !== id),
        cheatSheets,
      };
      persist(data);
      return { data };
    });
  },

  addBoard: (name) => {
    const id = makeId();
    set((s) => {
      const board = { id, name, itemIds: [], items: {}, updatedAt: Date.now() };
      const data: AppData = {
        ...s.data,
        boardIds: [...s.data.boardIds, id],
        boards: { ...s.data.boards, [id]: board },
      };
      persist(data);
      return { data };
    });
    return id;
  },

  renameBoard: (id, name) => {
    set((s) => {
      const existing = s.data.boards[id];
      if (!existing) return s;
      const data: AppData = {
        ...s.data,
        boards: { ...s.data.boards, [id]: { ...existing, name, updatedAt: Date.now() } },
      };
      persist(data);
      return { data };
    });
  },

  removeBoard: (id) => {
    set((s) => {
      const boards = { ...s.data.boards };
      delete boards[id];
      const data: AppData = {
        ...s.data,
        boardIds: s.data.boardIds.filter((x) => x !== id),
        boards,
      };
      persist(data);
      return { data };
    });
  },

  addBoardItem: (boardId, item) => {
    const itemId = makeId();
    set((s) => {
      const board = s.data.boards[boardId];
      if (!board) return s;
      const z = board.itemIds.length;
      const nextBoard = {
        ...board,
        itemIds: [...board.itemIds, itemId],
        items: { ...board.items, [itemId]: { ...item, id: itemId, z } },
        updatedAt: Date.now(),
      };
      const data: AppData = { ...s.data, boards: { ...s.data.boards, [boardId]: nextBoard } };
      persist(data);
      return { data };
    });
    return itemId;
  },

  updateBoardItem: (boardId, itemId, patch) => {
    set((s) => {
      const board = s.data.boards[boardId];
      const item = board?.items[itemId];
      if (!board || !item) return s;
      const nextBoard = {
        ...board,
        items: { ...board.items, [itemId]: { ...item, ...patch } },
        updatedAt: Date.now(),
      };
      const data: AppData = { ...s.data, boards: { ...s.data.boards, [boardId]: nextBoard } };
      persist(data);
      return { data };
    });
  },

  removeBoardItem: (boardId, itemId) => {
    set((s) => {
      const board = s.data.boards[boardId];
      if (!board) return s;
      const items = { ...board.items };
      delete items[itemId];
      const nextBoard = {
        ...board,
        itemIds: board.itemIds.filter((x) => x !== itemId),
        items,
        updatedAt: Date.now(),
      };
      const data: AppData = { ...s.data, boards: { ...s.data.boards, [boardId]: nextBoard } };
      persist(data);
      return { data };
    });
  },

  registerAsset: (asset, id) => {
    set((s) => {
      if (s.data.assets[id]) return s;
      const data: AppData = {
        ...s.data,
        assetIds: [...s.data.assetIds, id],
        assets: { ...s.data.assets, [id]: { ...asset, id } },
      };
      persist(data);
      return { data };
    });
  },
}));
