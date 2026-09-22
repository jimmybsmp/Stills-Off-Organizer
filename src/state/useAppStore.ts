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
  type ContactDef,
  type DailyBPDay,
  type DailyBPTarget,
  type DocType,
  type DriveDef,
  type QuoteDef,
  type ShortcutDef,
  type TemplateDef,
  type TrashEntry,
  type TrashKind,
  type VaultEntryDef,
} from './schema';

const TRASH_RETENTION_MS = 24 * 60 * 60 * 1000;
const RECENT_FILES_MAX = 10;

type DailyBPStat = 'shots' | 'packages';

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

  addQuote: (q: Omit<QuoteDef, 'id'>) => string;
  updateQuote: (id: string, patch: Partial<Omit<QuoteDef, 'id'>>) => void;
  removeQuote: (id: string) => void;

  addBoard: (name: string) => string;
  renameBoard: (id: string, name: string) => void;
  removeBoard: (id: string) => void;
  addBoardItem: (boardId: string, item: Omit<BoardItem, 'id' | 'z'>) => string;
  updateBoardItem: (boardId: string, itemId: string, patch: Partial<Omit<BoardItem, 'id'>>) => void;
  removeBoardItem: (boardId: string, itemId: string) => void;

  registerAsset: (asset: Omit<AssetDef, 'id'>, id: string) => void;

  addContact: (c: Omit<ContactDef, 'id' | 'updatedAt'>) => string;
  updateContact: (id: string, patch: Partial<Omit<ContactDef, 'id'>>) => void;
  removeContact: (id: string) => void;

  addVaultEntry: (v: Omit<VaultEntryDef, 'id' | 'updatedAt'>) => string;
  updateVaultEntry: (id: string, patch: Partial<Omit<VaultEntryDef, 'id'>>) => void;
  removeVaultEntry: (id: string) => void;

  pushRecentFile: (label: string, path: string) => void;

  setDailyBPQuota: (stat: DailyBPStat, quota: number) => void;
  setDailyBPAchieved: (dateKey: string, stat: DailyBPStat, achieved: number) => void;
  addDailyBPTarget: (dateKey: string, description: string, person: string) => string;
  toggleDailyBPTarget: (dateKey: string, targetId: string) => void;
  removeDailyBPTarget: (dateKey: string, targetId: string) => void;

  restoreFromTrash: (trashId: string) => void;
  deleteForever: (trashId: string) => void;
  purgeExpiredTrash: () => void;
}

function persist(data: AppData) {
  scheduleAutosave(data);
}

function emptyDay(dateKey: string): DailyBPDay {
  return { date: dateKey, shotsAchieved: 0, packagesAchieved: 0, targets: [] };
}

function trash(data: AppData, kind: TrashKind, label: string, payload: unknown): AppData {
  const id = makeId();
  const entry: TrashEntry = { id, kind, label, payload, deletedAt: Date.now() };
  return {
    ...data,
    trashIds: [...data.trashIds, id],
    trash: { ...data.trash, [id]: entry },
  };
}

export const useAppStore = create<AppStore>((set) => ({
  data: emptyAppData(),
  ready: false,

  init: async () => {
    const raw = await loadAppData();
    const data = migrate(raw ? JSON.parse(raw) : null);
    set({ data, ready: true });
    useAppStore.getState().purgeExpiredTrash();
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
      const existing = s.data.docTypes[id];
      if (!existing) return s;
      const docTypes = { ...s.data.docTypes };
      delete docTypes[id];
      let data: AppData = {
        ...s.data,
        docTypeIds: s.data.docTypeIds.filter((x) => x !== id),
        docTypes,
      };
      data = trash(data, 'docType', existing.label, existing);
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
      const existing = s.data.templates[id];
      if (!existing) return s;
      const templates = { ...s.data.templates };
      delete templates[id];
      let data: AppData = {
        ...s.data,
        templateIds: s.data.templateIds.filter((x) => x !== id),
        templates,
      };
      data = trash(data, 'template', existing.label, existing);
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
      const existing = s.data.shortcuts[id];
      if (!existing) return s;
      const shortcuts = { ...s.data.shortcuts };
      delete shortcuts[id];
      let data: AppData = {
        ...s.data,
        shortcutIds: s.data.shortcutIds.filter((x) => x !== id),
        shortcuts,
      };
      data = trash(data, 'shortcut', existing.label, existing);
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
      const existing = s.data.drives[id];
      if (!existing) return s;
      const drives = { ...s.data.drives };
      delete drives[id];
      let data: AppData = {
        ...s.data,
        driveIds: s.data.driveIds.filter((x) => x !== id),
        drives,
      };
      data = trash(data, 'drive', existing.label, existing);
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
      const existing = s.data.cheatSheets[id];
      if (!existing) return s;
      const cheatSheets = { ...s.data.cheatSheets };
      delete cheatSheets[id];
      let data: AppData = {
        ...s.data,
        cheatSheetIds: s.data.cheatSheetIds.filter((x) => x !== id),
        cheatSheets,
      };
      data = trash(data, 'cheatSheet', existing.title || 'Untitled', existing);
      persist(data);
      return { data };
    });
  },

  addQuote: (q) => {
    const id = makeId();
    set((s) => {
      const data: AppData = {
        ...s.data,
        quoteIds: [...s.data.quoteIds, id],
        quotes: { ...s.data.quotes, [id]: { ...q, id } },
      };
      persist(data);
      return { data };
    });
    return id;
  },

  updateQuote: (id, patch) => {
    set((s) => {
      const existing = s.data.quotes[id];
      if (!existing) return s;
      const data: AppData = {
        ...s.data,
        quotes: { ...s.data.quotes, [id]: { ...existing, ...patch } },
      };
      persist(data);
      return { data };
    });
  },

  removeQuote: (id) => {
    set((s) => {
      const existing = s.data.quotes[id];
      if (!existing) return s;
      const quotes = { ...s.data.quotes };
      delete quotes[id];
      let data: AppData = {
        ...s.data,
        quoteIds: s.data.quoteIds.filter((x) => x !== id),
        quotes,
      };
      data = trash(data, 'quote', existing.text.slice(0, 60), existing);
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
      const existing = s.data.boards[id];
      if (!existing) return s;
      const boards = { ...s.data.boards };
      delete boards[id];
      let data: AppData = {
        ...s.data,
        boardIds: s.data.boardIds.filter((x) => x !== id),
        boards,
      };
      data = trash(data, 'board', existing.name || 'Untitled board', existing);
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

  addContact: (c) => {
    const id = makeId();
    set((s) => {
      const data: AppData = {
        ...s.data,
        contactIds: [...s.data.contactIds, id],
        contacts: { ...s.data.contacts, [id]: { ...c, id, updatedAt: Date.now() } },
      };
      persist(data);
      return { data };
    });
    return id;
  },

  updateContact: (id, patch) => {
    set((s) => {
      const existing = s.data.contacts[id];
      if (!existing) return s;
      const data: AppData = {
        ...s.data,
        contacts: { ...s.data.contacts, [id]: { ...existing, ...patch, updatedAt: Date.now() } },
      };
      persist(data);
      return { data };
    });
  },

  removeContact: (id) => {
    set((s) => {
      const existing = s.data.contacts[id];
      if (!existing) return s;
      const contacts = { ...s.data.contacts };
      delete contacts[id];
      let data: AppData = {
        ...s.data,
        contactIds: s.data.contactIds.filter((x) => x !== id),
        contacts,
      };
      data = trash(data, 'contact', existing.name || 'Unnamed contact', existing);
      persist(data);
      return { data };
    });
  },

  addVaultEntry: (v) => {
    const id = makeId();
    set((s) => {
      const data: AppData = {
        ...s.data,
        vaultEntryIds: [...s.data.vaultEntryIds, id],
        vaultEntries: { ...s.data.vaultEntries, [id]: { ...v, id, updatedAt: Date.now() } },
      };
      persist(data);
      return { data };
    });
    return id;
  },

  updateVaultEntry: (id, patch) => {
    set((s) => {
      const existing = s.data.vaultEntries[id];
      if (!existing) return s;
      const data: AppData = {
        ...s.data,
        vaultEntries: {
          ...s.data.vaultEntries,
          [id]: { ...existing, ...patch, updatedAt: Date.now() },
        },
      };
      persist(data);
      return { data };
    });
  },

  removeVaultEntry: (id) => {
    set((s) => {
      const existing = s.data.vaultEntries[id];
      if (!existing) return s;
      const vaultEntries = { ...s.data.vaultEntries };
      delete vaultEntries[id];
      let data: AppData = {
        ...s.data,
        vaultEntryIds: s.data.vaultEntryIds.filter((x) => x !== id),
        vaultEntries,
      };
      data = trash(data, 'vaultEntry', existing.label, existing);
      persist(data);
      return { data };
    });
  },

  pushRecentFile: (label, path) => {
    const id = makeId();
    set((s) => {
      const withoutDuplicate = s.data.recentFileIds.filter((x) => s.data.recentFiles[x]?.path !== path);
      const keptIds = [id, ...withoutDuplicate].slice(0, RECENT_FILES_MAX);
      const droppedIds = [id, ...withoutDuplicate].slice(RECENT_FILES_MAX);
      const recentFiles = { ...s.data.recentFiles };
      for (const droppedId of droppedIds) delete recentFiles[droppedId];
      recentFiles[id] = { id, label, path, openedAt: Date.now() };
      const data: AppData = { ...s.data, recentFileIds: keptIds, recentFiles };
      persist(data);
      return { data };
    });
  },

  setDailyBPQuota: (stat, quota) => {
    set((s) => {
      const dailyBPSettings = {
        ...s.data.dailyBPSettings,
        [stat === 'shots' ? 'shotsQuota' : 'packagesQuota']: quota,
      };
      const data: AppData = { ...s.data, dailyBPSettings };
      persist(data);
      return { data };
    });
  },

  setDailyBPAchieved: (dateKey, stat, achieved) => {
    set((s) => {
      const day = s.data.dailyBPDays[dateKey] ?? emptyDay(dateKey);
      const nextDay: DailyBPDay =
        stat === 'shots' ? { ...day, shotsAchieved: achieved } : { ...day, packagesAchieved: achieved };
      const data: AppData = { ...s.data, dailyBPDays: { ...s.data.dailyBPDays, [dateKey]: nextDay } };
      persist(data);
      return { data };
    });
  },

  addDailyBPTarget: (dateKey, description, person) => {
    const id = makeId();
    set((s) => {
      const day = s.data.dailyBPDays[dateKey] ?? emptyDay(dateKey);
      const row: DailyBPTarget = { id, description, person, done: false };
      const nextDay: DailyBPDay = { ...day, targets: [...day.targets, row] };
      const data: AppData = { ...s.data, dailyBPDays: { ...s.data.dailyBPDays, [dateKey]: nextDay } };
      persist(data);
      return { data };
    });
    return id;
  },

  toggleDailyBPTarget: (dateKey, targetId) => {
    set((s) => {
      const day = s.data.dailyBPDays[dateKey];
      const target = day?.targets.find((t) => t.id === targetId);
      if (!day || !target) return s;
      const nextDay: DailyBPDay = {
        ...day,
        targets: day.targets.map((t) => (t.id === targetId ? { ...t, done: !t.done } : t)),
      };
      const data: AppData = { ...s.data, dailyBPDays: { ...s.data.dailyBPDays, [dateKey]: nextDay } };
      persist(data);
      return { data };
    });
  },

  removeDailyBPTarget: (dateKey, targetId) => {
    set((s) => {
      const day = s.data.dailyBPDays[dateKey];
      if (!day) return s;
      const nextDay: DailyBPDay = { ...day, targets: day.targets.filter((t) => t.id !== targetId) };
      const data: AppData = { ...s.data, dailyBPDays: { ...s.data.dailyBPDays, [dateKey]: nextDay } };
      persist(data);
      return { data };
    });
  },

  restoreFromTrash: (trashId) => {
    set((s) => {
      const entry = s.data.trash[trashId];
      if (!entry) return s;
      const trashLeft = { ...s.data.trash };
      delete trashLeft[trashId];
      let data: AppData = {
        ...s.data,
        trashIds: s.data.trashIds.filter((x) => x !== trashId),
        trash: trashLeft,
      };

      switch (entry.kind) {
        case 'docType': {
          const p = entry.payload as DocType;
          data = { ...data, docTypeIds: [...data.docTypeIds, p.id], docTypes: { ...data.docTypes, [p.id]: p } };
          break;
        }
        case 'template': {
          const p = entry.payload as TemplateDef;
          data = {
            ...data,
            templateIds: [...data.templateIds, p.id],
            templates: { ...data.templates, [p.id]: p },
          };
          break;
        }
        case 'shortcut': {
          const p = entry.payload as ShortcutDef;
          data = {
            ...data,
            shortcutIds: [...data.shortcutIds, p.id],
            shortcuts: { ...data.shortcuts, [p.id]: p },
          };
          break;
        }
        case 'drive': {
          const p = entry.payload as DriveDef;
          data = { ...data, driveIds: [...data.driveIds, p.id], drives: { ...data.drives, [p.id]: p } };
          break;
        }
        case 'cheatSheet': {
          const p = entry.payload as CheatSheetDef;
          data = {
            ...data,
            cheatSheetIds: [...data.cheatSheetIds, p.id],
            cheatSheets: { ...data.cheatSheets, [p.id]: p },
          };
          break;
        }
        case 'quote': {
          const p = entry.payload as QuoteDef;
          data = { ...data, quoteIds: [...data.quoteIds, p.id], quotes: { ...data.quotes, [p.id]: p } };
          break;
        }
        case 'board': {
          const p = entry.payload as AppData['boards'][string];
          data = { ...data, boardIds: [...data.boardIds, p.id], boards: { ...data.boards, [p.id]: p } };
          break;
        }
        case 'contact': {
          const p = entry.payload as ContactDef;
          data = {
            ...data,
            contactIds: [...data.contactIds, p.id],
            contacts: { ...data.contacts, [p.id]: p },
          };
          break;
        }
        case 'vaultEntry': {
          const p = entry.payload as VaultEntryDef;
          data = {
            ...data,
            vaultEntryIds: [...data.vaultEntryIds, p.id],
            vaultEntries: { ...data.vaultEntries, [p.id]: p },
          };
          break;
        }
        default: {
          const exhaustive: never = entry.kind;
          throw new Error(`Unhandled trash kind: ${exhaustive}`);
        }
      }

      persist(data);
      return { data };
    });
  },

  deleteForever: (trashId) => {
    set((s) => {
      const trashLeft = { ...s.data.trash };
      delete trashLeft[trashId];
      const data: AppData = {
        ...s.data,
        trashIds: s.data.trashIds.filter((x) => x !== trashId),
        trash: trashLeft,
      };
      persist(data);
      return { data };
    });
  },

  purgeExpiredTrash: () => {
    set((s) => {
      const cutoff = Date.now() - TRASH_RETENTION_MS;
      const expired = s.data.trashIds.filter((id) => (s.data.trash[id]?.deletedAt ?? 0) < cutoff);
      if (expired.length === 0) return s;
      const trash = { ...s.data.trash };
      for (const id of expired) delete trash[id];
      const data: AppData = {
        ...s.data,
        trashIds: s.data.trashIds.filter((id) => !expired.includes(id)),
        trash,
      };
      persist(data);
      return { data };
    });
  },
}));
