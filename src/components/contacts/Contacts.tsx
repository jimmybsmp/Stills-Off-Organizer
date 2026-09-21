import { useMemo, useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { Plus, Trash2, Search } from 'lucide-react';

export function Contacts() {
  const contactIds = useAppStore((s) => s.data.contactIds);
  const contacts = useAppStore((s) => s.data.contacts);
  const addContact = useAppStore((s) => s.addContact);
  const updateContact = useAppStore((s) => s.updateContact);
  const removeContact = useAppStore((s) => s.removeContact);

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contactIds;
    return contactIds.filter((id) => {
      const c = contacts[id];
      if (!c) return false;
      return (
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    });
  }, [query, contactIds, contacts]);

  const selected = selectedId ? contacts[selectedId] : undefined;

  function createNew() {
    const id = addContact({ name: 'New contact', role: '', phone: '', email: '', notes: '' });
    setSelectedId(id);
  }

  return (
    <section className="panel panel--split">
      <div className="cheatsheet-list">
        <header className="panel__header panel__header--tight">
          <h1>Contacts</h1>
          <button className="btn btn--accent" onClick={createNew}>
            <Plus size={16} />
            New
          </button>
        </header>
        <div className="search-field">
          <Search size={14} />
          <input placeholder="Search contacts…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <ul className="cheatsheet-list__items">
          {filteredIds.map((id) => {
            const c = contacts[id];
            if (!c) return null;
            return (
              <li key={id}>
                <button
                  className={`cheatsheet-list__item${selectedId === id ? ' cheatsheet-list__item--active' : ''}`}
                  onClick={() => setSelectedId(id)}
                >
                  <span className="cheatsheet-list__title">{c.name || 'Unnamed'}</span>
                  <span className="cheatsheet-list__category">{c.role}</span>
                </button>
              </li>
            );
          })}
          {filteredIds.length === 0 && <li className="empty-row">No contacts found.</li>}
        </ul>
      </div>

      <div className="cheatsheet-editor">
        {selected ? (
          <>
            <div className="cheatsheet-editor__row">
              <input
                className="field field--title"
                value={selected.name}
                onChange={(e) => updateContact(selected.id, { name: e.target.value })}
                placeholder="Name"
              />
              <button
                className="btn btn--icon btn--danger"
                onClick={() => {
                  if (window.confirm(`Move "${selected.name}" to trash?`)) {
                    removeContact(selected.id);
                    setSelectedId(null);
                  }
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <input
              className="field"
              value={selected.role}
              onChange={(e) => updateContact(selected.id, { role: e.target.value })}
              placeholder="Role, e.g. Retoucher"
            />
            <div className="form-row">
              <label>Phone</label>
              <input className="field" value={selected.phone} onChange={(e) => updateContact(selected.id, { phone: e.target.value })} />
            </div>
            <div className="form-row">
              <label>Email</label>
              <input className="field" value={selected.email} onChange={(e) => updateContact(selected.id, { email: e.target.value })} />
            </div>
            <textarea
              className="field field--body"
              value={selected.notes}
              onChange={(e) => updateContact(selected.id, { notes: e.target.value })}
              placeholder="Notes…"
            />
          </>
        ) : (
          <p className="empty-row">Select a contact, or create a new one.</p>
        )}
      </div>
    </section>
  );
}
