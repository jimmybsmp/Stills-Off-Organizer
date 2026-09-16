import { useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { Modal } from '@/components/common/Modal';
import { desktop, isDesktop } from '@/lib/desktop';
import { Folder } from 'lucide-react';

interface AddDriveDialogProps {
  onClose: () => void;
}

export function AddDriveDialog({ onClose }: AddDriveDialogProps) {
  const addDrive = useAppStore((s) => s.addDrive);
  const [label, setLabel] = useState('');
  const [path, setPath] = useState('');
  const [icon, setIcon] = useState('💾');

  async function pickVolume() {
    if (!isDesktop()) return;
    const dir = await desktop().pickFolder();
    if (dir) setPath(dir);
  }

  function submit() {
    if (!label.trim() || !path.trim()) return;
    addDrive({ label: label.trim(), icon: icon || '💾', path: path.trim() });
    onClose();
  }

  return (
    <Modal
      title="Add Drive"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--accent" onClick={submit} disabled={!label.trim() || !path.trim()}>
            Add
          </button>
        </>
      }
    >
      <div className="form-row">
        <label>Name</label>
        <input className="field" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Volume path or network address</label>
        <div className="field-with-button">
          <input
            className="field"
            placeholder="/Volumes/Archive or smb://server/share"
            value={path}
            onChange={(e) => setPath(e.target.value)}
          />
          <button className="btn btn--icon" onClick={pickVolume} title="Browse for a mounted volume">
            <Folder size={16} />
          </button>
        </div>
      </div>
      <div className="form-row">
        <label>Icon (emoji)</label>
        <input className="field field--icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={2} />
      </div>
    </Modal>
  );
}
