import { useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { desktop, isDesktop } from '@/lib/desktop';
import { Plus, Trash2, Eye, EyeOff, Copy } from 'lucide-react';

export function Vault() {
  const vaultEntryIds = useAppStore((s) => s.data.vaultEntryIds);
  const vaultEntries = useAppStore((s) => s.data.vaultEntries);
  const addVaultEntry = useAppStore((s) => s.addVaultEntry);
  const updateVaultEntry = useAppStore((s) => s.updateVaultEntry);
  const removeVaultEntry = useAppStore((s) => s.removeVaultEntry);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  const [newLabel, setNewLabel] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const selected = selectedId ? vaultEntries[selectedId] : undefined;

  async function createEntry() {
    if (!newLabel.trim() || !isDesktop()) return;
    const cipher = newPassword ? await desktop().vaultEncrypt(newPassword) : '';
    const id = addVaultEntry({ label: newLabel.trim(), username: newUsername.trim(), passwordCipher: cipher, notes: '' });
    setNewLabel('');
    setNewUsername('');
    setNewPassword('');
    setSelectedId(id);
  }

  async function reveal(id: string, cipher: string) {
    if (!isDesktop()) return;
    const plain = cipher ? await desktop().vaultDecrypt(cipher) : '';
    setRevealed((r) => ({ ...r, [id]: plain }));
  }

  function hide(id: string) {
    setRevealed((r) => {
      const next = { ...r };
      delete next[id];
      return next;
    });
  }

  async function changePassword(id: string, plain: string) {
    if (!isDesktop()) return;
    const cipher = plain ? await desktop().vaultEncrypt(plain) : '';
    updateVaultEntry(id, { passwordCipher: cipher });
    hide(id);
  }

  async function copyPassword(cipher: string) {
    if (!cipher || !isDesktop()) return;
    const plain = await desktop().vaultDecrypt(cipher);
    await navigator.clipboard.writeText(plain);
  }

  if (!isDesktop()) {
    return (
      <section className="panel">
        <header className="panel__header">
          <h1>Vault</h1>
        </header>
        <div className="banner banner--warn">The Vault needs the desktop app — it encrypts with your Mac's own login.</div>
      </section>
    );
  }

  return (
    <section className="panel panel--split">
      <div className="cheatsheet-list">
        <header className="panel__header panel__header--tight">
          <h1>Vault</h1>
        </header>
        <p className="modal__hint">
          Passwords are encrypted with this Mac's own login — they can only be read back here, by you.
        </p>
        <ul className="cheatsheet-list__items">
          {vaultEntryIds.map((id) => {
            const entry = vaultEntries[id];
            if (!entry) return null;
            return (
              <li key={id}>
                <button
                  className={`cheatsheet-list__item${selectedId === id ? ' cheatsheet-list__item--active' : ''}`}
                  onClick={() => setSelectedId(id)}
                >
                  <span className="cheatsheet-list__title">{entry.label}</span>
                  <span className="cheatsheet-list__category">{entry.username}</span>
                </button>
              </li>
            );
          })}
          {vaultEntryIds.length === 0 && <li className="empty-row">No entries yet.</li>}
        </ul>

        <div className="vault-add">
          <input className="field" placeholder="Label, e.g. Studio Wi-Fi" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
          <input className="field" placeholder="Username (optional)" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
          <input
            className="field"
            type="password"
            placeholder="Password (optional)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button className="btn btn--accent" onClick={createEntry} disabled={!newLabel.trim()}>
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      <div className="cheatsheet-editor">
        {selected ? (
          <>
            <div className="cheatsheet-editor__row">
              <input
                className="field field--title"
                value={selected.label}
                onChange={(e) => updateVaultEntry(selected.id, { label: e.target.value })}
              />
              <button
                className="btn btn--icon btn--danger"
                onClick={() => {
                  if (window.confirm(`Move "${selected.label}" to trash?`)) {
                    removeVaultEntry(selected.id);
                    setSelectedId(null);
                  }
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="form-row">
              <label>Username</label>
              <input
                className="field"
                value={selected.username}
                onChange={(e) => updateVaultEntry(selected.id, { username: e.target.value })}
              />
            </div>

            <div className="form-row">
              <label>Password</label>
              <div className="vault-password-row">
                <input
                  className="field"
                  type="text"
                  value={revealed[selected.id] ?? '••••••••'}
                  readOnly={revealed[selected.id] === undefined}
                  onChange={(e) => setRevealed((r) => ({ ...r, [selected.id]: e.target.value }))}
                  onBlur={(e) => {
                    if (revealed[selected.id] !== undefined) changePassword(selected.id, e.target.value);
                  }}
                />
                {revealed[selected.id] === undefined ? (
                  <button className="btn btn--icon" onClick={() => reveal(selected.id, selected.passwordCipher)} title="Show">
                    <Eye size={15} />
                  </button>
                ) : (
                  <button className="btn btn--icon" onClick={() => hide(selected.id)} title="Hide">
                    <EyeOff size={15} />
                  </button>
                )}
                <button className="btn btn--icon" onClick={() => copyPassword(selected.passwordCipher)} title="Copy">
                  <Copy size={15} />
                </button>
              </div>
            </div>

            <div className="form-row">
              <label>Notes</label>
              <textarea
                className="field field--body"
                value={selected.notes}
                onChange={(e) => updateVaultEntry(selected.id, { notes: e.target.value })}
                placeholder="Anything else worth remembering — not encrypted, so skip other passwords here."
              />
            </div>
          </>
        ) : (
          <p className="empty-row">Select an entry, or add a new one.</p>
        )}
      </div>
    </section>
  );
}
