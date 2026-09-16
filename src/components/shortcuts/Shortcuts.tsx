import { useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { AddShortcutDialog } from './AddShortcutDialog';
import { desktop, isDesktop } from '@/lib/desktop';
import { Plus, Trash2 } from 'lucide-react';

export function Shortcuts() {
  const shortcutIds = useAppStore((s) => s.data.shortcutIds);
  const shortcuts = useAppStore((s) => s.data.shortcuts);
  const removeShortcut = useAppStore((s) => s.removeShortcut);

  const [adding, setAdding] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [errorFor, setErrorFor] = useState<string | null>(null);

  async function launch(targetPath: string, id: string) {
    if (!isDesktop()) return;
    setErrorFor(null);
    const err = await desktop().openPath(targetPath);
    if (err) setErrorFor(id);
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h1>Tools</h1>
          <p className="panel__subtitle">Launch the other apps and HTML organizers you already built.</p>
        </div>
        <div className="panel__actions">
          <button className="btn" onClick={() => setManageMode((m) => !m)}>
            {manageMode ? 'Done' : 'Manage'}
          </button>
          <button className="btn btn--accent" onClick={() => setAdding(true)}>
            <Plus size={16} />
            Add Tool
          </button>
        </div>
      </header>

      <div className="card-grid">
        {shortcutIds.map((id) => {
          const sc = shortcuts[id];
          if (!sc) return null;
          return (
            <div key={id} className="launch-card">
              <button
                className="launch-card__body"
                onClick={() => (manageMode ? undefined : launch(sc.targetPath, id))}
                disabled={manageMode}
              >
                <span className="launch-card__icon">{sc.icon}</span>
                <span className="launch-card__label">{sc.label}</span>
              </button>
              {manageMode && (
                <button className="launch-card__remove" onClick={() => removeShortcut(id)}>
                  <Trash2 size={14} />
                </button>
              )}
              {errorFor === id && <p className="form-error">Couldn't open that.</p>}
            </div>
          );
        })}
        {shortcutIds.length === 0 && <p className="empty-row">No tools added yet.</p>}
      </div>

      {adding && <AddShortcutDialog onClose={() => setAdding(false)} />}
    </section>
  );
}
