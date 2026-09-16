import { useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { Modal } from '@/components/common/Modal';
import { desktop, isDesktop } from '@/lib/desktop';
import { FileUp } from 'lucide-react';

interface AddShortcutDialogProps {
  onClose: () => void;
}

const SHORTCUT_FILTERS = [
  { name: 'Apps & HTML', extensions: ['app', 'html', 'htm'] },
  { name: 'All files', extensions: ['*'] },
];

export function AddShortcutDialog({ onClose }: AddShortcutDialogProps) {
  const addShortcut = useAppStore((s) => s.addShortcut);
  const [targetPath, setTargetPath] = useState('');
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('🧰');

  async function pickTarget() {
    if (!isDesktop()) return;
    const file = await desktop().pickFile(SHORTCUT_FILTERS);
    if (!file) return;
    setTargetPath(file);
    if (!label) {
      const base = file.split('/').pop() ?? file;
      setLabel(base.replace(/\.[^.]+$/, ''));
    }
  }

  function submit() {
    if (!targetPath || !label.trim()) return;
    addShortcut({ label: label.trim(), icon: icon || '🧰', targetPath });
    onClose();
  }

  return (
    <Modal
      title="Add Tool Shortcut"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--accent" onClick={submit} disabled={!targetPath || !label.trim()}>
            Add
          </button>
        </>
      }
    >
      <div className="form-row">
        <label>App, HTML file, or document</label>
        <button className="btn" onClick={pickTarget}>
          <FileUp size={16} />
          {targetPath ? targetPath.split('/').pop() : 'Choose…'}
        </button>
      </div>
      <div className="form-row">
        <label>Button label</label>
        <input className="field" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Icon (emoji)</label>
        <input className="field field--icon" value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={2} />
      </div>
    </Modal>
  );
}
