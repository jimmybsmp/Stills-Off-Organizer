import { useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { Modal } from '@/components/common/Modal';
import { desktop, isDesktop } from '@/lib/desktop';
import { Folder, Trash2 } from 'lucide-react';

interface DocTypeManagerProps {
  onClose: () => void;
}

export function DocTypeManager({ onClose }: DocTypeManagerProps) {
  const docTypeIds = useAppStore((s) => s.data.docTypeIds);
  const docTypes = useAppStore((s) => s.data.docTypes);
  const addDocType = useAppStore((s) => s.addDocType);
  const updateDocType = useAppStore((s) => s.updateDocType);
  const removeDocType = useAppStore((s) => s.removeDocType);

  const [label, setLabel] = useState('');
  const [folder, setFolder] = useState('');
  const [dateSubfolder, setDateSubfolder] = useState(false);

  async function pickFolder() {
    if (!isDesktop()) return;
    const dir = await desktop().pickFolder();
    if (dir) setFolder(dir);
  }

  function submit() {
    if (!label.trim() || !folder.trim()) return;
    addDocType({ label: label.trim(), destinationFolder: folder.trim(), dateSubfolder });
    setLabel('');
    setFolder('');
    setDateSubfolder(false);
  }

  return (
    <Modal title="Document Types & Folders" onClose={onClose} wide>
      <p className="modal__hint">
        Each document type maps to a folder. When someone launches a template, they'll pick one
        of these — the new file lands in its folder automatically.
      </p>

      <ul className="doctype-list">
        {docTypeIds.map((id) => {
          const dt = docTypes[id];
          if (!dt) return null;
          return (
            <li key={id} className="doctype-list__row">
              <input
                className="field field--inline"
                value={dt.label}
                onChange={(e) => updateDocType(id, { label: e.target.value })}
              />
              <span className="doctype-list__path" title={dt.destinationFolder}>
                {dt.destinationFolder}
              </span>
              <label className="doctype-list__toggle">
                <input
                  type="checkbox"
                  checked={dt.dateSubfolder}
                  onChange={(e) => updateDocType(id, { dateSubfolder: e.target.checked })}
                />
                monthly subfolder
              </label>
              <button className="btn btn--icon btn--danger" onClick={() => removeDocType(id)}>
                <Trash2 size={16} />
              </button>
            </li>
          );
        })}
        {docTypeIds.length === 0 && <li className="empty-row">No document types yet.</li>}
      </ul>

      <div className="doctype-add">
        <input
          className="field"
          placeholder="Type name, e.g. Call Sheet"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button className="btn" onClick={pickFolder}>
          <Folder size={16} />
          {folder ? folder : 'Choose folder…'}
        </button>
        <label className="doctype-list__toggle">
          <input
            type="checkbox"
            checked={dateSubfolder}
            onChange={(e) => setDateSubfolder(e.target.checked)}
          />
          monthly subfolder
        </label>
        <button className="btn btn--accent" onClick={submit} disabled={!label.trim() || !folder.trim()}>
          Add
        </button>
      </div>
    </Modal>
  );
}
