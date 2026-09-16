import { useState } from 'react';
import { useAppStore } from '@/state/useAppStore';
import { Modal } from '@/components/common/Modal';
import { desktop, isDesktop } from '@/lib/desktop';
import { FileUp } from 'lucide-react';

interface AddTemplateDialogProps {
  onClose: () => void;
}

const TEMPLATE_FILTERS = [
  { name: 'Office documents', extensions: ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'] },
  { name: 'All files', extensions: ['*'] },
];

export function AddTemplateDialog({ onClose }: AddTemplateDialogProps) {
  const docTypeIds = useAppStore((s) => s.data.docTypeIds);
  const docTypes = useAppStore((s) => s.data.docTypes);
  const addTemplate = useAppStore((s) => s.addTemplate);

  const [sourcePath, setSourcePath] = useState('');
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('📄');
  const [defaultDocTypeId, setDefaultDocTypeId] = useState<string>('');

  async function pickFile() {
    if (!isDesktop()) return;
    const file = await desktop().pickFile(TEMPLATE_FILTERS);
    if (!file) return;
    setSourcePath(file);
    if (!label) {
      const base = file.split('/').pop() ?? file;
      setLabel(base.replace(/\.[^.]+$/, ''));
    }
  }

  function submit() {
    if (!sourcePath || !label.trim()) return;
    const extension = sourcePath.split('.').pop() ?? '';
    addTemplate({
      label: label.trim(),
      icon: icon || '📄',
      sourcePath,
      extension,
      defaultDocTypeId: defaultDocTypeId || null,
    });
    onClose();
  }

  return (
    <Modal
      title="Add Template"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--accent" onClick={submit} disabled={!sourcePath || !label.trim()}>
            Add Template
          </button>
        </>
      }
    >
      <div className="form-row">
        <label>Template file</label>
        <button className="btn" onClick={pickFile}>
          <FileUp size={16} />
          {sourcePath ? sourcePath.split('/').pop() : 'Choose Word or Excel file…'}
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
      <div className="form-row">
        <label>Default document type</label>
        <select
          className="field"
          value={defaultDocTypeId}
          onChange={(e) => setDefaultDocTypeId(e.target.value)}
        >
          <option value="">Ask each time</option>
          {docTypeIds.map((id) => (
            <option key={id} value={id}>
              {docTypes[id]?.label}
            </option>
          ))}
        </select>
      </div>
    </Modal>
  );
}
