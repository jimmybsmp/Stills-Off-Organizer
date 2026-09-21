import { useMemo, useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { Plus, Trash2, Search } from 'lucide-react';

export function CheatSheets() {
  const cheatSheetIds = useAppStore((s) => s.data.cheatSheetIds);
  const cheatSheets = useAppStore((s) => s.data.cheatSheets);
  const addCheatSheet = useAppStore((s) => s.addCheatSheet);
  const updateCheatSheet = useAppStore((s) => s.updateCheatSheet);
  const removeCheatSheet = useAppStore((s) => s.removeCheatSheet);

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cheatSheetIds;
    return cheatSheetIds.filter((id) => {
      const sheet = cheatSheets[id];
      if (!sheet) return false;
      return (
        sheet.title.toLowerCase().includes(q) ||
        sheet.category.toLowerCase().includes(q) ||
        sheet.body.toLowerCase().includes(q)
      );
    });
  }, [query, cheatSheetIds, cheatSheets]);

  const selected = selectedId ? cheatSheets[selectedId] : undefined;

  function createNew() {
    const id = addCheatSheet({ title: 'New cheat sheet', category: 'General', body: '' });
    setSelectedId(id);
  }

  return (
    <section className="panel panel--split">
      <div className="cheatsheet-list">
        <header className="panel__header panel__header--tight">
          <h1>Cheat Sheets</h1>
          <button className="btn btn--accent" onClick={createNew}>
            <Plus size={16} />
            New
          </button>
        </header>
        <div className="search-field">
          <Search size={14} />
          <input
            placeholder="Search cheat sheets…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <ul className="cheatsheet-list__items">
          {filteredIds.map((id) => {
            const sheet = cheatSheets[id];
            if (!sheet) return null;
            return (
              <li key={id}>
                <button
                  className={`cheatsheet-list__item${selectedId === id ? ' cheatsheet-list__item--active' : ''}`}
                  onClick={() => setSelectedId(id)}
                >
                  <span className="cheatsheet-list__title">{sheet.title || 'Untitled'}</span>
                  <span className="cheatsheet-list__category">{sheet.category}</span>
                </button>
              </li>
            );
          })}
          {filteredIds.length === 0 && <li className="empty-row">No cheat sheets found.</li>}
        </ul>
      </div>

      <div className="cheatsheet-editor">
        {selected ? (
          <>
            <div className="cheatsheet-editor__row">
              <input
                className="field field--title"
                value={selected.title}
                onChange={(e) => updateCheatSheet(selected.id, { title: e.target.value })}
                placeholder="Title"
              />
              <button
                className="btn btn--icon btn--danger"
                onClick={() => {
                  if (window.confirm(`Move "${selected.title || 'Untitled'}" to trash?`)) {
                    removeCheatSheet(selected.id);
                    setSelectedId(null);
                  }
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <input
              className="field"
              value={selected.category}
              onChange={(e) => updateCheatSheet(selected.id, { category: e.target.value })}
              placeholder="Category, e.g. Retouching"
            />
            <textarea
              className="field field--body"
              value={selected.body}
              onChange={(e) => updateCheatSheet(selected.id, { body: e.target.value })}
              placeholder="Steps, shortcuts, or notes for this task…"
            />
          </>
        ) : (
          <p className="empty-row">Select a cheat sheet, or create a new one.</p>
        )}
      </div>
    </section>
  );
}
