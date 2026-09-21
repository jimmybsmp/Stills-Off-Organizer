import { useAppStore } from '@/state/useAppStore';
import type { TrashKind } from '@/state/schema';
import { RotateCcw, Trash2 } from 'lucide-react';

const KIND_LABEL: Record<TrashKind, string> = {
  docType: 'Document Type',
  template: 'Template',
  shortcut: 'Tool',
  drive: 'Drive',
  cheatSheet: 'Cheat Sheet',
  quote: 'Quote',
  board: 'Idea Board',
  contact: 'Contact',
  vaultEntry: 'Vault Entry',
};

const RETENTION_MS = 24 * 60 * 60 * 1000;

function timeLeft(deletedAt: number): string {
  const msLeft = deletedAt + RETENTION_MS - Date.now();
  if (msLeft <= 0) return 'expiring now';
  const hours = Math.floor(msLeft / (60 * 60 * 1000));
  if (hours < 1) return 'less than an hour left';
  return `${hours} hour${hours === 1 ? '' : 's'} left`;
}

export function Trash() {
  const trashIds = useAppStore((s) => s.data.trashIds);
  const trash = useAppStore((s) => s.data.trash);
  const restoreFromTrash = useAppStore((s) => s.restoreFromTrash);
  const deleteForever = useAppStore((s) => s.deleteForever);

  const sortedIds = [...trashIds].sort((a, b) => (trash[b]?.deletedAt ?? 0) - (trash[a]?.deletedAt ?? 0));

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h1>Trash</h1>
          <p className="panel__subtitle">
            Deleted items stay here for 24 hours before they're gone for good.
          </p>
        </div>
      </header>

      <ul className="trash-list">
        {sortedIds.map((id) => {
          const entry = trash[id];
          if (!entry) return null;
          return (
            <li key={id} className="trash-list__row">
              <span className="trash-list__kind">{KIND_LABEL[entry.kind]}</span>
              <span className="trash-list__label">{entry.label}</span>
              <span className="trash-list__time">{timeLeft(entry.deletedAt)}</span>
              <button className="btn btn--icon" onClick={() => restoreFromTrash(id)} title="Restore">
                <RotateCcw size={15} />
              </button>
              <button
                className="btn btn--icon btn--danger"
                onClick={() => {
                  if (window.confirm(`Delete "${entry.label}" forever? This can't be undone.`)) {
                    deleteForever(id);
                  }
                }}
                title="Delete forever"
              >
                <Trash2 size={15} />
              </button>
            </li>
          );
        })}
        {sortedIds.length === 0 && <li className="empty-row">Nothing in the trash.</li>}
      </ul>
    </section>
  );
}
